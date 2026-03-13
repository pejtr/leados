import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Cpu, Loader2, Search, Globe, Server, BarChart3 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function TechStack() {
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: detections = [], isLoading } = trpc.techStack.list.useQuery();
  const detectMutation = trpc.techStack.detect.useMutation({
    onSuccess: (data) => { utils.techStack.list.invalidate(); setResult(data); toast.success(data.cached ? "Loaded from cache" : "Tech stack detected"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Cpu className="h-6 w-6 text-cyan-500" /> Tech Stack Detection</h1>
        <p className="text-muted-foreground mt-1">Detect technologies used by any company website</p>
      </div>

      {/* Detect Form */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Input placeholder="example.com" value={domain} onChange={(e) => setDomain(e.target.value)} className="flex-1" />
            <Button onClick={() => detectMutation.mutate({ domain })} disabled={detectMutation.isPending || !domain}>
              {detectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />} Detect
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detection Result */}
      {result && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> {domain} {result.cached && <Badge variant="secondary">Cached</Badge>}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Technologies</p>
              <div className="flex flex-wrap gap-2">
                {result.technologies?.map((tech: string, i: number) => (
                  <Badge key={i} variant="outline">{tech}</Badge>
                ))}
              </div>
            </div>
            {result.categories && (
              <div>
                <p className="text-sm font-medium mb-2">Categories</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(result.categories).map(([key, value]) => value ? (
                    <div key={key} className="bg-muted rounded-lg p-3">
                      <p className="text-xs text-muted-foreground capitalize">{key}</p>
                      <p className="text-sm font-medium">{value as string}</p>
                    </div>
                  ) : null)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* History */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : detections.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Server className="h-5 w-5" /> Detection History</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left py-2 px-3">Domain</th><th className="text-left py-2 px-3">Technologies</th><th className="text-left py-2 px-3">Scanned</th></tr></thead>
                <tbody>
                  {detections.map((d) => (
                    <tr key={d.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3 font-medium">{d.domain}</td>
                      <td className="py-2 px-3"><div className="flex flex-wrap gap-1">{(() => { try { return JSON.parse(d.technologies).slice(0, 5).map((t: string, i: number) => <Badge key={i} variant="outline" className="text-xs">{t}</Badge>); } catch { return <span className="text-muted-foreground">—</span>; } })()}</div></td>
                      <td className="py-2 px-3 text-muted-foreground">{d.lastScannedAt ? new Date(d.lastScannedAt).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
