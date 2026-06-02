import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ListFilter, Plus, Trash2, Loader2, RefreshCw, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";


export default function SmartLists() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", filters: "", autoRefresh: false, refreshInterval: "daily" as const });

  const utils = trpc.useUtils();
  const { data: lists = [], isLoading } = trpc.smartLists.list.useQuery();
  const createMutation = trpc.smartLists.create.useMutation({
    onSuccess: () => { utils.smartLists.list.invalidate(); setOpen(false); setForm({ name: "", description: "", filters: "", autoRefresh: false, refreshInterval: "daily" }); toast.success("Smart list created"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.smartLists.delete.useMutation({
    onSuccess: () => { utils.smartLists.list.invalidate(); toast.success("List deleted"); },
  });
  const toggleMutation = trpc.smartLists.update.useMutation({
    onSuccess: () => { utils.smartLists.list.invalidate(); },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ListFilter className="h-6 w-6 text-indigo-500" /> Smart Lists</h1>
          <p className="text-muted-foreground mt-1">Create dynamic lead lists with behavioral filters and auto-refresh</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New List</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Smart List</DialogTitle>
              <DialogDescription>Define filters to automatically segment your leads</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>List Name</Label><Input placeholder="Hot Leads - SaaS" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Description</Label><Input placeholder="High-intent SaaS leads from Prague" value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div><Label>Filters (JSON)</Label><Textarea placeholder='{"industry":"SaaS","location":"Prague","intentScore":{"$gt":70}}' value={form.filters} onChange={(e) => setForm(p => ({ ...p, filters: e.target.value }))} rows={3} /></div>
              <div className="flex items-center gap-3">
                <Switch checked={form.autoRefresh} onCheckedChange={(v) => setForm(p => ({ ...p, autoRefresh: v }))} />
                <Label>Auto-refresh</Label>
              </div>
              {form.autoRefresh && (
                <div>
                  <Label>Refresh Interval</Label>
                  <Select value={form.refreshInterval} onValueChange={(v: any) => setForm(p => ({ ...p, refreshInterval: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.name || !form.filters}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Create List
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : lists.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><ListFilter className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-lg font-medium">No smart lists yet</p><p className="text-muted-foreground">Create dynamic lists to auto-segment your leads</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lists.map((list) => (
            <Card key={list.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{list.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    {list.autoRefresh && <Badge variant="outline" className="gap-1"><RefreshCw className="h-3 w-3" /> {list.refreshInterval}</Badge>}
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: list.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
                {list.description && <CardDescription>{list.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{list.leadCount} leads</span></div>
                  <Badge variant="secondary">Filters: {(() => { try { return Object.keys(JSON.parse(list.filters)).length; } catch { return "?"; } })()}</Badge>
                </div>
                <div className="mt-2 bg-muted rounded p-2 font-mono text-xs overflow-x-auto">{list.filters}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
