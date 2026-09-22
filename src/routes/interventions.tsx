import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, LifeBuoy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { escalationCategoryLabel } from "@/lib/escalation";
import { listInterventions, resolveIntervention } from "@/lib/conversations.functions";

export const Route = createFileRoute("/interventions")({
  head: () => ({
    meta: [
      { title: "استدعاء التدخل · cupai" },
      {
        name: "description",
        content:
          "المحادثات التي أوقفها الوكيل واستدعى فيها مسؤولاً: مشاكل الأوردرات، طلب مسؤول، الإساءة، الشكاوى ومشاكل الدفع.",
      },
      { property: "og:title", content: "استدعاء التدخل · cupai" },
      {
        property: "og:description",
        content: "تابع الحالات التي تحتاج تدخل مسؤول من فريقك وأعد الوكيل للعمل بضغطة واحدة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InterventionsPage,
});

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("ar-EG", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function InterventionsPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["interventions"],
    queryFn: () => listInterventions(),
    refetchInterval: 15000,
  });

  const resolve = useMutation({
    mutationFn: (vars: { id: string; resumeAgent: boolean }) =>
      resolveIntervention({ data: { id: vars.id, resumeAgent: vars.resumeAgent } }),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["interventions"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(
        vars.resumeAgent
          ? "تم إنهاء التدخل — عاد الوكيل للرد على العميل."
          : "تم إنهاء التدخل — الوكيل ما زال متوقفاً وستكمل الرد بنفسك.",
      );
    },
    onError: (e: any) => toast.error(e?.message || "تعذر إنهاء التدخل."),
  });

  const rows = q.data ?? [];

  return (
    <div dir="rtl" className="hub min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <LifeBuoy className="h-4 w-4 text-destructive" />
            استدعاء التدخل
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard">
              <ArrowRight className="ml-1 h-4 w-4" />
              لوحة التحكم
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
        <section>
          <h1 className="text-2xl font-bold tracking-tight">
            حالات تحتاج مسؤولاً
            <span className="ms-2 rounded-full bg-destructive px-2 py-0.5 align-middle text-xs font-bold text-destructive-foreground">
              {rows.length}
            </span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            عندما يفهم الوكيل أن الموقف يحتاج قراراً بشرياً — مشكلة في أوردر، طلب التحدث مع
            مسؤول، إساءة أو تهديد، شكوى جدية، أو مشكلة في الدفع — يتوقف فوراً عن الرد ويظهر
            العميل هنا. لن يرسل الوكيل أي رد في هذه المحادثات حتى تنهي التدخل.
          </p>
        </section>

        {q.isError && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {(q.error as Error)?.message || "تعذر تحميل حالات التدخل."}
          </div>
        )}

        {!q.isLoading && rows.length === 0 && (
          <div className="rounded-2xl border border-border/60 p-8 text-center text-sm text-muted-foreground">
            لا توجد حالات تحتاج تدخلاً الآن. 👌
          </div>
        )}

        <div className="space-y-3">
          {rows.map((r) => {
            const name =
              r.customer_name?.trim() ||
              (r.visitor_number ? `زائر #${r.visitor_number}` : "زائر");
            const urgent = r.severity === "urgent";
            return (
              <div
                key={r.conversation_id}
                className={`rounded-2xl border p-4 shadow-card backdrop-blur-sm ${
                  urgent
                    ? "border-destructive/50 bg-destructive/5"
                    : "border-amber-500/40 bg-amber-500/5"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold">{name}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold">
                        {escalationCategoryLabel(r.category)}
                      </span>
                      {urgent && (
                        <span className="rounded-full bg-destructive px-2 py-0.5 text-[11px] font-bold text-destructive-foreground">
                          عاجل
                        </span>
                      )}
                    </div>
                    {r.reason && (
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {r.reason}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatTime(r.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-col items-stretch gap-1.5">
                    <Button asChild size="sm" variant="secondary">
                      <Link
                        to="/conversation/$id"
                        params={{ id: r.conversation_id }}
                      >
                        فتح المحادثة
                        <ArrowLeft className="me-1 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      disabled={resolve.isPending}
                      onClick={() =>
                        resolve.mutate({ id: r.conversation_id, resumeAgent: true })
                      }
                    >
                      <Check className="ml-1 h-4 w-4" />
                      تم التدخل وإعادة الوكيل
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={resolve.isPending}
                      onClick={() =>
                        resolve.mutate({ id: r.conversation_id, resumeAgent: false })
                      }
                    >
                      تم التدخل وأكمل بنفسي
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
