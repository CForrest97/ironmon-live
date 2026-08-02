import release from "./companion-release.json";
import { TopBar } from "./TopBar.tsx";

export const companionRelease = {
  version: release.version,
  minimumMacOS: "13",
  baseUrl: `https://downloads.live.craigforrest.co.uk/companion/v${release.version}`,
} as const;

export const downloadUrl = (architecture: "aarch64" | "x86_64") =>
  `${companionRelease.baseUrl}/IronMON-Live_${companionRelease.version}_${architecture}.dmg`;

export const checksumUrl = (architecture: "aarch64" | "x86_64") =>
  `${downloadUrl(architecture)}.sha256`;

export const DownloadCompanion = ({ available = true }: { readonly available?: boolean }) => (
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
              <a className="button" href={downloadUrl("aarch64")}>
                Download for Apple Silicon
              </a>
              <a href={checksumUrl("aarch64")}>Apple Silicon SHA-256 checksum</a>
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
              <a className="button" href={downloadUrl("x86_64")}>
                Download for Intel
              </a>
              <a href={checksumUrl("x86_64")}>Intel SHA-256 checksum</a>
            </div>
          ) : (
            <span>Temporarily unavailable</span>
          )}
        </article>
      </div>
      <section className="release-details">
        <h2>Version {companionRelease.version}</h2>
        <p aria-label="System requirement">
          Requires macOS {companionRelease.minimumMacOS} or later.
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
