import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import ProfileCover from "./ProfileCover";

test('an assigned banner stays the same when the member changes majors', () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  const root = createRoot(container);
  try {
    act(() => root.render(<ProfileCover major="Computer Science" assigned="physics" />));
    expect(container.querySelector('[data-banner-activity]').dataset.bannerActivity).toBe('physics');
    act(() => root.render(<ProfileCover major="Mechanical Engineering" assigned="physics" />));
    expect(container.querySelector('[data-banner-activity]').dataset.bannerActivity).toBe('physics');
  } finally { act(() => root.unmount()); }
});

test("every profile gets a major-based ninja even with an existing uploaded cover", () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  const root = createRoot(container);
  try {
    act(() => root.render(<ProfileCover major="Computer Science" source="https://example.com/existing-cover.jpg" />));
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("[data-banner-activity]").dataset.bannerActivity).toBe("software");
    expect(container.querySelector("[data-member-activity]").dataset.memberActivity).toBe("software");
    act(() => root.render(<ProfileCover major="Mechanical Engineering" source="https://example.com/existing-cover.jpg" />));
    expect(container.querySelector("[data-banner-activity]").dataset.bannerActivity).toBe("mechanical");
    expect(container.querySelector(".member-robot-arm")).not.toBeNull();
    act(() => root.render(<ProfileCover major="Data Science" />));
    expect(container.querySelector("[data-banner-activity]").dataset.bannerActivity).toBe("data");
    expect(container.querySelectorAll(".member-chart")).toHaveLength(2);
    act(() => root.render(<ProfileCover major={null} />));
    expect(container.querySelector("[data-banner-activity]").dataset.bannerActivity).toBe("reading");
    expect(container.querySelector(".portal-banner-researcher")).not.toBeNull();
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});
