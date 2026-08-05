// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SetupCompanion } from "./setup";

afterEach(cleanup);

describe("companion setup", () => {
  it("explains extension installation, enabling, and the live state", () => {
    render(<SetupCompanion />);

    expect(screen.getByRole("heading", { name: "Bring your Tracker run live." })).toBeVisible();
    expect(screen.getByText("IronMONLive.lua")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Enable IronMON Live in Tracker" })).toBeVisible();
    fireEvent.click(screen.getByText("Using mGBA or cannot find the extension controls?"));
    expect(screen.getByText("INSTALLEXT()")).toBeVisible();
    expect(screen.getByText('OPTION "XX"')).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Use the companion from the menu bar" }),
    ).toBeVisible();
    expect(screen.getByText("Waiting for Tracker")).toBeVisible();
    expect(screen.getByText("Live")).toBeVisible();
    expect(screen.getByRole("link", { name: "Download the companion" })).toHaveAttribute(
      "href",
      "/download",
    );
  });
});
