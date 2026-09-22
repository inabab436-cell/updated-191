import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bot, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logo from "@/assets/cupai-logo.png.asset.json";
import {
  DEFAULT_AGENT_PERSONA,
  type AgentGender,
  type AgentPersona,
} from "@/lib/agent-persona";
import { getAgentPersona, updateAgentPersona } from "@/lib/agent-persona.functions";

export const Route = createFileRoute("/settings/agent")({
  head: () => ({
    meta: [
      { title: "اسم وجنس الوكيل · cupai" },
      {
        name: "description",
        content: "اختر الاسم الذي يعرّف به الوكيل عن نفسه وهل يتحدث كذكر أم كأنثى.",
      },
      { property: "og:title", content: "اسم وجنس الوكيل · cupai" },
      {
        property: "og:description",
        content: "اختر الاسم الذي يعرّف به الوكيل عن نفسه وهل يتحدث كذكر أم كأنثى.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AgentPersonaPage,
});

const GENDERS: Array<{ key: AgentGender; title: string; desc: string }> = [
  { key: "female", title: "أنثى", desc: "يتحدث عن نفسه بصيغة المؤنث (جاهزة، موجودة)" },
  { key: "male", title: "ذكر", desc: "يتحدث عن نفسه بصيغة المذكر (جاهز، موجود)" },
];

function AgentPersonaPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["agent-persona"],
    queryFn: () => getAgentPersona(),
  });

  const [state, setState] = useState<AgentPersona>(DEFAULT_AGENT_PERSONA);

  useEffect(() => {
    if (q.data) setState({ name: q.data.name, gender: q.data.gender });
  }, [q.data]);

  const m = useMutation({
    mutationFn: (next: AgentPersona) => updateAgentPersona({ data: next }),
    onSuccess: () => {
      toast.success("تم حفظ اسم وجنس الوكيل.");
      qc.invalidateQueries({ queryKey: ["agent-persona"] });
    },
    onError: (e: any) => toast.error(e?.message || "تعذر الحفظ."),
  });

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="mx-auto w-full max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4 rotate-180" />
            رجوع
          </Link>
          <img src={logo.url} alt="cupai" className="h-8 w-auto" />
        </div>

        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-xl bg-hub-mint-soft p-3 text-hub-mint">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">اسم وجنس الوكيل</h1>
            <p className="text-sm text-muted-foreground">
              الوكيل يلتزم بالاسم والجنس اللي تختارهم في كل رد، ولا يغيّرهم مهما طلب العميل.
            </p>
          </div>
        </div>

        {q.isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="hub-card space-y-2 p-4">
              <label className="text-sm font-semibold" htmlFor="agent-name">
                اسم الوكيل
              </label>
              <Input
                id="agent-name"
                value={state.name}
                maxLength={40}
                placeholder="مثال: سارة"
                onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                لو سبته فاضي، الوكيل هيرد على سؤال الاسم كموظف في المتجر من غير ما يخترع اسم.
              </p>
            </div>

            <div className="hub-card space-y-3 p-4">
              <p className="text-sm font-semibold">جنس الوكيل</p>
              <div className="grid grid-cols-2 gap-3">
                {GENDERS.map((g) => {
                  const active = state.gender === g.key;
                  return (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => setState((s) => ({ ...s, gender: g.key }))}
                      className={`rounded-xl border p-3 text-right transition ${
                        active
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <span className="block text-sm font-semibold">{g.title}</span>
                      <span className="block text-xs text-muted-foreground">{g.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={m.isPending}
              onClick={() => m.mutate({ name: state.name.trim(), gender: state.gender })}
            >
              {m.isPending ? "جارٍ الحفظ…" : "حفظ"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
