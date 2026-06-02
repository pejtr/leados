import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Code, Plus, Trash2, Eye, Copy, Globe, Activity, Building2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";


export default function TrackingPixel() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", domain: "" });
  const [selectedPixel, setSelectedPixel] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: pixels = [], isLoading } = trpc.trackingPixel.list.useQuery();
  const { data: visitors = [] } = trpc.trackingPixel.allVisitors.useQuery();
  const createMutation = trpc.trackingPixel.create.useMutation({
    onSuccess: () => { utils.trackingPixel.list.invalidate(); setOpen(false); setForm({ name: "", domain: "" }); toast.success("Tracking pixel created"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.trackingPixel.delete.useMutation({
    onSuccess: () => { utils.trackingPixel.list.invalidate(); toast.success("Pixel deleted"); },
  });
  const toggleMutation = trpc.trackingPixel.toggle.useMutation({
    onSuccess: () => { utils.trackingPixel.list.invalidate(); },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Code className="h-6 w-6 text-purple-500" /> Website Tracking Pixel</h1>
          <p className="text-muted-foreground mt-1">Identify companies visiting your website with AI-powered ISP filtering</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Add Pixel</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Tracking Pixel</DialogTitle>
              <DialogDescription>Add a tracking pixel to identify website visitors</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Pixel Name</Label><Input placeholder="My Website" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Domain</Label><Input placeholder="example.com" value={form.domain} onChange={(e) => setForm(p => ({ ...p, domain: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.name || !form.domain}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Globe className="h-8 w-8 text-blue-500" /><div><p className="text-sm text-muted-foreground">Active Pixels</p><p className="text-2xl font-bold">{pixels.filter(p => p.isActive).length}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Eye className="h-8 w-8 text-green-500" /><div><p className="text-sm text-muted-foreground">Total Visitors</p><p className="text-2xl font-bold">{pixels.reduce((s, p) => s + p.totalVisitors, 0)}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Building2 className="h-8 w-8 text-purple-500" /><div><p className="text-sm text-muted-foreground">Identified Companies</p><p className="text-2xl font-bold">{pixels.reduce((s, p) => s + p.identifiedCompanies, 0)}</p></div></div></CardContent></Card>
      </div>

      {/* Pixels List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : pixels.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Code className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-lg font-medium">No tracking pixels yet</p><p className="text-muted-foreground">Create your first pixel to start identifying website visitors</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {pixels.map((pixel) => (
            <Card key={pixel.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{pixel.name}</CardTitle>
                    <Badge variant={pixel.isActive ? "default" : "secondary"}>{pixel.isActive ? "Active" : "Inactive"}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={pixel.isActive} onCheckedChange={(v) => toggleMutation.mutate({ id: pixel.id, isActive: v })} />
                    <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(pixel.pixelCode); toast.success("Pixel code copied!"); }}><Copy className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: pixel.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
                <CardDescription>{pixel.domain} &middot; {pixel.totalVisitors} visitors &middot; {pixel.identifiedCompanies} companies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-3 font-mono text-xs overflow-x-auto">{pixel.pixelCode}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Visitor Sessions */}
      {visitors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Recent Visitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left py-2 px-3">Company</th><th className="text-left py-2 px-3">Industry</th><th className="text-left py-2 px-3">Location</th><th className="text-left py-2 px-3">Pages</th><th className="text-left py-2 px-3">Intent</th><th className="text-left py-2 px-3">ISP</th></tr></thead>
                <tbody>
                  {visitors.slice(0, 20).map((v) => (
                    <tr key={v.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3 font-medium">{v.companyName || "Unknown"}</td>
                      <td className="py-2 px-3">{v.industry || "—"}</td>
                      <td className="py-2 px-3">{v.location || "—"}</td>
                      <td className="py-2 px-3">{v.pageViews}</td>
                      <td className="py-2 px-3"><Badge variant={v.intentScore > 70 ? "default" : v.intentScore > 40 ? "secondary" : "outline"}>{v.intentScore}%</Badge></td>
                      <td className="py-2 px-3">{v.isIsp ? <Badge variant="destructive">ISP</Badge> : <Badge variant="outline">Company</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </DashboardLayout>
  );
}
