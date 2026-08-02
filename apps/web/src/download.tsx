import { useEffect, useState } from "react";
import { TopBar } from "./TopBar.tsx";

interface CompanionRelease {
  version: string;
  minimumMacOS: string;
  baseUrl: string;
}

const fetchCompanionRelease = async (): Promise<CompanionRelease | null> => {
  try {
    const response = await fetch(
      "https://downloads.live.craigforrest.co.uk/companion/latest.json",
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as { version?: string };
    if (!data.version) throw new Error("Missing version in latest.json");
    return {
      version: data.version,
      minimumMacOS: "13",
      baseUrl: `https://downloads.live.craigforrest.co.uk/companion/v${data.version}`,
    };
  } catch (error) {
    // In development, provide fallback data for testing
    if (import.meta.env.DEV) {
      console.warn(
        "Failed to fetch latest.json (expected in dev due to CORS):",
        error instanceof Error ? error.message : String(error),
      );
      return {
        version: "dev-build",
        minimumMacOS: "13",
        baseUrl: "https://downloads.live.craigforrest.co.uk/companion/v-dev",
      };
    }
    return null;
  }
};

export const downloadUrl = (version: string, architecture: "aarch64" | "x86_64") =>
  `https://downloads.live.craigforrest.co.uk/companion/v${version}/IronMON-Live_${version}_${architecture}.dmg`;

export const checksumUrl = (version: string, architecture: "aarch64" | "x86_64") =>
  `${downloadUrl(version, architecture)}.sha256`;

export const DownloadCompanion = ({ available = true }: { readonly available?: boolean }) => {
  const [release, setRelease] = useState<CompanionRelease | null>(null);

  useEffect(() => {
    fetchCompanionRelease().then(setRelease);
  }, []);

  if (!release) {
    return (
      <>
        <TopBar />
        <main className="download">
          <p className="eyebrow">IronMON Live companion</p>
          <h1>Keep your run live.</h1>
          <p className="lede">
            The quiet macOS menu-bar utility that connects IronMON Tracker to your live channel.
          </p>
          <div className="download-grid">
            <article className="download-card">
              <h2>Apple Silicon</h2>
              <p>M1, M2, M3, M4, and later Apple processors.</p>
              <span>Loading release information...</span>
            </article>
            <article className="download-card">
              <h2>Intel</h2>
              <p>Intel-based Mac computers.</p>
              <span>Loading release information...</span>
            </article>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <main className="download">
        <p className="eyebrow">IronMON Live companion</p>
        <h1>Keep your run live.</h1>
        <p className="lede">
          The quiet macOS menu-bar utility that connects IronMON Tracker to your live channel.
        </p>
        <div className="download-grid">
          <article className="download-card">
            <h2>Apple Silicon</h2>
            <p>M1, M2, M3, M4, and later Apple processors.</p>
            {available ? (
              <div>
                <a className="button" href={downloadUrl(release.version, "aarch64")}>
                  Download for Apple Silicon
                </a>
                <a href={checksumUrl(release.version, "aarch64")}>Apple Silicon SHA-256 checksum</a>
              </div>
            ) : (
              <span>Temporarily unavailable</span>
            )}
          </article>
          <article className="download-card">
            <h2>Intel</h2>
            <p>Intel-based Mac computers.</p>
            {available ? (
              <div>
                <a className="button" href={downloadUrl(release.version, "x86_64")}>
                  Download for Intel
                </a>
                <a href={checksumUrl(release.version, "x86_64")}>Intel SHA-256 checksum</a>
              </div>
            ) : (
              <span>Temporarily unavailable</span>
            )}
          </article>
        </div>
        <section className="release-details">
          <h2>Version {release.version}</h2>
          <p aria-label="System requirement">
            Requires macOS {release.minimumMacOS} or later.
          </p>
          <p>
            This independent build is not Developer ID signed or notarized. macOS may require you to
            approve it in Privacy &amp; Security after download.
          </p>
          <h3>Release notes</h3>
          <p>
            First companion release with menu-bar status, guided Tracker setup, automatic recovery,
            and prompted updates.
          </p>
        </section>
      </main>
    </>
  );
};
