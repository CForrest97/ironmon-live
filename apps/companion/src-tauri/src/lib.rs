use std::{
    error::Error as StdError,
    fs::{self, OpenOptions},
    io::Write,
    path::{Path, PathBuf},
};

use reqwest::Url;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

const DIAGNOSTIC_LOG_NAME: &str = "publish-diagnostics.jsonl";
const DIAGNOSTIC_LOG_MAX_BYTES: u64 = 256 * 1024;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PublishRequest {
    url: String,
    body: String,
    occurred_at: u64,
}

#[derive(Serialize)]
struct PublishResponse {
    status: u16,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct PublishDiagnostic {
    occurred_at: u64,
    endpoint: String,
    category: &'static str,
    details: Vec<String>,
}

fn is_live_publish_url(url: &Url) -> bool {
    let Some(code) = url
        .path()
        .strip_prefix("/api/channels/")
        .and_then(|path| path.strip_suffix("/publish"))
    else {
        return false;
    };
    url.scheme() == "https"
        && url.host_str() == Some("live.craigforrest.co.uk")
        && url.port().is_none()
        && url.query().is_none()
        && url.fragment().is_none()
        && code.len() == 5
        && code.chars().all(|character| character.is_ascii_digit())
}

fn redacted_endpoint(url: &Url) -> String {
    format!(
        "{}://{}/api/channels/[redacted]/publish",
        url.scheme(),
        url.host_str().unwrap_or("invalid")
    )
}

fn diagnostic_log_path(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .home_dir()
        .map(|home| home.join(".ironmon-live").join(DIAGNOSTIC_LOG_NAME))
        .map_err(|error| format!("could not resolve the home directory: {error}"))
}

fn trim_diagnostic_log(path: &Path) -> Result<(), String> {
    if !path.exists()
        || fs::metadata(path).map_err(|error| error.to_string())?.len() <= DIAGNOSTIC_LOG_MAX_BYTES
    {
        return Ok(());
    }
    let contents = fs::read(path).map_err(|error| error.to_string())?;
    let retained = &contents[contents
        .len()
        .saturating_sub((DIAGNOSTIC_LOG_MAX_BYTES / 2) as usize)..];
    let first_complete_line = retained
        .iter()
        .position(|byte| *byte == b'\n')
        .map_or(0, |index| index + 1);
    fs::write(path, &retained[first_complete_line..]).map_err(|error| error.to_string())
}

fn append_diagnostic_to_path(path: &Path, diagnostic: &PublishDiagnostic) -> Result<(), String> {
    let parent = path
        .parent()
        .ok_or_else(|| "could not resolve the diagnostic-log directory".to_string())?;
    fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    trim_diagnostic_log(&path)?;
    let line = serde_json::to_string(diagnostic).map_err(|error| error.to_string())?;
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
        .map_err(|error| error.to_string())?;
    writeln!(file, "{line}").map_err(|error| error.to_string())?;
    Ok(())
}

fn append_diagnostic(app: &AppHandle, diagnostic: &PublishDiagnostic) -> Result<PathBuf, String> {
    let path = diagnostic_log_path(app)?;
    append_diagnostic_to_path(&path, diagnostic)?;
    Ok(path)
}

fn error_chain(error: &(dyn StdError + 'static), url: &Url) -> Vec<String> {
    let redacted_url = redacted_endpoint(url);
    let mut details = vec![error.to_string().replace(url.as_str(), &redacted_url)];
    let mut source = error.source();
    while let Some(cause) = source {
        details.push(cause.to_string().replace(url.as_str(), &redacted_url));
        source = cause.source();
    }
    details
}

fn saved_failure(
    app: &AppHandle,
    occurred_at: u64,
    endpoint: String,
    category: &'static str,
    details: Vec<String>,
) -> String {
    let diagnostic = PublishDiagnostic {
        occurred_at,
        endpoint,
        category,
        details,
    };
    match append_diagnostic(app, &diagnostic) {
        Ok(path) => format!(
            "Publication {category} failure. Details saved to {}.",
            path.display()
        ),
        Err(error) => {
            format!("Publication {category} failure. Diagnostic log could not be saved: {error}")
        }
    }
}

#[tauri::command]
async fn publish_to_live_channel(
    app: AppHandle,
    request: PublishRequest,
) -> Result<PublishResponse, String> {
    let url = match Url::parse(&request.url) {
        Ok(url) => url,
        Err(error) => {
            return Err(saved_failure(
                &app,
                request.occurred_at,
                "invalid publish URL".to_string(),
                "configuration",
                vec![error.to_string()],
            ));
        }
    };
    let endpoint = redacted_endpoint(&url);
    if !is_live_publish_url(&url) {
        return Err(saved_failure(
            &app,
            request.occurred_at,
            endpoint,
            "configuration",
            vec!["publish URL is outside the companion's allowed production endpoint".to_string()],
        ));
    }
    let response = match reqwest::Client::new()
        .put(url.clone())
        .header("content-type", "application/json")
        .body(request.body)
        .send()
        .await
    {
        Ok(response) => response,
        Err(error) => {
            let category = if error.is_timeout() {
                "timeout"
            } else if error.is_connect() {
                "connection"
            } else if error.is_request() {
                "request"
            } else {
                "transport"
            };
            return Err(saved_failure(
                &app,
                request.occurred_at,
                endpoint,
                category,
                error_chain(&error, &url),
            ));
        }
    };
    if !response.status().is_success() {
        let status = response.status().as_u16();
        return Err(saved_failure(
            &app,
            request.occurred_at,
            endpoint,
            "http",
            vec![format!("server returned HTTP {status}")],
        ));
    }
    Ok(PublishResponse {
        status: response.status().as_u16(),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![publish_to_live_channel])
        .run(tauri::generate_context!())
        .expect("failed to run IronMON Live companion");
}

#[cfg(test)]
mod tests {
    use std::{fs, time::SystemTime};

    use super::{
        append_diagnostic_to_path, is_live_publish_url, PublishDiagnostic, DIAGNOSTIC_LOG_MAX_BYTES,
    };
    use reqwest::Url;

    #[test]
    fn accepts_only_the_configured_production_publish_endpoint() {
        let url = Url::parse("https://live.craigforrest.co.uk/api/channels/79350/publish").unwrap();
        assert!(is_live_publish_url(&url));
        assert!(!is_live_publish_url(
            &Url::parse("https://live.craigforrest.co.uk/api/channels/79350/snapshot").unwrap()
        ));
        assert!(!is_live_publish_url(
            &Url::parse("https://example.test/api/channels/79350/publish").unwrap()
        ));
    }

    #[test]
    fn retains_bounded_json_diagnostics() {
        let directory = std::env::temp_dir().join(format!(
            "ironmon-live-diagnostics-{}",
            SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let path = directory.join("publish-diagnostics.jsonl");
        fs::create_dir_all(&directory).unwrap();
        fs::write(
            &path,
            format!("{}\n", "x".repeat((DIAGNOSTIC_LOG_MAX_BYTES + 1) as usize)),
        )
        .unwrap();
        append_diagnostic_to_path(
            &path,
            &PublishDiagnostic {
                occurred_at: 1_786_092_000_000,
                endpoint: "https://live.craigforrest.co.uk/api/channels/[redacted]/publish"
                    .to_string(),
                category: "connection",
                details: vec!["dns error".to_string()],
            },
        )
        .unwrap();
        let contents = fs::read_to_string(&path).unwrap();
        assert!(contents.len() < (DIAGNOSTIC_LOG_MAX_BYTES / 2) as usize);
        assert_eq!(
            serde_json::from_str::<serde_json::Value>(contents.trim()).unwrap()["category"],
            "connection"
        );
        fs::remove_dir_all(directory).unwrap();
    }
}
