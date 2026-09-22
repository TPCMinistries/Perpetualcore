import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RepairBrief } from "../../app/repairs/RepairBrief";

let root: Root | undefined;
let container: HTMLDivElement;
function render() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root?.render(<RepairBrief />));
}
function button(text: string): HTMLButtonElement {
  const result = [...container.querySelectorAll("button")].find((item) => item.textContent === text);
  if (!result) throw new Error(`Button not found: ${text}`);
  return result;
}
function fill() {
  act(() => {
    for (const name of ["category", "systems", "expected", "actual", "reproduction"]) {
      const input = container.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`[name="${name}"]`)!;
      const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), "value")?.set;
      setter?.call(input, name === "category" ? "Next.js application" : "Sanitized example");
      input.dispatchEvent(new Event(name === "category" ? "change" : "input", { bubbles: true }));
    }
  });
}
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.restoreAllMocks();
});
describe("repair brief actions", () => {
  it("focuses the first missing field and does not claim submission", () => {
    render();
    act(() => button("Open email draft").click());
    expect(document.activeElement).toBe(container.querySelector('[name="category"]'));
    expect(container.querySelector('[role="status"]')?.textContent).toContain("highlighted fields");
  });
  it("reports actual copy success without submitting a request", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(); fill();
    await act(async () => button("Copy brief").click());
    expect(writeText).toHaveBeenCalledOnce();
    expect(container.querySelector('[role="status"]')?.textContent).toContain("Brief copied");
    expect(container.querySelector('[role="status"]')?.textContent).toContain("Nothing has been sent");
  });
  it("offers a fallback when clipboard access fails", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error("Denied")) } });
    render(); fill();
    await act(async () => button("Copy brief").click());
    expect(container.querySelector('[role="status"]')?.textContent).toContain("Copy was unavailable");
  });
});
