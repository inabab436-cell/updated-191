import { describe, expect, it } from "vitest";

import { buildAgentPrompt } from "@/lib/agent-prompt";
import { normalizeAgentPersona } from "@/lib/agent-persona";

describe("agent persona", () => {
  it("defaults to a feminine voice with no invented name", () => {
    const p = normalizeAgentPersona({});
    expect(p).toEqual({ name: "", gender: "female" });
    const prompt = buildAgentPrompt(undefined, p);
    expect(prompt).toContain("YOU ARE A WOMAN");
    expect(prompt).toContain("without inventing one");
  });

  it("locks the chosen name and masculine voice into the prompt", () => {
    const p = normalizeAgentPersona({ name: "  كريم  ", gender: "male" });
    expect(p).toEqual({ name: "كريم", gender: "male" });
    const prompt = buildAgentPrompt(undefined, p);
    expect(prompt).toContain('Your name is "كريم"');
    expect(prompt).toContain("YOU ARE A MAN");
    expect(prompt).toContain("0. YOUR NAME AND YOUR GENDER");
  });

  it("keeps the persona section above the behaviour sections", () => {
    const prompt = buildAgentPrompt(undefined, normalizeAgentPersona({ name: "سارة" }));
    expect(prompt.indexOf("0. YOUR NAME AND YOUR GENDER")).toBeLessThan(
      prompt.indexOf("1. WHO YOU ARE"),
    );
  });
});
