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
import { UserCheck, Plus, Trash2, Play, Pause, Loader2, Mail, MessageSquare, Clock, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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

  const createMut = trpc.sdr.create.useMutation({
    onSuccess: () => {
      toast.success("SDR campaign created");
      utils.sdr.list.invalidate();
      setOpen(false);
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
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
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
                          onClick={() => updateMut.mutate({ id: campaign.id, status: "active" })}
                        >
                          <Play className="h-4 w-4 mr-1" /> Activate
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
    </DashboardLayout>
  );
}
