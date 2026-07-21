import { useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import {
  Loader2,
  Globe,
  Mail,
  Linkedin,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Building2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

type LeadStatus =
  | "new"
  | "contacted"
  | "replied"
  | "qualified"
  | "disqualified";

const MAX_VISIBLE_LEADS_PER_COLUMN = 12;
const DEMO_STAGE_RATIOS: { status: LeadStatus; ratio: number }[] = [
  { status: "new", ratio: 0.3 },
  { status: "contacted", ratio: 0.25 },
  { status: "replied", ratio: 0.2 },
  { status: "qualified", ratio: 0.15 },
  { status: "disqualified", ratio: 0.1 },
];

const COLUMN_DEFS: {
  id: LeadStatus;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    id: "new",
    color: "text-slate-700",
    bg: "bg-slate-100",
    border: "border-slate-200",
  },
  {
    id: "contacted",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    id: "replied",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  {
    id: "qualified",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  {
    id: "disqualified",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
];

type Lead = {
  id: number;
  companyName: string;
  email: string | null;
  website: string | null;
  industry: string;
  location: string | null;
  companySize: string | null;
  contactName: string | null;
  linkedinUrl: string | null;
  icebreaker: string | null;
  isEnriched: boolean;
  status: string;
  qualityRating: string | null;
  dataSource: string | null;
};

function LeadCard({ lead, isDragging }: { lead: Lead; isDragging?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-3 bg-card transition-all cursor-grab active:cursor-grabbing select-none ${
        isDragging
          ? "shadow-2xl shadow-primary/20 border-primary/40 opacity-90 rotate-1 scale-105"
          : "border-border hover:border-border/80"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {lead.companyName}
          </p>
          {lead.contactName && (
            <p className="text-xs text-muted-foreground truncate">
              {lead.contactName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {lead.isEnriched && (
            <span title="AI Enriched">
              <Sparkles className="h-3 w-3 text-violet-400" />
            </span>
          )}
          {lead.qualityRating === "good" && (
            <ThumbsUp className="h-3 w-3 text-emerald-400" />
          )}
          {lead.qualityRating === "bad" && (
            <ThumbsDown className="h-3 w-3 text-red-400" />
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge
          variant="secondary"
          className="text-xs px-1.5 py-0 h-4 font-normal"
        >
          {lead.industry}
        </Badge>
        {lead.location && (
          <span className="text-xs text-muted-foreground truncate max-w-[100px]">
            {lead.location}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-2">
        {lead.email && (
          <a
            href={`mailto:${lead.email}`}
            onClick={e => e.stopPropagation()}
            title={lead.email}
          >
            <Mail className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
          </a>
        )}
        {lead.website && (
          <a
            href={
              lead.website.startsWith("http")
                ? lead.website
                : `https://${lead.website}`
            }
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            title={lead.website}
          >
            <Globe className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
          </a>
        )}
        {lead.linkedinUrl && (
          <a
            href={lead.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            title="LinkedIn"
          >
            <Linkedin className="h-3.5 w-3.5 text-muted-foreground hover:text-blue-400 transition-colors" />
          </a>
        )}
        {lead.companySize && (
          <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {lead.companySize}
          </span>
        )}
      </div>
    </div>
  );
}

function DraggableCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: lead.id,
  });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <LeadCard lead={lead} isDragging={isDragging} />
    </div>
  );
}

function KanbanColumn({
  column,
  leads,
  isOver,
}: {
  column: (typeof COLUMN_DEFS)[0] & { label: string };
  leads: Lead[];
  isOver: boolean;
}) {
  const { t } = useTranslation();
  const { setNodeRef } = useDroppable({ id: column.id });
  const visibleLeads = leads.slice(0, MAX_VISIBLE_LEADS_PER_COLUMN);
  const hiddenLeadCount = leads.length - visibleLeads.length;
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[240px] max-w-[280px] w-full rounded-xl border transition-all ${
        isOver
          ? "border-primary/50 bg-primary/5"
          : `${column.border} bg-slate-50`
      }`}
    >
      {/* Column header */}
      <div
        className={`flex items-center justify-between px-3 py-2.5 border-b ${column.border}`}
      >
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${column.color}`}>
            {column.label}
          </span>
        </div>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full ${column.bg} ${column.color}`}
        >
          {leads.length}
        </span>
      </div>
      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 min-h-[120px] overflow-y-auto max-h-[calc(100vh-280px)]">
        {visibleLeads.map(lead => (
          <DraggableCard key={lead.id} lead={lead} />
        ))}
        {hiddenLeadCount > 0 && (
          <div className="rounded-lg border border-dashed border-border bg-background/70 px-3 py-2 text-center text-xs text-muted-foreground">
            + {hiddenLeadCount} dalších leadů
          </div>
        )}
        {leads.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/40 border border-dashed border-border/30 rounded-lg">
            {t("kanban.dropHere", "Přetáhněte sem")}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Kanban() {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.leads.list.useQuery({
    limit: 200,
    offset: 0,
  });
  const updateStatus = trpc.leads.updateStatus.useMutation({
    onSuccess: () => utils.leads.list.invalidate(),
    onError: e => toast.error(e.message),
  });
  const distributeDemo = trpc.leads.bulkUpdateStatus.useMutation();

  const [activeId, setActiveId] = useState<number | null>(null);
  const [overId, setOverId] = useState<LeadStatus | null>(null);

  // Local optimistic state for leads
  const [localLeads, setLocalLeads] = useState<Lead[] | null>(null);
  const leads: Lead[] = (localLeads ?? data?.items ?? []) as Lead[];
  const demoLeads = leads.filter(lead => lead.dataSource === "mock");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  }, []);

  const handleDragOver = useCallback((event: any) => {
    setOverId((event.over?.id as LeadStatus) ?? null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setOverId(null);
      if (!over) return;
      const leadId = active.id as number;
      const newStatus = over.id as LeadStatus;
      const lead = leads.find(l => l.id === leadId);
      if (!lead || lead.status === newStatus) return;

      // Optimistic update
      setLocalLeads(
        leads.map(l => (l.id === leadId ? { ...l, status: newStatus } : l))
      );
      updateStatus.mutate(
        { leadId, status: newStatus },
        {
          onError: () => {
            // Rollback
            setLocalLeads(null);
            toast.error("Failed to update status");
          },
        }
      );
      toast.success(
        t("kanban.movedTo", "Přesunuto do") +
          " " +
          t(`status.${newStatus}`, newStatus)
      );
    },
    [leads, updateStatus]
  );

  const handleDistributeDemo = useCallback(async () => {
    if (demoLeads.length < DEMO_STAGE_RATIOS.length) return;

    const sortedDemoLeads = [...demoLeads].sort(
      (left, right) => left.id - right.id
    );
    const assignments = new Map<number, LeadStatus>();
    let assignedCount = 0;

    DEMO_STAGE_RATIOS.forEach(({ status, ratio }, index) => {
      const isLastStage = index === DEMO_STAGE_RATIOS.length - 1;
      const remainingLeads = sortedDemoLeads.length - assignedCount;
      const remainingStages = DEMO_STAGE_RATIOS.length - index - 1;
      const bucketSize = isLastStage
        ? remainingLeads
        : Math.max(
            1,
            Math.min(
              Math.round(sortedDemoLeads.length * ratio),
              remainingLeads - remainingStages
            )
          );

      sortedDemoLeads
        .slice(assignedCount, assignedCount + bucketSize)
        .forEach(lead => assignments.set(lead.id, status));
      assignedCount += bucketSize;
    });

    setLocalLeads(
      leads.map(lead => {
        const status = assignments.get(lead.id);
        return status ? { ...lead, status } : lead;
      })
    );

    try {
      await Promise.all(
        DEMO_STAGE_RATIOS.map(({ status }) => {
          const leadIds = sortedDemoLeads
            .filter(lead => assignments.get(lead.id) === status)
            .map(lead => lead.id);

          return distributeDemo.mutateAsync({ leadIds, status });
        })
      );
      await utils.leads.list.invalidate();
      setLocalLeads(null);
      toast.success("Ukázkové leady byly rozloženy do všech fází.");
    } catch (error) {
      setLocalLeads(null);
      toast.error(
        error instanceof Error
          ? error.message
          : "Ukázkové leady se nepodařilo rozložit."
      );
    }
  }, [demoLeads, distributeDemo, leads, utils.leads.list]);

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

  const columnLeads = (colId: LeadStatus) =>
    leads.filter(l => (l.status ?? "new") === colId);

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("kanban.title")}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t("kanban.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {leads.length} {t("common.leadsTotal")}
            </span>
            {demoLeads.length >= DEMO_STAGE_RATIOS.length && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleDistributeDemo}
                disabled={distributeDemo.isPending}
                title="Rozloží pouze ukázkové leady; skutečné leady nezmění"
              >
                {distributeDemo.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Rozložit demo
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLocalLeads(null);
                utils.leads.list.invalidate();
              }}
            >
              {t("kanban.refresh", "Obnovit")}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
            <Building2 className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-lg font-medium">{t("kanban.noLeads")}</p>
            <p className="text-sm mt-1">
              {t(
                "kanban.noLeadsHint",
                "Nejprve vygenerujte leady pro použití pipeline boardu."
              )}
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
              {COLUMN_DEFS.map(col => ({
                ...col,
                label: t(`status.${col.id}`, col.id),
              })).map(col => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  leads={columnLeads(col.id)}
                  isOver={overId === col.id}
                />
              ))}
            </div>
            <DragOverlay>
              {activeLead && <LeadCard lead={activeLead} isDragging />}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </DashboardLayout>
  );
}
