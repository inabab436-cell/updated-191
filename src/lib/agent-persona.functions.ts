/**
 * Read / update the agent's name and gender for the signed-in brand.
 *
 * Server-only modules are imported inside the handlers so this
 * client-reachable module never bundles secrets.
 */

import { createServerFn } from "@tanstack/react-start";

import {
  DEFAULT_AGENT_PERSONA,
  normalizeAgentName,
  normalizeAgentGender,
  type AgentPersona,
} from "@/lib/agent-persona";

export const getAgentPersona = createServerFn({ method: "GET" }).handler(
  async (): Promise<AgentPersona> => {
    const { requirePermission } = await import("@/lib/session-guard.server");
    const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId } = await requirePermission("settings");
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from("merchants")
      .select("agent_name, agent_gender")
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) return { ...DEFAULT_AGENT_PERSONA };
    return {
      name: normalizeAgentName((data as any).agent_name),
      gender: normalizeAgentGender((data as any).agent_gender),
    };
  },
);

export const updateAgentPersona = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string; gender: string }) => ({
    name: normalizeAgentName(data?.name),
    gender: normalizeAgentGender(data?.gender),
  }))
  .handler(async ({ data }): Promise<AgentPersona> => {
    const { requirePermission } = await import("@/lib/session-guard.server");
    const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId } = await requirePermission("settings");
    const admin = getSupabaseAdmin();

    const { data: existing } = await admin
      .from("merchants")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!existing) {
      const { error } = await admin.from("merchants").insert({
        user_id: userId,
        agent_name: data.name || null,
        agent_gender: data.gender,
      });
      if (error) throw new Error("تعذّر حفظ إعدادات الوكيل.");
    } else {
      const { error } = await admin
        .from("merchants")
        .update({
          agent_name: data.name || null,
          agent_gender: data.gender,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      if (error) throw new Error("تعذّر حفظ إعدادات الوكيل.");
    }

    return { name: data.name, gender: data.gender };
  });
