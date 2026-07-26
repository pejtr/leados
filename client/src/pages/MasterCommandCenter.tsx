import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  Bot,
  BrainCircuit,
  Building2,
  CalendarDays,
  CheckCircle2,
  Command,
  FileText,
  Globe2,
  HandCoins,
  ListFilter,
  Loader2,
  Mail,
  Megaphone,
  PackageOpen,
  Play,
  PhoneCall,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  Video,
  WandSparkles,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import { trpc } from "../lib/trpc";
import { cn } from "../lib/utils";
import { useLocation } from "wouter";
import {
  buildCommandCenterPrompt,
  commandCenterCategoryLabels,
  commandCenterStatusLabels,
  commandCenterTemplates,
  createCommandCenterTemplateValues,
  getCommandCenterFieldSuggestions,
  getCommandCenterTemplate,
  type CommandCenterTemplate,
  type CommandCenterTemplateCategory,
  type CommandCenterTemplateField,
  type CommandCenterTemplateIcon,
  type CommandCenterTemplateStatus,
} from "@shared/commandCenterTemplates";
import {
  getPlatformIntegrationPoints,
  type PlatformId,
  type PlatformIntegrationState,
} from "@shared/platformIntegrationContracts";

type TemplateFilter = "all" | CommandCenterTemplateCategory;
type WorkspaceView = "templates" | "runs" | "approvals";

interface ChatMessage {
  id: string;
  role: "user" | "hermes" | "hera" | "system";
  content: string;
  intent?: string;
  agentsUsed?: string[];
  routingDecision?: string;
  templateTitle?: string;
  timestamp: Date;
}

const templateIcons: Record<CommandCenterTemplateIcon, LucideIcon> = {
  affiliate: HandCoins,
  building: Building2,
  calendar: CalendarDays,
  funnel: ListFilter,
  globe: Globe2,
  mail: Mail,
  megaphone: Megaphone,
  package: PackageOpen,
  phone: PhoneCall,
  search: Search,
  telegram: Send,
  video: Video,
  wand: WandSparkles,
};

const statusStyles: Record<CommandCenterTemplateStatus, string> = {
  live: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  guided: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  roadmap: "border-rose-500/30 bg-rose-500/10 text-rose-200",
};

const platformLabels: Record<PlatformId, string> = {
  onyx: "ONYX",
  omnivideo: "OMNIVIDEO",
  optimateo: "OPTIMATEO",
  forge: "FORGE",
  youtube: "YouTube",
  patreon: "Patreon",
  katastr_online: "Katastr Online",
};

const integrationStateLabels: Record<PlatformIntegrationState, string> = {
  available: "Dostupné",
  contract_ready: "MCP kontrakt",
  blocked: "Blokované",
};

const agentLabels: Record<string, string> = {
  advisor: "Advisor",
  analyst: "Analyst",
  copywriter: "Copywriter",
  funnel_builder: "Funnel Builder",
  market_spy: "Market Spy",
  prospector: "Prospector",
  social_manager: "Social Manager",
  strategist: "Strategist",
  synthesizer: "Synthesizer",
  voice_closer: "Voice Closer",
};

const filters: Array<{ value: TemplateFilter; label: string }> = [
  { value: "all", label: "Vše" },
  ...Object.entries(commandCenterCategoryLabels).map(([value, label]) => ({
    value: value as CommandCenterTemplateCategory,
    label,
  })),
];

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeMessageContent(content: unknown): string {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map(part => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          const text = (part as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  return content == null ? "" : JSON.stringify(content);
}

export default function MasterCommandCenter() {
  const initialTemplate = commandCenterTemplates[0];
  const [, setLocation] = useLocation();
  const [orchestratorMode, setOrchestratorMode] = useState<"hermes" | "hera">(
    "hermes"
  );
  const [activeFilter, setActiveFilter] = useState<TemplateFilter>("all");
  const [workspaceView, setWorkspaceView] =
    useState<WorkspaceView>("templates");
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    initialTemplate.id
  );
  const [templateValues, setTemplateValues] = useState<Record<string, string>>(
    () => createCommandCenterTemplateValues(initialTemplate)
  );
  const [preparedTemplateId, setPreparedTemplateId] = useState<string | null>(
    null
  );
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "command-center-intro",
      role: "hermes",
      content:
        "Vyberte připravenou šablonu, doplňte několik vstupů a upravte výsledné zadání. Připravím plán a podklady; externí akce a kroky vyžadující schválení ve výstupu jasně oddělím.",
      agentsUsed: ["hermes"],
      timestamp: new Date(),
    },
  ]);
  const chatScrollAreaRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const utils = trpc.useUtils();

  const selectedTemplate =
    getCommandCenterTemplate(selectedTemplateId) ?? initialTemplate;
  const selectedIntegrationPoints = getPlatformIntegrationPoints(
    selectedTemplate.id
  );

  const visibleTemplates = useMemo(() => {
    const modeTemplates =
      orchestratorMode === "hera"
        ? commandCenterTemplates.filter(template =>
            ["sales", "content"].includes(template.category)
          )
        : commandCenterTemplates;

    return activeFilter === "all"
      ? modeTemplates
      : modeTemplates.filter(template => template.category === activeFilter);
  }, [activeFilter, orchestratorMode]);

  const availableFilters = useMemo(
    () =>
      orchestratorMode === "hera"
        ? filters.filter(filter =>
            ["all", "sales", "content"].includes(filter.value)
          )
        : filters,
    [orchestratorMode]
  );

  const missingRequiredFields = selectedTemplate.fields.filter(
    field => field.required && !templateValues[field.key]?.trim()
  );

  const hermesChat = trpc.hermes.aiChat.useMutation({
    onSuccess: data => {
      setMessages(previous => [
        ...previous,
        {
          id: createMessageId(),
          role: "hermes",
          content: normalizeMessageContent(data.content),
          intent: data.intent,
          agentsUsed: data.agentsUsed,
          routingDecision: data.routingDecision,
          timestamp: new Date(),
        },
      ]);
    },
    onError: error => {
      setMessages(previous => [
        ...previous,
        {
          id: createMessageId(),
          role: "system",
          content: `HERMES požadavek nedokončil: ${error.message}`,
          timestamp: new Date(),
        },
      ]);
    },
  });

  const heraChat = trpc.hera.chat.useMutation({
    onSuccess: data => {
      setMessages(previous => [
        ...previous,
        {
          id: createMessageId(),
          role: "hera",
          content: normalizeMessageContent(data.content),
          intent: data.intent,
          agentsUsed: data.coachId ? [`hera:${data.coachId}`] : ["hera"],
          routingDecision: data.routingDecision,
          timestamp: new Date(),
        },
      ]);
    },
    onError: error => {
      setMessages(previous => [
        ...previous,
        {
          id: createMessageId(),
          role: "system",
          content: `HERA požadavek nedokončil: ${error.message}`,
          timestamp: new Date(),
        },
      ]);
    },
  });

  const createWorkflowDraft = trpc.hermes.createWorkflowDraft.useMutation({
    onSuccess: async () => {
      await utils.hermes.getMissions.invalidate();
      setWorkspaceView("approvals");
    },
    onError: error => {
      setMessages(previous => [
        ...previous,
        {
          id: createMessageId(),
          role: "system",
          content: `Workflow se nepodařilo uložit: ${error.message}`,
          timestamp: new Date(),
        },
      ]);
    },
  });

  useEffect(() => {
    const viewport = chatScrollAreaRef.current?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]'
    );
    viewport?.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
  }, [messages, hermesChat.isPending, heraChat.isPending]);

  const selectTemplate = (template: CommandCenterTemplate) => {
    setSelectedTemplateId(template.id);
    setTemplateValues(createCommandCenterTemplateValues(template));
    setPreparedTemplateId(null);
  };

  const switchTemplateFilter = (filter: TemplateFilter) => {
    setActiveFilter(filter);
    const nextTemplate = commandCenterTemplates.find(template => {
      const isAvailableForMode =
        orchestratorMode === "hermes" ||
        ["sales", "content"].includes(template.category);
      const matchesFilter = filter === "all" || template.category === filter;
      return isAvailableForMode && matchesFilter;
    });

    if (nextTemplate) selectTemplate(nextTemplate);
  };

  const preparePrompt = () => {
    if (missingRequiredFields.length > 0) return;

    setInputValue(buildCommandCenterPrompt(selectedTemplate, templateValues));
    setPreparedTemplateId(selectedTemplate.id);
    window.setTimeout(() => promptRef.current?.focus(), 0);
  };

  const saveForApproval = () => {
    if (missingRequiredFields.length > 0 || createWorkflowDraft.isPending)
      return;
    createWorkflowDraft.mutate({
      templateId: selectedTemplate.id,
      values: templateValues,
    });
  };

  const handleSend = () => {
    const content = inputValue.trim();
    if (!content || hermesChat.isPending || heraChat.isPending) return;

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content,
      templateTitle:
        preparedTemplateId === selectedTemplate.id
          ? selectedTemplate.title
          : undefined,
      timestamp: new Date(),
    };
    const conversationHistory: Array<{
      role: "user" | "assistant";
      content: string;
    }> = messages
      .filter(message => message.role !== "system")
      .map(message => ({
        role: message.role === "user" ? "user" : "assistant",
        content: message.content,
      }));

    setMessages(previous => [...previous, userMessage]);
    setInputValue("");
    setPreparedTemplateId(null);

    if (orchestratorMode === "hera") {
      heraChat.mutate({
        message: content,
        conversationHistory,
        compactMode: false,
      });
    } else {
      hermesChat.mutate({
        message: content,
        conversationHistory,
        hermesMode: true,
        compactMode: false,
        cavemanMode: false,
      });
    }
  };

  const switchOrchestrator = (mode: "hermes" | "hera") => {
    setOrchestratorMode(mode);
    setActiveFilter("all");
    const nextTemplate =
      mode === "hera"
        ? (commandCenterTemplates.find(template =>
            ["sales", "content"].includes(template.category)
          ) ?? initialTemplate)
        : initialTemplate;
    setSelectedTemplateId(nextTemplate.id);
    setTemplateValues(createCommandCenterTemplateValues(nextTemplate));
    setPreparedTemplateId(null);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 xl:h-[calc(100dvh-7.5rem)] xl:min-h-0 xl:overflow-hidden">
        <header className="flex flex-col justify-between gap-4 border-b border-border/70 pb-4 lg:flex-row lg:items-end">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
              <Command className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-foreground">
                  Řídicí centrum
                </h1>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1 shadow-sm">
                  <div className="hidden items-center gap-1.5 px-2 text-xs font-medium text-muted-foreground md:flex">
                    <BrainCircuit
                      className={cn(
                        "size-4 transition-colors",
                        orchestratorMode === "hermes"
                          ? "text-sky-600"
                          : "text-fuchsia-600"
                      )}
                      aria-hidden="true"
                    />
                    <span>AI uvažování</span>
                  </div>
                  <div
                    className="grid grid-cols-2 rounded-md bg-muted p-0.5"
                    role="group"
                    aria-label="Režim AI uvažování"
                  >
                    <button
                      type="button"
                      onClick={() => switchOrchestrator("hermes")}
                      className={cn(
                        "flex min-h-9 items-center justify-center gap-2 rounded-[5px] px-3 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        orchestratorMode === "hermes"
                          ? "bg-sky-600 text-white shadow-sm"
                          : "text-muted-foreground hover:bg-background hover:text-foreground"
                      )}
                      aria-pressed={orchestratorMode === "hermes"}
                      title="HERMES: operativní uvažování, orchestrace a řízení workflow"
                    >
                      <Command className="size-3.5" aria-hidden="true" />
                      <span className="flex flex-col items-start leading-tight">
                        <span>HERMES</span>
                        <span
                          className={cn(
                            "hidden text-[10px] font-normal sm:block",
                            orchestratorMode === "hermes"
                              ? "text-sky-100"
                              : "text-muted-foreground"
                          )}
                        >
                          Operativní
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => switchOrchestrator("hera")}
                      className={cn(
                        "flex min-h-9 items-center justify-center gap-2 rounded-[5px] px-3 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        orchestratorMode === "hera"
                          ? "bg-fuchsia-600 text-white shadow-sm"
                          : "text-muted-foreground hover:bg-background hover:text-foreground"
                      )}
                      aria-pressed={orchestratorMode === "hera"}
                      title="HERA: marketingové uvažování, kampaně, obsah a růst"
                    >
                      <Sparkles className="size-3.5" aria-hidden="true" />
                      <span className="flex flex-col items-start leading-tight">
                        <span>HERA</span>
                        <span
                          className={cn(
                            "hidden text-[10px] font-normal sm:block",
                            orchestratorMode === "hera"
                              ? "text-fuchsia-100"
                              : "text-muted-foreground"
                          )}
                        >
                          Marketingové
                        </span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                {orchestratorMode === "hera"
                  ? "Marketingový orchestrátor pro kampaně, obsah, funnel a sociální strategie."
                  : "Přednastavené workflow pro akvizici, prodej, obsah a provoz. Šablona připraví editovatelné zadání a označí kroky, které vyžadují schválení nebo integraci."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="size-4 text-amber-300" />
            <span>{visibleTemplates.length} šablon</span>
            <span aria-hidden="true">·</span>
            <span>{messages.length} zpráv</span>
          </div>
        </header>

        <Tabs
          value={workspaceView}
          onValueChange={value => setWorkspaceView(value as WorkspaceView)}
        >
          <TabsList className="h-10 w-full justify-start overflow-x-auto bg-transparent p-0 sm:w-auto">
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="size-4" />
              Šablony
            </TabsTrigger>
            <TabsTrigger value="runs" className="gap-2">
              <Play className="size-4" />
              Běhy
            </TabsTrigger>
            <TabsTrigger value="approvals" className="gap-2">
              <ShieldCheck className="size-4" />
              Schválení
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {workspaceView === "templates" ? (
          <div className="grid min-h-[760px] grid-cols-[minmax(0,1fr)] overflow-hidden rounded-lg border border-border/70 bg-card/30 xl:min-h-0 xl:flex-1 xl:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="flex min-h-[460px] min-w-0 flex-col border-b border-border/70 bg-background/45 xl:min-h-0 xl:border-r xl:border-b-0">
              <div className="border-b border-border/70 p-4">
                <p className="text-sm font-semibold text-foreground">Šablony</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Vyberte scénář podle požadovaného obchodního výsledku.
                </p>
                <Tabs
                  value={activeFilter}
                  onValueChange={value =>
                    switchTemplateFilter(value as TemplateFilter)
                  }
                  className="mt-4"
                >
                  <TabsList
                    className="grid h-auto w-full grid-cols-3 gap-1 bg-muted/60 p-1 sm:grid-cols-5 xl:grid-cols-3"
                    style={{ width: "100%" }}
                  >
                    {availableFilters.map(filter => (
                      <TabsTrigger
                        key={filter.value}
                        value={filter.value}
                        className="h-8 min-w-0 px-2 text-xs"
                      >
                        {filter.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              <div
                data-testid="template-list-scroll"
                className="h-[320px] min-h-0 flex-1 overflow-y-auto overscroll-contain xl:h-auto"
              >
                <div className="space-y-2 p-3">
                  {visibleTemplates.map(template => (
                    <TemplateListItem
                      key={template.id}
                      template={template}
                      selected={template.id === selectedTemplate.id}
                      onSelect={() => selectTemplate(template)}
                    />
                  ))}
                </div>
              </div>
            </aside>

            <div className="grid min-h-0 min-w-0 grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(420px,1fr)] xl:grid-rows-[minmax(0,3fr)_minmax(220px,2fr)]">
              <section className="border-b border-border/70 bg-background/20 p-4 md:p-5 xl:overflow-y-auto">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <SelectedTemplateIcon template={selectedTemplate} />
                      <h2 className="text-lg font-semibold text-foreground">
                        {selectedTemplate.title}
                      </h2>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-normal",
                          statusStyles[selectedTemplate.status]
                        )}
                      >
                        {commandCenterStatusLabels[selectedTemplate.status]}
                      </Badge>
                    </div>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                      {selectedTemplate.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 lg:max-w-[42%] lg:justify-end">
                    {selectedTemplate.agentIds.map(agentId => (
                      <Badge
                        key={agentId}
                        variant="secondary"
                        className="font-normal"
                      >
                        {agentLabels[agentId] ?? agentId.replaceAll("_", " ")}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedTemplate.fields.map(field => (
                      <TemplateFieldControl
                        key={field.key}
                        templateId={selectedTemplate.id}
                        field={field}
                        value={templateValues[field.key] ?? ""}
                        onChange={value =>
                          setTemplateValues(previous => ({
                            ...previous,
                            [field.key]: value,
                          }))
                        }
                      />
                    ))}
                  </div>

                  <div className="border-t border-border/70 pt-4 2xl:border-t-0 2xl:border-l 2xl:pt-0 2xl:pl-5">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Výstupy
                    </p>
                    <div className="mt-2 space-y-2">
                      {selectedTemplate.outputs.map(output => (
                        <div
                          key={output}
                          className="flex items-start gap-2 text-sm text-foreground"
                        >
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                          <span>{output}</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      onClick={preparePrompt}
                      disabled={missingRequiredFields.length > 0}
                      className="mt-4 w-full bg-cyan-600 text-white hover:bg-cyan-500"
                    >
                      <Sparkles className="size-4" />
                      Připravit zadání
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={saveForApproval}
                      disabled={
                        missingRequiredFields.length > 0 ||
                        createWorkflowDraft.isPending
                      }
                      className="mt-2 w-full"
                    >
                      {createWorkflowDraft.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="size-4" />
                      )}
                      Uložit ke schválení
                    </Button>
                    {selectedIntegrationPoints.length > 0 && (
                      <div className="mt-3 border-t border-border/70 pt-3">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          Napojené moduly
                        </p>
                        <div className="mt-2 space-y-2">
                          {selectedIntegrationPoints.map(point =>
                            point.transport === "local_route" && point.route ? (
                              <Button
                                key={point.id}
                                type="button"
                                variant="secondary"
                                onClick={() => setLocation(point.route!)}
                                className="w-full justify-start"
                              >
                                <Play className="size-4" />
                                {point.label}
                                <Badge
                                  variant="outline"
                                  className="ml-auto font-normal"
                                >
                                  {platformLabels[point.platform]}
                                </Badge>
                              </Button>
                            ) : (
                              <div
                                key={point.id}
                                className="rounded-md border border-border/70 bg-background/60 px-3 py-2"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-medium text-foreground">
                                    {point.label}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="font-normal"
                                  >
                                    {platformLabels[point.platform]}
                                  </Badge>
                                  <Badge
                                    variant="secondary"
                                    className="font-normal"
                                  >
                                    {integrationStateLabels[point.state]}
                                  </Badge>
                                </div>
                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                  {point.toolName ?? point.eventName}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                    {missingRequiredFields.length > 0 && (
                      <p className="mt-2 text-xs leading-5 text-rose-300">
                        Doplňte:{" "}
                        {missingRequiredFields
                          .map(field => field.label)
                          .join(", ")}
                        .
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="grid min-h-0 grid-rows-[minmax(280px,1fr)_auto] overflow-hidden bg-background/35 xl:grid-rows-[minmax(0,1fr)_auto]">
                <ScrollArea ref={chatScrollAreaRef} className="h-full min-h-0">
                  <div className="space-y-5 p-4 md:p-5">
                    {messages.map(message => (
                      <ChatMessageRow key={message.id} message={message} />
                    ))}

                    {(hermesChat.isPending || heraChat.isPending) && (
                      <div className="flex items-start gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                          <Bot className="size-4" />
                        </div>
                        <div className="flex min-h-10 items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-2 text-sm text-muted-foreground">
                          <Loader2 className="size-4 animate-spin text-cyan-300" />
                          {orchestratorMode === "hera" ? "HERA" : "HERMES"}{" "}
                          připravuje plán a podklady...
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="border-t border-border/70 bg-background/80 p-3 md:p-4">
                  {preparedTemplateId && (
                    <div className="mb-2 flex items-center gap-2 text-xs text-cyan-300">
                      <Sparkles className="size-3.5" />
                      Zadání vytvořeno ze šablony {selectedTemplate.title}
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <Textarea
                      ref={promptRef}
                      value={inputValue}
                      onChange={event => {
                        setInputValue(event.target.value);
                        if (!event.target.value.trim())
                          setPreparedTemplateId(null);
                      }}
                      onKeyDown={event => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={
                        orchestratorMode === "hera"
                          ? "Vyberte marketingovou šablonu nebo napište zadání..."
                          : "Vyberte šablonu nebo napište vlastní zadání..."
                      }
                      className="max-h-52 min-h-20 resize-y bg-card"
                    />
                    <Button
                      type="button"
                      size="icon"
                      onClick={handleSend}
                      disabled={
                        !inputValue.trim() ||
                        hermesChat.isPending ||
                        heraChat.isPending
                      }
                      className="size-11 shrink-0 bg-cyan-600 text-white hover:bg-cyan-500"
                      aria-label="Odeslat zadání"
                      title="Odeslat zadání"
                    >
                      {hermesChat.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <ArrowUp className="size-4" />
                      )}
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Enter odešle, Shift + Enter vloží nový řádek. Externí akce
                    musí projít schválením.
                  </p>
                </div>
              </section>
            </div>
          </div>
        ) : (
          <WorkflowRunsView
            mode={workspaceView}
            onOpenTemplates={() => setWorkspaceView("templates")}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

function WorkflowRunsView({
  mode,
  onOpenTemplates,
}: {
  mode: Exclude<WorkspaceView, "templates">;
  onOpenTemplates: () => void;
}) {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const missionsQuery = trpc.hermes.getMissions.useQuery();
  const refresh = async () => utils.hermes.getMissions.invalidate();
  const approve = trpc.hermes.approveWorkflow.useMutation({
    onSuccess: refresh,
  });
  const reject = trpc.hermes.rejectWorkflow.useMutation({ onSuccess: refresh });
  const execute = trpc.hermes.executeWorkflow.useMutation({
    onSuccess: refresh,
  });

  const missions = (missionsQuery.data ?? []).filter(mission =>
    mode === "approvals"
      ? mission.status === "awaiting_approval"
      : mission.missionType.startsWith("command-center:")
  );
  const isMutating = approve.isPending || reject.isPending || execute.isPending;

  const statusLabels: Record<string, string> = {
    awaiting_approval: "Čeká na schválení",
    approved: "Schváleno",
    running: "Probíhá",
    completed: "Dokončeno",
    failed: "Selhalo",
    rejected: "Zamítnuto",
  };

  return (
    <section className="min-h-[620px] border border-border/70 bg-card/20">
      <div className="flex flex-col justify-between gap-3 border-b border-border/70 p-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {mode === "approvals" ? "Čekající schválení" : "Běhy workflow"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Každý stav vychází z uloženého běhu; plán není vydáván za externě
            provedenou akci.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void missionsQuery.refetch()}
        >
          <RotateCcw
            className={cn(
              "size-3.5",
              missionsQuery.isFetching && "animate-spin"
            )}
          />
          Obnovit
        </Button>
      </div>

      <div className="divide-y divide-border/70">
        {missions.map(mission => {
          const result = (mission.result ?? {}) as Record<string, any>;
          const artifacts = (result.artifacts ?? []) as Array<
            Record<string, any>
          >;
          const plan = mission.plan ?? [];
          return (
            <article key={mission.id} className="p-4 md:p-5">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-foreground">
                      {mission.title}
                    </h3>
                    <Badge variant="outline">
                      {statusLabels[mission.status] ?? mission.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      #{mission.id}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Vytvořeno{" "}
                    {new Date(mission.createdAt).toLocaleString("cs-CZ")}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {mission.status === "awaiting_approval" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                          approve.mutate({ missionId: mission.id })
                        }
                        disabled={isMutating}
                      >
                        <ShieldCheck className="size-4" />
                        Schválit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reject.mutate({ missionId: mission.id })}
                        disabled={isMutating}
                      >
                        <XCircle className="size-4" />
                        Zamítnout
                      </Button>
                    </>
                  )}
                  {mission.status === "approved" && (
                    <Button
                      size="sm"
                      onClick={() => execute.mutate({ missionId: mission.id })}
                      disabled={isMutating}
                    >
                      <Play className="size-4" />
                      Spustit
                    </Button>
                  )}
                  {mission.status === "failed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => execute.mutate({ missionId: mission.id })}
                      disabled={isMutating}
                    >
                      <RotateCcw className="size-4" />
                      Opakovat
                    </Button>
                  )}
                </div>
              </div>

              <ol className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {plan.map((step, index) => (
                  <li
                    key={`${mission.id}-${index}`}
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                  >
                    <span
                      className={cn(
                        "mt-1 size-2 shrink-0 rounded-full",
                        step.status === "completed" && "bg-emerald-400",
                        step.status === "running" && "bg-cyan-400",
                        step.status === "failed" && "bg-rose-400",
                        step.status === "pending" && "bg-slate-600"
                      )}
                    />
                    <span>{step.step}</span>
                  </li>
                ))}
              </ol>

              {artifacts.length > 0 && (
                <div className="mt-5 border-t border-border/70 pt-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Artefakty
                  </p>
                  <div className="mt-2 space-y-2">
                    {artifacts.map(artifact =>
                      artifact.type === "action" && artifact.route ? (
                        <Button
                          key={artifact.id}
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(String(artifact.route))}
                        >
                          <Play className="size-3.5" />
                          {artifact.title}
                        </Button>
                      ) : artifact.type === "integration_contract" ? (
                        <details
                          key={artifact.id}
                          className="border-l-2 border-amber-500/40 pl-3"
                        >
                          <summary className="cursor-pointer text-sm font-medium text-foreground">
                            {artifact.title} · {artifact.platform}
                          </summary>
                          <div className="mt-2 space-y-1 text-xs leading-5 text-muted-foreground">
                            <p>{String(artifact.description ?? "")}</p>
                            <p>
                              Kontrakt:{" "}
                              {String(
                                artifact.toolName ?? artifact.eventName ?? ""
                              )}
                            </p>
                            <p>{String(artifact.ownerBoundary ?? "")}</p>
                          </div>
                        </details>
                      ) : (
                        <details
                          key={artifact.id}
                          className="border-l-2 border-cyan-500/30 pl-3"
                        >
                          <summary className="cursor-pointer text-sm font-medium text-foreground">
                            {artifact.title}
                          </summary>
                          <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-xs leading-5 text-muted-foreground">
                            {String(artifact.content ?? "")}
                          </pre>
                        </details>
                      )
                    )}
                  </div>
                </div>
              )}
            </article>
          );
        })}

        {!missions.length && !missionsQuery.isLoading && (
          <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
            <ShieldCheck className="size-7 text-slate-500" />
            <p className="mt-3 text-sm font-medium text-foreground">
              {mode === "approvals"
                ? "Nic nečeká na schválení"
                : "Zatím není uložený žádný běh"}
            </p>
            <Button variant="link" onClick={onOpenTemplates}>
              Otevřít šablony
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

function TemplateFieldControl({
  templateId,
  field,
  value,
  onChange,
}: {
  templateId: string;
  field: CommandCenterTemplateField;
  value: string;
  onChange: (value: string) => void;
}) {
  const suggestions = getCommandCenterFieldSuggestions(field);
  const listId = `${templateId}-${field.key}-suggestions`;
  const isInvalid = Boolean(field.required && !value.trim());

  return (
    <label className="min-w-0 space-y-1.5">
      <span className="flex items-center gap-1 text-xs font-medium text-foreground">
        {field.label}
        {field.required && (
          <span className="text-rose-400" aria-label="povinné">
            *
          </span>
        )}
      </span>

      {field.options && !field.allowCustom ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger
            className="h-10 w-full bg-background/70"
            aria-invalid={isInvalid}
          >
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {suggestions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.multiline ? (
        <div className="space-y-1.5">
          <Textarea
            value={value}
            onChange={event => onChange(event.target.value)}
            placeholder={field.placeholder}
            aria-invalid={isInvalid}
            rows={2}
            className="min-h-16 resize-y bg-background/70"
          />
          <Select value="" onValueChange={onChange}>
            <SelectTrigger className="h-8 w-full bg-background/50 text-xs">
              <SelectValue placeholder="Vybrat doporučený příklad…" />
            </SelectTrigger>
            <SelectContent>
              {suggestions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <>
          <Input
            value={value}
            onChange={event => onChange(event.target.value)}
            placeholder={field.placeholder}
            aria-invalid={isInvalid}
            aria-autocomplete="list"
            autoComplete="off"
            className="h-10 bg-background/70"
            list={suggestions.length > 0 ? listId : undefined}
          />
          {suggestions.length > 0 && (
            <datalist id={listId}>
              {suggestions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </datalist>
          )}
        </>
      )}
    </label>
  );
}

function TemplateListItem({
  template,
  selected,
  onSelect,
}: {
  template: CommandCenterTemplate;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = templateIcons[template.icon];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg border p-3 text-left transition-colors",
        selected
          ? "border-cyan-500/50 bg-cyan-500/10"
          : "border-border/70 bg-card/45 hover:border-border hover:bg-card"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg border",
            selected
              ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
              : "border-border bg-background text-muted-foreground"
          )}
        >
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium leading-5 text-foreground">
              {template.title}
            </span>
            <span
              className={cn(
                "mt-1 size-2 shrink-0 rounded-full",
                template.status === "live" && "bg-emerald-400",
                template.status === "guided" && "bg-amber-400",
                template.status === "roadmap" && "bg-rose-400"
              )}
              title={commandCenterStatusLabels[template.status]}
            />
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
            {template.description}
          </p>
        </div>
      </div>
    </button>
  );
}

function SelectedTemplateIcon({
  template,
}: {
  template: CommandCenterTemplate;
}) {
  const Icon = templateIcons[template.icon];

  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
      <Icon className="size-4" />
    </div>
  );
}

function ChatMessageRow({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isHera = message.role === "hera";
  const isSystem = message.role === "system";

  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg border",
          isUser
            ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
            : isSystem
              ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
              : isHera
                ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
        )}
      >
        {isUser ? (
          <User className="size-4" />
        ) : isHera ? (
          <Sparkles className="size-4" />
        ) : (
          <Bot className="size-4" />
        )}
      </div>

      <div
        className={cn(
          "max-w-[88%] rounded-lg border px-3 py-2.5 md:max-w-[80%]",
          isUser
            ? "border-blue-500/25 bg-blue-500/10"
            : isSystem
              ? "border-rose-500/25 bg-rose-500/10"
              : isHera
                ? "border-violet-500/25 bg-violet-500/10"
                : "border-border/70 bg-card"
        )}
      >
        <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {isUser ? "Vy" : isSystem ? "Systém" : isHera ? "HERA" : "HERMES"}
          </span>
          {message.templateTitle && (
            <Badge variant="secondary" className="h-5 font-normal">
              {message.templateTitle}
            </Badge>
          )}
          {message.agentsUsed
            ?.filter(agentId => agentId !== "hermes" && agentId !== "hera")
            .map(agentId => (
              <Badge
                key={agentId}
                variant="outline"
                className="h-5 font-normal"
              >
                {agentLabels[agentId] ?? agentId.replaceAll("_", " ")}
              </Badge>
            ))}
        </div>
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
          {message.content}
        </p>
        {(message.intent || message.routingDecision) && (
          <div className="mt-2 border-t border-border/60 pt-2 text-xs text-muted-foreground">
            {message.intent && <span>Záměr: {message.intent}</span>}
            {message.intent && message.routingDecision && (
              <span aria-hidden="true"> · </span>
            )}
            {message.routingDecision && <span>{message.routingDecision}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
