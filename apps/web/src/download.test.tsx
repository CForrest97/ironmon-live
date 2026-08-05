// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checksumUrl, DownloadCompanion, downloadUrl } from "./download";

afterEach(cleanup);

const mockLatestJson = {
  version: "0.1.15",
  notes: "Test release",
  pub_date: "2026-08-02T00:00:00Z",
  platforms: {
    "darwin-aarch64": { signature: "sig", url: "url" },
    "darwin-x86_64": { signature: "sig", url: "url" },
  },
};

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockLatestJson),
      }),
    ),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("companion download", () => {
  it("links each named macOS architecture to its R2 artifact", async () => {
    render(<DownloadCompanion />);
    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Download for Apple Silicon" })).toHaveAttribute(
        "href",
        downloadUrl("0.1.15", "aarch64"),
      );
    });
    expect(screen.getByRole("link", { name: "Download for Intel" })).toHaveAttribute(
      "href",
      downloadUrl("0.1.15", "x86_64"),
    );
    expect(screen.getByRole("link", { name: "Apple Silicon SHA-256 checksum" })).toHaveAttribute(
      "href",
      checksumUrl("0.1.15", "aarch64"),
    );
    expect(screen.getByRole("link", { name: "Intel SHA-256 checksum" })).toHaveAttribute(
      "href",
      checksumUrl("0.1.15", "x86_64"),
    );
    expect(screen.getByLabelText("System requirement")).toHaveTextContent("13");
    expect(
      screen.getByRole("link", {
        name: "Open setup guide",
      }),
    ).toHaveAttribute("href", "/setup");
  });

  it("does not offer dead links when a release is unavailable", async () => {
    render(<DownloadCompanion available={false} />);
    await waitFor(() => {
      expect(screen.queryByRole("link", { name: "Download for Apple Silicon" })).toBeNull();
    });
    expect(screen.getByRole("link", { name: "Open setup guide" })).toHaveAttribute(
      "href",
      "/setup",
    );
    expect(screen.getAllByText("Temporarily unavailable")).toHaveLength(2);
  });
});
