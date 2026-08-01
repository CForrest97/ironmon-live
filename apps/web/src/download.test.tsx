// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { checksumUrl, DownloadCompanion, downloadUrl } from "./download";

afterEach(cleanup);

describe("companion download", () => {
  it("links each named macOS architecture to its R2 artifact", () => {
    render(<DownloadCompanion />);
    expect(screen.getByRole("link", { name: "Download for Apple Silicon" })).toHaveAttribute(
      "href",
      downloadUrl("aarch64"),
    );
    expect(screen.getByRole("link", { name: "Download for Intel" })).toHaveAttribute(
      "href",
      downloadUrl("x86_64"),
    );
    expect(screen.getByRole("link", { name: "Apple Silicon SHA-256 checksum" })).toHaveAttribute(
      "href",
      checksumUrl("aarch64"),
    );
    expect(screen.getByRole("link", { name: "Intel SHA-256 checksum" })).toHaveAttribute(
      "href",
      checksumUrl("x86_64"),
    );
    expect(screen.getByLabelText("System requirement")).toHaveTextContent("13");
  });

  it("does not offer dead links when a release is unavailable", () => {
    render(<DownloadCompanion available={false} />);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.getAllByText("Temporarily unavailable")).toHaveLength(2);
  });
});
