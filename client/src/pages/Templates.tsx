import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, Mail, Edit2, Trash2, Copy, Eye, Variable } from "lucide-react";

const VARIABLES = [
  { key: "{{companyName}}", desc: "Company name" },
  { key: "{{contactName}}", desc: "Contact person name" },
  { key: "{{industry}}", desc: "Industry sector" },
  { key: "{{location}}", desc: "Company location" },
  { key: "{{icebreaker}}", desc: "AI-generated icebreaker" },
];

function fillTemplate(body: string, lead?: Record<string, string>) {
  if (!lead) return body;
  return body
    .replace(/\{\{companyName\}\}/g, lead.companyName ?? "Acme Corp")
    .replace(/\{\{contactName\}\}/g, lead.contactName ?? "John Smith")
    .replace(/\{\{industry\}\}/g, lead.industry ?? "Technology")
    .replace(/\{\{location\}\}/g, lead.location ?? "San Francisco")
    .replace(/\{\{icebreaker\}\}/g, lead.icebreaker ?? "I came across your company and was impressed by your innovative approach.");
}

export default function Templates() {
  const utils = trpc.useUtils();
  const { data: templates = [], isLoading } = trpc.templates.list.useQuery();

  const createMutation = trpc.templates.create.useMutation({
    onSuccess: () => { utils.templates.list.invalidate(); toast.success("Template created"); setShowForm(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.templates.update.useMutation({
    onSuccess: () => { utils.templates.list.invalidate(); toast.success("Template updated"); setShowForm(false); setEditId(null); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.templates.delete.useMutation({
    onSuccess: () => { utils.templates.list.invalidate(); toast.success("Template deleted"); setDeleteId(null); },
    onError: (e) => toast.error(e.message),
  });

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [previewId, setPreviewId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const resetForm = () => { setName(""); setSubject(""); setBody(""); };

  const handleEdit = (t: (typeof templates)[0]) => {
    setEditId(t.id);
    setName(t.name);
    setSubject(t.subject);
    setBody(t.body);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!name.trim() || !subject.trim() || !body.trim()) {
      toast.error("All fields are required");
      return;
    }
    if (editId) {
      updateMutation.mutate({ id: editId, name, subject, body });
    } else {
      createMutation.mutate({ name, subject, body });
    }
  };

  const insertVariable = (v: string) => {
    setBody((prev) => prev + v);
  };

  const previewTemplate = templates.find((t) => t.id === previewId);

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Email Templates</h1>
            <p className="text-sm text-white/50 mt-1">Create reusable outreach templates with smart variables that auto-fill with lead data.</p>
          </div>
          <Button
            className="bg-violet-600 hover:bg-violet-700"
            onClick={() => { resetForm(); setEditId(null); setShowForm(true); }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>

        {/* Variable Reference */}
        <Card className="bg-white/[0.03] border-white/[0.06] mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Variable className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-semibold text-white">Available Variables</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {VARIABLES.map((v) => (
                <Badge
                  key={v.key}
                  className="bg-violet-500/10 text-violet-300 border-violet-500/20 cursor-pointer hover:bg-violet-500/20 font-mono text-xs"
                  title={v.desc}
                >
                  {v.key}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Template List */}
        {isLoading ? (
          <div className="text-center py-16 text-white/40">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16">
            <Mail className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40 text-lg font-medium">No templates yet</p>
            <p className="text-white/30 text-sm mt-1">Create your first email template to get started.</p>
            <Button className="mt-4 bg-violet-600 hover:bg-violet-700" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" /> Create Template
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {templates.map((t) => (
              <Card key={t.id} className="bg-white/[0.03] border-white/[0.06] hover:border-white/10 transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">{t.name}</h3>
                      </div>
                      <p className="text-sm text-white/50 mb-2 font-medium">Subject: {t.subject}</p>
                      <p className="text-sm text-white/40 line-clamp-2">{t.body}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white/50 hover:text-white"
                        onClick={() => setPreviewId(t.id)}
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white/50 hover:text-white"
                        onClick={() => handleEdit(t)}
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white/50 hover:text-red-400"
                        onClick={() => setDeleteId(t.id)}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showForm} onOpenChange={(o) => { setShowForm(o); if (!o) { setEditId(null); resetForm(); } }}>
          <DialogContent className="bg-[#13131a] border-white/10 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">{editId ? "Edit Template" : "New Email Template"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-white/70 text-sm mb-1.5 block">Template Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Finance Outreach - Insurance"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              <div>
                <Label className="text-white/70 text-sm mb-1.5 block">Email Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Quick question about {{companyName}}"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-white/70 text-sm">Email Body</Label>
                  <div className="flex gap-1">
                    {VARIABLES.map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => insertVariable(v.key)}
                        className="text-xs px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 font-mono transition-colors"
                        title={`Insert ${v.desc}`}
                      >
                        {v.key.replace(/\{\{|\}\}/g, "")}
                      </button>
                    ))}
                  </div>
                </div>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={`Hi {{contactName}},\n\n{{icebreaker}}\n\nI'd love to connect and explore how we can help {{companyName}} in the {{industry}} space.\n\nBest regards`}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[180px] font-mono text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" className="text-white/60" onClick={() => { setShowForm(false); setEditId(null); resetForm(); }}>
                Cancel
              </Button>
              <Button
                className="bg-violet-600 hover:bg-violet-700"
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editId ? "Save Changes" : "Create Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={!!previewId} onOpenChange={(o) => { if (!o) setPreviewId(null); }}>
          <DialogContent className="bg-[#13131a] border-white/10 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Template Preview</DialogTitle>
            </DialogHeader>
            {previewTemplate && (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-xs text-white/40 mb-1">Subject</div>
                  <div className="text-sm text-white font-medium">
                    {fillTemplate(previewTemplate.subject)}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-xs text-white/40 mb-2">Body (with sample data)</div>
                  <pre className="text-sm text-white/80 whitespace-pre-wrap font-sans leading-relaxed">
                    {fillTemplate(previewTemplate.body)}
                  </pre>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="ghost"
                className="text-white/60"
                onClick={() => {
                  if (previewTemplate) {
                    navigator.clipboard.writeText(fillTemplate(previewTemplate.body));
                    toast.success("Copied to clipboard");
                  }
                }}
              >
                <Copy className="w-4 h-4 mr-2" /> Copy Body
              </Button>
              <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => setPreviewId(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm */}
        <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
          <AlertDialogContent className="bg-[#13131a] border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Delete Template?</AlertDialogTitle>
              <AlertDialogDescription className="text-white/50">
                This action cannot be undone. The template will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Zrušit</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => { if (deleteId) deleteMutation.mutate({ id: deleteId }); }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
