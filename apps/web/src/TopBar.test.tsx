// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TopBar } from "./TopBar";

afterEach(cleanup);

describe("top bar", () => {
  it("links the wordmark to the homepage", () => {
    render(<TopBar />);

    expect(screen.getByRole("link", { name: "IronMON Live home" })).toHaveAttribute("href", "/");
  });
});
