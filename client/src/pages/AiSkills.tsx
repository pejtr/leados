import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  BookOpen, Plus, Search, Play, Edit2, Trash2, Share2, Tag,
  Zap, FileText, GitBranch, ClipboardList, Loader2, X, ChevronDown, ChevronUp,
  Brain, CheckCircle2, Clock, BarChart2
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  "general": "bg-slate-100 text-slate-700",
  "lead-gen": "bg-blue-100 text-blue-700",
  "outreach": "bg-emerald-100 text-emerald-700",
  "research": "bg-violet-100 text-violet-700",
  "sdr": "bg-orange-100 text-orange-700",
  "analysis": "bg-yellow-100 text-yellow-700",
  "content": "bg-pink-100 text-pink-700",
  "sop": "bg-teal-100 text-teal-700",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  "prompt": <Brain className="h-3.5 w-3.5" />,
  "workflow": <GitBranch className="h-3.5 w-3.5" />,
  "template": <FileText className="h-3.5 w-3.5" />,
  "sop": <ClipboardList className="h-3.5 w-3.5" />,
};

interface Skill {
  id: number;
  title: string;
  description: string | null;
  category: string;
  skillType: string;
  content: string;
  variables: string[] | null;
  exampleInput: Record<string, string> | null;
  tags: string | null;
  isShared: boolean;
  usageCount: number;
  lastUsedAt: number | null;
  createdAt: number;
  updatedAt: number;
  userId: number;
}

export default function AiSkills() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [expandedSkill, setExpandedSkill] = useState<number | null>(null);
  const [executingSkill, setExecutingSkill] = useState<Skill | null>(null);
  const [execVars, setExecVars] = useState<Record<string, string>>({});
  const [execResult, setExecResult] = useState<string>("");

  const { data: skills = [], refetch } = trpc.aiSkills.list.useQuery({
    search: search || undefined,
    category: filterCategory !== "all" ? filterCategory : undefined,
    skillType: filterType !== "all" ? filterType : undefined,
  });

  const seedMutation = trpc.aiSkills.seedDefaults.useMutation({
    onSuccess: (data) => {
      if (data.seeded > 0) {
        toast.success(`${data.seeded} výchozích skills načteno!`);
        refetch();
      }
    },
  });

  const deleteMutation = trpc.aiSkills.delete.useMutation({
    onSuccess: () => { toast.success("Skill smazán"); refetch(); },
  });

  const executeMutation = trpc.aiSkills.execute.useMutation({
    onSuccess: (data) => {
      setExecResult(data.result);
      toast.success(`Skill "${data.skillTitle}" spuštěn`);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  // Auto-seed on first load if no skills
  useEffect(() => {
    if (skills.length === 0) {
      seedMutation.mutate();
    }
  }, [skills.length]);

  const handleExecute = (skill: Skill) => {
    setExecutingSkill(skill);
    setExecVars({});
    setExecResult("");
  };

  const runSkill = () => {
    if (!executingSkill) return;
    executeMutation.mutate({ id: executingSkill.id, variables: execVars });
  };

  const categories = ["all", "general", "lead-gen", "outreach", "research", "sdr", "analysis", "content", "sop"];
  const types = ["all", "prompt", "workflow", "template", "sop"];

  return (
    <DashboardLayout>
      <div className="max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              AI Skills Library
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Centralizovaná knihovna promptů, workflow a SOP — sdílená s celým týmem. Inspirováno AI OS konceptem.
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nový Skill
          </Button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Celkem Skills", value: skills.length, icon: <BookOpen className="h-4 w-4" />, color: "text-blue-600" },
            { label: "Sdílené s týmem", value: skills.filter(s => s.isShared).length, icon: <Share2 className="h-4 w-4" />, color: "text-emerald-600" },
            { label: "Celkem spuštění", value: skills.reduce((s, k) => s + k.usageCount, 0), icon: <Play className="h-4 w-4" />, color: "text-violet-600" },
            { label: "Kategorie", value: new Set(skills.map(s => s.category)).size, icon: <Tag className="h-4 w-4" />, color: "text-orange-600" },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
              <div className={cn("p-2 rounded-lg bg-muted", stat.color)}>{stat.icon}</div>
              <div>
                <div className="text-xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Hledat skills..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-input border-border"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40 bg-input border-border">
              <SelectValue placeholder="Kategorie" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(c => (
                <SelectItem key={c} value={c}>{c === "all" ? "Všechny kategorie" : c.charAt(0).toUpperCase() + c.slice(1).replace("-", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-36 bg-input border-border">
              <SelectValue placeholder="Typ" />
            </SelectTrigger>
            <SelectContent>
              {types.map(t => (
                <SelectItem key={t} value={t}>{t === "all" ? "Všechny typy" : t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Skills Grid */}
        <div className="space-y-2">
          {skills.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Žádné skills nenalezeny</p>
              <Button variant="outline" className="mt-3" onClick={() => seedMutation.mutate()}>
                Načíst výchozí skills
              </Button>
            </div>
          ) : (
            skills.map(skill => (
              <div key={skill.id} className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Skill header */}
                <div className="p-4 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted text-muted-foreground mt-0.5">
                    {TYPE_ICONS[skill.skillType] || <Brain className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground text-sm">{skill.title}</h3>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", CATEGORY_COLORS[skill.category] || "bg-slate-100 text-slate-700")}>
                        {skill.category}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                        {skill.skillType}
                      </span>
                      {skill.isShared && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium flex items-center gap-1">
                          <Share2 className="h-2.5 w-2.5" />
                          Sdílené
                        </span>
                      )}
                    </div>
                    {skill.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{skill.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Play className="h-3 w-3" />{skill.usageCount}× spuštěno</span>
                      {skill.tags && (
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {skill.tags.split(",").slice(0, 3).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs gap-1" onClick={() => handleExecute(skill)}>
                      <Play className="h-3 w-3" />
                      Spustit
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setExpandedSkill(expandedSkill === skill.id ? null : skill.id)}>
                      {expandedSkill === skill.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => {
                      if (confirm("Smazat skill?")) deleteMutation.mutate({ id: skill.id });
                    }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Expanded content */}
                {expandedSkill === skill.id && (
                  <div className="border-t border-border bg-muted/30 p-4">
                    <Label className="text-xs text-muted-foreground mb-2 block">Obsah skill</Label>
                    <pre className="text-xs bg-background border border-border rounded-lg p-3 whitespace-pre-wrap font-mono overflow-auto max-h-64">
                      {skill.content}
                    </pre>
                    {skill.variables && skill.variables.length > 0 && (
                      <div className="mt-3">
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Proměnné</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {skill.variables.map(v => (
                            <code key={v} className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded font-mono">{`{{${v}}}`}</code>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Execute Modal */}
      {executingSkill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Spustit: {executingSkill.title}</h2>
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setExecutingSkill(null); setExecResult(""); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-5 space-y-4">
              {/* Variables */}
              {executingSkill.variables && executingSkill.variables.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Vyplňte proměnné</Label>
                  {executingSkill.variables.map(v => (
                    <div key={v} className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{`{{${v}}}`}</Label>
                      <Input
                        value={execVars[v] || ""}
                        onChange={e => setExecVars(prev => ({ ...prev, [v]: e.target.value }))}
                        placeholder={executingSkill.exampleInput?.[v] || `Zadejte ${v}...`}
                        className="bg-input border-border text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Result */}
              {execResult && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Výsledek
                  </Label>
                  <div className="bg-muted border border-border rounded-xl p-4 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {execResult}
                  </div>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => {
                    navigator.clipboard.writeText(execResult);
                    toast.success("Zkopírováno!");
                  }}>
                    Kopírovat výsledek
                  </Button>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button onClick={runSkill} disabled={executeMutation.isPending} className="gap-2 flex-1">
                  {executeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  {executeMutation.isPending ? "Zpracovávám..." : "Spustit Skill"}
                </Button>
                <Button variant="outline" onClick={() => { setExecutingSkill(null); setExecResult(""); }}>
                  Zavřít
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && <CreateSkillModal onClose={() => setShowCreateModal(false)} onCreated={() => { setShowCreateModal(false); refetch(); }} />}
    </DashboardLayout>
  );
}

function CreateSkillModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [skillType, setSkillType] = useState("prompt");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [isShared, setIsShared] = useState(false);

  const createMutation = trpc.aiSkills.create.useMutation({
    onSuccess: () => { toast.success("Skill vytvořen!"); onCreated(); },
    onError: (err) => toast.error(err.message),
  });

  // Auto-detect variables from content
  const detectedVars = [...new Set((content.match(/\{\{(\w+)\}\}/g) || []).map(m => m.slice(2, -2)))];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ title, description, category: category as any, skillType: skillType as any, content, tags, isShared, variables: detectedVars });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><Plus className="h-4 w-4 text-primary" />Nový AI Skill</h2>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label>Název *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="např. LinkedIn Icebreaker Generator" className="bg-input border-border" required />
          </div>
          <div className="space-y-1.5">
            <Label>Popis</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Krátký popis co skill dělá" className="bg-input border-border" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Kategorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-input border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["general", "lead-gen", "outreach", "research", "sdr", "analysis", "content", "sop"].map(c => (
                    <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1).replace("-", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Typ</Label>
              <Select value={skillType} onValueChange={setSkillType}>
                <SelectTrigger className="bg-input border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["prompt", "workflow", "template", "sop"].map(t => (
                    <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Obsah *</Label>
            <p className="text-[11px] text-muted-foreground">Použijte {`{{proměnná}}`} pro dynamické vstupy</p>
            <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Zadejte prompt, workflow nebo SOP..." className="bg-input border-border min-h-[180px] font-mono text-sm" required />
            {detectedVars.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                <span className="text-[11px] text-muted-foreground">Detekované proměnné:</span>
                {detectedVars.map(v => <code key={v} className="text-[11px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">{`{{${v}}}`}</code>)}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Tagy (oddělené čárkou)</Label>
            <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="linkedin,outreach,b2b" className="bg-input border-border" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isShared} onChange={e => setIsShared(e.target.checked)} className="rounded" />
            <span className="text-sm">Sdílet s celým týmem</span>
          </label>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={createMutation.isPending} className="flex-1 gap-2">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Vytvořit Skill
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Zrušit</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
