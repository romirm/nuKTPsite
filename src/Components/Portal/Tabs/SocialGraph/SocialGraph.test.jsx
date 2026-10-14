import React from "react";
import { createRoot } from "react-dom/client";
import { act, Simulate } from "react-dom/test-utils";
import SocialGraph from "./SocialGraph";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
const directory = Object.fromEntries([
  ["me", { name: "Current User", major: "CS", year: "Junior", about: "ML and climbing" }],
  ...Array.from({ length: 16 }, (_, i) => [`peer-${i}`, { name: `Peer ${String(i).padStart(2, "0")}`, major: "Computer Science", year: "Junior", about: "Machine learning and bouldering" }]),
  ["isolated", { name: "Isolated Member" }],
  ["alum", { name: "Alumni Member", role: "Alumni", major: "CS" }],
]);
beforeEach(() => { container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const button = text => Array.from(container.querySelectorAll("button")).find(b => b.textContent.includes(text));
const click = element => act(() => element.dispatchEvent(new MouseEvent("click", { bubbles: true })));

test("opens centered on the authenticated member with only 12 strongest connections, expandable to all", () => {
  act(() => root.render(<SocialGraph fullPubDir={directory} uid="me" onOpenProfile={() => {}} />));
  expect(container.querySelector(".social-selected-member").textContent).toContain("Current User");
  expect(container.querySelectorAll(".social-node")).toHaveLength(13);
  expect(container.querySelectorAll(".social-edge")).toHaveLength(12);
  expect(container.querySelector(".social-status").textContent).toContain("12 of 16");
  const selector = container.querySelector('[aria-label="Connections in circle"]');
  act(() => { selector.value = "0"; Simulate.change(selector); });
  expect(container.querySelectorAll(".social-node")).toHaveLength(17);
  click(button("Whole chapter"));
  expect(container.querySelectorAll(".social-node")).toHaveLength(18);
  expect(container.querySelector(".social-node[aria-label^='Isolated Member']")).not.toBeNull();
});

test("member list includes the full filtered directory and selecting a member recenters the circle", () => {
  act(() => root.render(<SocialGraph fullPubDir={directory} uid="me" onOpenProfile={() => {}} />));
  click(button("Member list"));
  expect(container.querySelectorAll(".social-member-list > button")).toHaveLength(18);
  click(Array.from(container.querySelectorAll(".social-member-list > button")).find(b => b.textContent.includes("Peer 15")));
  expect(container.querySelector(".social-selected-member").textContent).toContain("Peer 15");
  click(Array.from(container.querySelectorAll(".social-view-switch button")).find(b => b.textContent === "Graph"));
  expect(container.querySelector(".social-node.is-selected").getAttribute("aria-label")).toContain("Peer 15");
  click(button("Find me"));
  expect(container.querySelector(".social-selected-member").textContent).toContain("Current User");
});

test("opening a connection outside the top twelve adds it to the circle and exposes evidence and correct profile ID", () => {
  const open = jest.fn();
  act(() => root.render(<SocialGraph fullPubDir={directory} uid="me" onOpenProfile={open} />));
  const last = Array.from(container.querySelectorAll(".social-connection")).pop();
  click(last);
  expect(container.querySelectorAll(".social-node")).toHaveLength(14);
  expect(container.querySelector(".social-similarity-score").textContent).toContain("/100");
  expect(container.querySelector(".social-reason").textContent).toContain("ML and climbing");
  click(button("View profile"));
  expect(open).toHaveBeenCalledWith("me");
});

test("disabling every connection category preserves the center and explains the empty circle", () => {
  act(() => root.render(<SocialGraph fullPubDir={directory} uid="me" onOpenProfile={() => {}} />));
  click(button("Filters"));
  Array.from(container.querySelectorAll(".social-kind-row button")).forEach(click);
  expect(container.querySelectorAll(".social-node")).toHaveLength(1);
  expect(container.querySelectorAll(".social-edge")).toHaveLength(0);
  expect(container.querySelector(".social-no-links").textContent).toContain("Choose a connection type");
});

test("search finds a member without trapping their circle in a one-member filter", () => {
  act(() => root.render(<SocialGraph fullPubDir={directory} uid="me" onOpenProfile={() => {}} />));
  const search = container.querySelector('input[type="search"]');
  act(() => { search.value = "Peer 15"; Simulate.change(search); });
  expect(container.querySelectorAll(".social-node")).toHaveLength(1);
  click(container.querySelector(".social-node"));
  expect(search.value).toBe("");
  expect(container.querySelectorAll(".social-node")).toHaveLength(13);
  expect(container.querySelector(".social-selected-member").textContent).toContain("Peer 15");
});

test("an alumni user's initial circle includes their own profile; data updates remove stale selections", () => {
  act(() => root.render(<SocialGraph fullPubDir={directory} uid="alum" onOpenProfile={() => {}} />));
  expect(container.querySelector(".social-selected-member").textContent).toContain("Alumni Member");
  expect(container.querySelector('.social-population select').value).toBe("all");
  const updated = { replacement: { name: "Replacement Member" } };
  act(() => root.render(<SocialGraph fullPubDir={updated} uid="alum" onOpenProfile={() => {}} />));
  expect(container.querySelector(".social-selected-member")).toBeNull();
  expect(container.querySelectorAll(".social-node")).toHaveLength(1);
});
