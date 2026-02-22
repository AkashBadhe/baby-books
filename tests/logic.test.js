import { describe, expect, it } from "vitest";
import { wrapIndex, detectSwipe } from "../src/logic.js";

describe("wrapIndex", () => {
  it("wraps forward overflow", () => {
    expect(wrapIndex(26, 26)).toBe(0);
  });

  it("wraps backward underflow", () => {
    expect(wrapIndex(-1, 26)).toBe(25);
  });
});

describe("detectSwipe", () => {
  it("detects left swipe", () => {
    expect(detectSwipe({ startX: 200, startY: 100, endX: 120, endY: 104 })).toBe("left");
  });

  it("detects right swipe", () => {
    expect(detectSwipe({ startX: 80, startY: 100, endX: 150, endY: 106 })).toBe("right");
  });

  it("ignores short movement", () => {
    expect(detectSwipe({ startX: 100, startY: 100, endX: 130, endY: 100 })).toBeNull();
  });

  it("ignores mostly vertical movement", () => {
    expect(detectSwipe({ startX: 100, startY: 100, endX: 155, endY: 170 })).toBeNull();
  });
});
