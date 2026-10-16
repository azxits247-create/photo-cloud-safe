import { describe, expect, it } from "vitest";
import { isInstalledMode } from "@/lib/installation";

describe("Installed-only app access", () => {
  it("blocks a normal browser even after a download or an install event", () => {
    expect(isInstalledMode(false, false)).toBe(false);
    expect(isInstalledMode(false, undefined)).toBe(false);
  });
  it("allows an app opened in standalone mode", () => {
    expect(isInstalledMode(true, undefined)).toBe(true);
  });
  it("allows an iOS home-screen app", () => {
    expect(isInstalledMode(false, true)).toBe(true);
  });
});