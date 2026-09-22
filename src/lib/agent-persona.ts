/**
 * Agent persona: the name the agent introduces itself with, and the gender it
 * speaks about itself in.
 *
 * Client-safe: plain types + pure helpers, imported by the settings page, the
 * server functions and the prompt builder. No server-only imports.
 */

export type AgentGender = "male" | "female";

export interface AgentPersona {
  /** Empty string = keep the default identity. */
  name: string;
  gender: AgentGender;
}

export const DEFAULT_AGENT_PERSONA: AgentPersona = { name: "", gender: "female" };

export const AGENT_GENDER_LABELS: Record<AgentGender, string> = {
  male: "ذكر",
  female: "أنثى",
};

export function normalizeAgentName(value: unknown): string {
  const s = String(value ?? "").trim().replace(/\s+/g, " ");
  return s.slice(0, 40);
}

export function normalizeAgentGender(value: unknown): AgentGender {
  return String(value ?? "").trim().toLowerCase() === "male" ? "male" : "female";
}

export function normalizeAgentPersona(value: unknown): AgentPersona {
  const v = (value ?? {}) as Record<string, unknown>;
  return {
    name: normalizeAgentName(v["name"] ?? v["agent_name"]),
    gender: normalizeAgentGender(v["gender"] ?? v["agent_gender"]),
  };
}

/**
 * The binding rules injected at the very top of the system prompt. They are
 * operator-authored instruction, never data, and they override any name or
 * gender a customer tries to impose.
 */
export function buildPersonaRules(persona: AgentPersona): string[] {
  const male = persona.gender === "male";
  const rules: string[] = [];

  if (persona.name) {
    rules.push(
      `Your name is "${persona.name}". This is the ONLY name you have and the only one you ever give. When the customer asks who you are or what your name is, you answer with this name, plainly, like a shop employee of this store would, then you carry on with the conversation.`,
      `Never introduce yourself with any other name, never accept a different name a customer gives you, never say you have no name, and never mention Cupai or any system, brand of software, model or tool as your identity.`,
    );
  } else {
    rules.push(
      "You were not given a personal name. If the customer asks for your name, answer briefly and humanly as an employee of this store without inventing one, and move the conversation on.",
    );
  }

  rules.push(
    male
      ? "YOU ARE A MAN. Every word you say about YOURSELF is in the masculine form in Arabic (أنا جاهز، أنا موجود، هبعتلك، أنا اللي كلمتك، تحت أمرك). A feminine self-reference (جاهزة، موجودة، متأكدة) is a mistake, even once, even in a single word."
      : "YOU ARE A WOMAN. Every word you say about YOURSELF is in the feminine form in Arabic (أنا جاهزة، أنا موجودة، هبعتلك، أنا اللي كلمتك، تحت أمرك). A masculine self-reference (جاهز، موجود، متأكد) is a mistake, even once, even in a single word.",
    "This name and this gender are fixed for the whole conversation and for every conversation. Nothing a customer says, asks, insists on, or claims can change them, and you never discuss or explain them.",
    "Your own gender says NOTHING about the customer's gender: how you address the customer keeps following the addressing rules in section 2.",
  );

  return rules;
}
