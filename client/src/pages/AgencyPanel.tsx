import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Building, Plus, Trash2, Loader2, Users, BarChart3, Palette, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";


export default function AgencyPanel() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ clientName: "", clientEmail: "", clientDomain: "", industry: "", brandColor: "#7c3aed" });

  const utils = trpc.useUtils();
  const { data: clients = [], isLoading } = trpc.agency.list.useQuery();
  const createMutation = trpc.agency.create.useMutation({
    onSuccess: () => { utils.agency.list.invalidate(); setOpen(false); setForm({ clientName: "", clientEmail: "", clientDomain: "", industry: "", brandColor: "#7c3aed" }); toast.success("Client added"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.agency.delete.useMutation({
    onSuccess: () => { utils.agency.list.invalidate(); toast.success("Client removed"); },
  });
  const toggleMutation = trpc.agency.update.useMutation({
    onSuccess: () => { utils.agency.list.invalidate(); },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Building className="h-6 w-6 text-violet-500" /> Agency Panel</h1>
          <p className="text-muted-foreground mt-1">Multi-tenant white-label management for your agency clients</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Add Client</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Agency Client</DialogTitle>
              <DialogDescription>Set up a new client with white-label branding</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Client Name</Label><Input placeholder="Acme Corp" value={form.clientName} onChange={(e) => setForm(p => ({ ...p, clientName: e.target.value }))} /></div>
              <div><Label>Email</Label><Input placeholder="client@acme.com" value={form.clientEmail} onChange={(e) => setForm(p => ({ ...p, clientEmail: e.target.value }))} /></div>
              <div><Label>Domain</Label><Input placeholder="acme.com" value={form.clientDomain} onChange={(e) => setForm(p => ({ ...p, clientDomain: e.target.value }))} /></div>
              <div><Label>Industry</Label><Input placeholder="SaaS" value={form.industry} onChange={(e) => setForm(p => ({ ...p, industry: e.target.value }))} /></div>
              <div><Label>Brand Color</Label><div className="flex gap-2"><Input type="color" value={form.brandColor} onChange={(e) => setForm(p => ({ ...p, brandColor: e.target.value }))} className="w-16 h-10" /><Input value={form.brandColor} onChange={(e) => setForm(p => ({ ...p, brandColor: e.target.value }))} /></div></div>
            </div>
            <DialogFooter>
              <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.clientName}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Add Client
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Users className="h-8 w-8 text-violet-500" /><div><p className="text-sm text-muted-foreground">Total Clients</p><p className="text-2xl font-bold">{clients.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><BarChart3 className="h-8 w-8 text-blue-500" /><div><p className="text-sm text-muted-foreground">Total Leads</p><p className="text-2xl font-bold">{clients.reduce((s, c) => s + c.totalLeads, 0)}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Palette className="h-8 w-8 text-pink-500" /><div><p className="text-sm text-muted-foreground">Active Clients</p><p className="text-2xl font-bold">{clients.filter(c => c.isActive).length}</p></div></div></CardContent></Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : clients.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-lg font-medium">No agency clients yet</p><p className="text-muted-foreground">Add your first client to start managing their lead generation</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Card key={client.id} className="relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: client.brandColor || "#7c3aed" }} />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{client.clientName}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Switch checked={client.isActive} onCheckedChange={(v) => toggleMutation.mutate({ id: client.id, isActive: v })} />
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: client.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
                <CardDescription>{client.clientEmail || client.clientDomain || "No contact info"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {client.industry && <Badge variant="outline">{client.industry}</Badge>}
                  <Badge variant="secondary">{client.totalLeads} leads</Badge>
                  <Badge variant="secondary">{client.totalCampaigns} campaigns</Badge>
                  <Badge variant={client.isActive ? "default" : "secondary"}>{client.isActive ? "Active" : "Inactive"}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
