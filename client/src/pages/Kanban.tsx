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
import { Loader2, Globe, Mail, Linkedin, ThumbsUp, ThumbsDown, Sparkles, Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";

type LeadStatus = "new" | "contacted" | "replied" | "qualified" | "disqualified";

const COLUMN_DEFS: { id: LeadStatus; color: string; bg: string; border: string }[] = [
  { id: "new", color: "text-slate-300", bg: "bg-slate-500/10", border: "border-slate-500/20" },
  { id: "contacted", color: "text-blue-300", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { id: "replied", color: "text-amber-300", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { id: "qualified", color: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { id: "disqualified", color: "text-red-300", bg: "bg-red-500/10", border: "border-red-500/20" },
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
        isDragging ? "shadow-2xl shadow-primary/20 border-primary/40 opacity-90 rotate-1 scale-105" : "border-border hover:border-border/80"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{lead.companyName}</p>
          {lead.contactName && (
            <p className="text-xs text-muted-foreground truncate">{lead.contactName}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {lead.isEnriched && (
            <span title="AI Enriched">
              <Sparkles className="h-3 w-3 text-violet-400" />
            </span>
          )}
          {lead.qualityRating === "good" && <ThumbsUp className="h-3 w-3 text-emerald-400" />}
          {lead.qualityRating === "bad" && <ThumbsDown className="h-3 w-3 text-red-400" />}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4 font-normal">
          {lead.industry}
        </Badge>
        {lead.location && (
          <span className="text-xs text-muted-foreground truncate max-w-[100px]">{lead.location}</span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-2">
        {lead.email && (
          <a href={`mailto:${lead.email}`} onClick={(e) => e.stopPropagation()} title={lead.email}>
            <Mail className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
          </a>
        )}
        {lead.website && (
          <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} title={lead.website}>
            <Globe className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
          </a>
        )}
        {lead.linkedinUrl && (
          <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} title="LinkedIn">
            <Linkedin className="h-3.5 w-3.5 text-muted-foreground hover:text-blue-400 transition-colors" />
          </a>
        )}
        {lead.companySize && (
          <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
            <Building2 className="h-3 w-3" />{lead.companySize}
          </span>
        )}
      </div>
    </div>
  );
}

function DraggableCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
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
  column: typeof COLUMN_DEFS[0] & { label: string };
  leads: Lead[];
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: column.id });
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[240px] max-w-[280px] w-full rounded-xl border transition-all ${
        isOver ? "border-primary/50 bg-primary/5" : `${column.border} bg-white/[0.02]`
      }`}
    >
      {/* Column header */}
      <div className={`flex items-center justify-between px-3 py-2.5 border-b ${column.border}`}>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${column.color}`}>{column.label}</span>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${column.bg} ${column.color}`}>
          {leads.length}
        </span>
      </div>
      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 min-h-[120px] overflow-y-auto max-h-[calc(100vh-280px)]">
        {leads.map((lead) => (
          <DraggableCard key={lead.id} lead={lead} />
        ))}
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
  const { data, isLoading } = trpc.leads.list.useQuery({ limit: 200, offset: 0 });
  const updateStatus = trpc.leads.updateStatus.useMutation({
    onSuccess: () => utils.leads.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const [activeId, setActiveId] = useState<number | null>(null);
  const [overId, setOverId] = useState<LeadStatus | null>(null);

  // Local optimistic state for leads
  const [localLeads, setLocalLeads] = useState<Lead[] | null>(null);
  const leads: Lead[] = (localLeads ?? data?.items ?? []) as Lead[];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  }, []);

  const handleDragOver = useCallback((event: any) => {
    setOverId(event.over?.id as LeadStatus ?? null);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);
    if (!over) return;
    const leadId = active.id as number;
    const newStatus = over.id as LeadStatus;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    // Optimistic update
    setLocalLeads(leads.map((l) => l.id === leadId ? { ...l, status: newStatus } : l));
    updateStatus.mutate({ leadId, status: newStatus }, {
      onError: () => {
        // Rollback
        setLocalLeads(null);
        toast.error("Failed to update status");
      },
    });
    toast.success(t("kanban.movedTo", "Přesunuto do") + " " + t(`status.${newStatus}`, newStatus));
  }, [leads, updateStatus]);

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  const columnLeads = (colId: LeadStatus) =>
    leads.filter((l) => (l.status ?? "new") === colId);

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("kanban.title")}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t("kanban.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{leads.length} {t("common.leadsTotal")}</span>
            <Button variant="outline" size="sm" onClick={() => { setLocalLeads(null); utils.leads.list.invalidate(); }}>
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
            <p className="text-sm mt-1">{t("kanban.noLeadsHint", "Nejprve vygenerujte leady pro použití pipeline boardu.")}</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
              {COLUMN_DEFS.map((col) => ({
                ...col,
                label: t(`status.${col.id}`, col.id),
              })).map((col) => (
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
