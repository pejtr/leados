import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCheck, Plus, Trash2, Play, Pause, Loader2, Mail, MessageSquare, Clock, Send, Sparkles, ShieldCheck, AlertTriangle, Eye, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useGoogleAds } from "@/hooks/useGoogleAds";

export default function SdrAgent() {
  const [open, setOpen] = useState(false);
  const [emailPreview, setEmailPreview] = useState<{ subject: string; body: string } | null>(null);
  const [generatingFor, setGeneratingFor] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    industry: "",
    location: "",
    seniorityLevel: "C-Level",
    leadCount: 20,
    emailSubject: "",
    emailTone: "professional" as "professional" | "friendly" | "direct",
    followUpDays: 3,
    maxFollowUps: 2,
  });

  const utils = trpc.useUtils();
  const { data: campaigns = [], isLoading } = trpc.sdr.list.useQuery();
  const { data: industries } = trpc.leads.industries.useQuery();
  const { track } = useGoogleAds();

  const createMut = trpc.sdr.create.useMutation({
    onSuccess: () => {
      toast.success("SDR campaign created");
      utils.sdr.list.invalidate();
      setOpen(false);
      track('sdr_email_generated', { campaign_name: form.name, industry: form.industry });
      setForm({ name: "", industry: "", location: "", seniorityLevel: "C-Level", leadCount: 20, emailSubject: "", emailTone: "professional", followUpDays: 3, maxFollowUps: 2 });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = trpc.sdr.update.useMutation({
    onSuccess: () => utils.sdr.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = trpc.sdr.delete.useMutation({
    onSuccess: () => {
      toast.success("Campaign deleted");
      utils.sdr.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const generateEmailMut = trpc.sdr.generateEmail.useMutation({
    onSuccess: (data) => {
      setEmailPreview(data);
      toast.success("Email draft generated!");
      track('sdr_email_generated', { value: 1 });
    },
    onError: (e) => {
      toast.error(e.message);
      setGeneratingFor(null);
    },
  });

  const handleGenerateEmail = (campaign: any) => {
    setGeneratingFor(campaign.id);
    setEmailPreview(null);
    generateEmailMut.mutate({
      companyName: "Example Corp",
      contactName: "Decision Maker",
      industry: campaign.industry,
      tone: campaign.emailTone,
    });
  };

  const [approvalCampaign, setApprovalCampaign] = useState<any | null>(null);

  const handleActivateWithApproval = (campaign: any) => {
    // Human-in-the-Loop: show review screen before activating
    setApprovalCampaign(campaign);
    setGeneratingFor(campaign.id);
    setEmailPreview(null);
    generateEmailMut.mutate({
      companyName: "Example Corp",
      contactName: "Decision Maker",
      industry: campaign.industry,
      tone: campaign.emailTone,
      subject: campaign.emailSubject || undefined,
    });
  };

  const confirmActivate = () => {
    if (!approvalCampaign) return;
    updateMut.mutate({ id: approvalCampaign.id, status: "active" });
    setApprovalCampaign(null);
    toast.success("Kampaň aktivována po schválení ✓");
  };

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    active: "bg-green-500/10 text-green-500",
    paused: "bg-yellow-500/10 text-yellow-500",
    completed: "bg-blue-500/10 text-blue-500",
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-primary" />
              AI SDR Agent
            </h1>
            <p className="text-muted-foreground mt-1">
              Automate outreach campaigns with AI-generated personalized emails.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> New Campaign</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create SDR Campaign</DialogTitle>
                <DialogDescription>Set up an AI-powered outreach campaign.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Campaign Name</Label>
                  <Input placeholder="e.g. Q1 Enterprise Outreach" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Industry</Label>
                    <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {(industries || []).map((ind: string) => (
                          <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input placeholder="e.g. United States" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Seniority Level</Label>
                    <Select value={form.seniorityLevel} onValueChange={(v) => setForm({ ...form, seniorityLevel: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Entry", "Manager", "Director", "VP", "C-Level"].map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Lead Count</Label>
                    <Input type="number" min={1} max={100} value={form.leadCount} onChange={(e) => setForm({ ...form, leadCount: parseInt(e.target.value) || 20 })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email Tone</Label>
                    <Select value={form.emailTone} onValueChange={(v: any) => setForm({ ...form, emailTone: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="direct">Direct</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Email Subject (optional)</Label>
                    <Input placeholder="Auto-generated if empty" value={form.emailSubject} onChange={(e) => setForm({ ...form, emailSubject: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Follow-up Delay (days)</Label>
                    <Input type="number" min={1} max={30} value={form.followUpDays} onChange={(e) => setForm({ ...form, followUpDays: parseInt(e.target.value) || 3 })} />
                  </div>
                  <div>
                    <Label>Max Follow-ups</Label>
                    <Input type="number" min={0} max={10} value={form.maxFollowUps} onChange={(e) => setForm({ ...form, maxFollowUps: parseInt(e.target.value) || 2 })} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Zrušit</Button>
                <Button
                  disabled={!form.name || !form.industry || !form.location || createMut.isPending}
                  onClick={() => createMut.mutate(form)}
                >
                  {createMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Create Campaign
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : campaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No SDR campaigns yet</h3>
              <p className="text-muted-foreground mb-4">Create your first AI-powered outreach campaign.</p>
              <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Create Campaign</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {campaigns.map((campaign: any) => (
              <Card key={campaign.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <Badge className={statusColors[campaign.status] || statusColors.draft}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateEmail(campaign)}
                        disabled={generateEmailMut.isPending && generatingFor === campaign.id}
                      >
                        {generateEmailMut.isPending && generatingFor === campaign.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-1" />
                        )}
                        Preview Email
                      </Button>
                      {campaign.status === "draft" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => handleActivateWithApproval(campaign)}
                        >
                          <ShieldCheck className="h-4 w-4 mr-1" /> Review & Activate
                        </Button>
                      )}
                      {campaign.status === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateMut.mutate({ id: campaign.id, status: "paused" })}
                        >
                          <Pause className="h-4 w-4 mr-1" /> Pause
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate({ id: campaign.id })} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    {campaign.industry} &middot; {campaign.location} &middot; {campaign.seniorityLevel} &middot; {campaign.leadCount} leads
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="capitalize">{campaign.emailTone}</span> tone
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Follow-up: {campaign.followUpDays}d, max {campaign.maxFollowUps}x
                    </div>
                    <div className="flex items-center gap-1">
                      <Send className="h-3.5 w-3.5" />
                      Sent: {campaign.emailsSent} / Replied: {campaign.emailsReplied}
                    </div>
                  </div>

                  {/* Email Preview */}
                  {generatingFor === campaign.id && emailPreview && (
                    <div className="mt-4 border-t pt-4 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">AI Email Preview</p>
                      <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                        <p className="text-sm font-medium">Subject: {emailPreview.subject}</p>
                        <p className="text-sm whitespace-pre-wrap">{emailPreview.body}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      {/* Human-in-the-Loop Approval Modal */}
      {approvalCampaign && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-border">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <h2 className="font-bold text-foreground">Human-in-the-Loop Review</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Zkontroluj kampaň před aktivací. AI připravila návrh — ty rozhoduješ.
              </p>
            </div>
            <div className="p-5 space-y-4">
              {/* Campaign summary */}
              <div className="bg-muted/40 rounded-xl p-4 space-y-2">
                <div className="text-sm font-semibold text-foreground">{approvalCampaign.name}</div>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div><span className="font-medium">Industrie:</span> {approvalCampaign.industry}</div>
                  <div><span className="font-medium">Lokace:</span> {approvalCampaign.location}</div>
                  <div><span className="font-medium">Seniority:</span> {approvalCampaign.seniorityLevel}</div>
                  <div><span className="font-medium">Leads:</span> {approvalCampaign.leadCount}</div>
                  <div><span className="font-medium">Tón:</span> {approvalCampaign.emailTone}</div>
                  <div><span className="font-medium">Follow-ups:</span> {approvalCampaign.maxFollowUps}× / {approvalCampaign.followUpDays}d</div>
                </div>
              </div>

              {/* Email preview */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Náhled AI emailu</span>
                </div>
                {generateEmailMut.isPending ? (
                  <div className="flex items-center justify-center py-8 bg-muted/30 rounded-xl">
                    <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                    <span className="text-sm text-muted-foreground">Generuji návrh emailu...</span>
                  </div>
                ) : emailPreview ? (
                  <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
                    <div className="text-sm">
                      <span className="font-medium text-muted-foreground">Předmět: </span>
                      <span className="text-foreground">{emailPreview.subject}</span>
                    </div>
                    <div className="border-t border-border pt-3 text-sm text-foreground whitespace-pre-wrap">{emailPreview.body}</div>
                  </div>
                ) : null}
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2.5 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                <p className="text-xs text-yellow-800">
                  <strong>Human-in-the-Loop:</strong> Po aktivaci začne AI automaticky odesílat emaily leadům. Ujisti se, že obsah emailu, cílová skupina a ton odpovídá tvé brand strategii.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setApprovalCampaign(null); setEmailPreview(null); }}
                >
                  Zrušit — vrátit do draftu
                </Button>
                <Button
                  className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={confirmActivate}
                  disabled={generateEmailMut.isPending || updateMut.isPending}
                >
                  {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Schválit & Aktivovat Kampaň
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
