import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck, Loader2, CheckCircle2, XCircle, AlertTriangle, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";


export default function EmailVerification() {
  const [singleEmail, setSingleEmail] = useState("");
  const [bulkEmails, setBulkEmails] = useState("");
  const [mode, setMode] = useState<"single" | "bulk">("single");

  const utils = trpc.useUtils();
  const { data: verifications = [], isLoading } = trpc.emailVerification.list.useQuery();
  const verifyMutation = trpc.emailVerification.verify.useMutation({
    onSuccess: (data) => { utils.emailVerification.list.invalidate(); toast.success(`Email ${data.status}: score ${data.score}`); setSingleEmail(""); },
    onError: (e) => toast.error(e.message),
  });
  const bulkMutation = trpc.emailVerification.bulkVerify.useMutation({
    onSuccess: (data) => { utils.emailVerification.list.invalidate(); toast.success(`Verified ${data.results.length} emails`); setBulkEmails(""); },
    onError: (e) => toast.error(e.message),
  });

  const stats = {
    valid: verifications.filter(v => v.status === "valid").length,
    invalid: verifications.filter(v => v.status === "invalid").length,
    risky: verifications.filter(v => v.status === "risky").length,
    total: verifications.length,
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "valid": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "invalid": return <XCircle className="h-4 w-4 text-red-500" />;
      case "risky": return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default: return <Mail className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-green-500" /> Email Verification</h1>
        <p className="text-muted-foreground mt-1">Real-time email verification powered by Bouncer API</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold">{stats.total}</p><p className="text-sm text-muted-foreground">Total Verified</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-green-500">{stats.valid}</p><p className="text-sm text-muted-foreground">Valid</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-red-500">{stats.invalid}</p><p className="text-sm text-muted-foreground">Invalid</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-amber-500">{stats.risky}</p><p className="text-sm text-muted-foreground">Risky</p></CardContent></Card>
      </div>

      {/* Verify Form */}
      <Card>
        <CardHeader>
          <div className="flex gap-2">
            <Button variant={mode === "single" ? "default" : "outline"} size="sm" onClick={() => setMode("single")}>Single</Button>
            <Button variant={mode === "bulk" ? "default" : "outline"} size="sm" onClick={() => setMode("bulk")}>Bulk</Button>
          </div>
        </CardHeader>
        <CardContent>
          {mode === "single" ? (
            <div className="flex gap-3">
              <Input placeholder="email@example.com" value={singleEmail} onChange={(e) => setSingleEmail(e.target.value)} className="flex-1" />
              <Button onClick={() => verifyMutation.mutate({ email: singleEmail })} disabled={verifyMutation.isPending || !singleEmail}>
                {verifyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Verify
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Textarea placeholder="Enter emails, one per line..." value={bulkEmails} onChange={(e) => setBulkEmails(e.target.value)} rows={5} />
              <Button onClick={() => bulkMutation.mutate({ emails: bulkEmails.split("\n").map(e => e.trim()).filter(Boolean) })} disabled={bulkMutation.isPending || !bulkEmails}>
                {bulkMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Verify All ({bulkEmails.split("\n").filter(e => e.trim()).length} emails)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : verifications.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Verification Results</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left py-2 px-3">Email</th><th className="text-left py-2 px-3">Status</th><th className="text-left py-2 px-3">Score</th><th className="text-left py-2 px-3">Reason</th><th className="text-left py-2 px-3">Date</th></tr></thead>
                <tbody>
                  {verifications.slice(0, 50).map((v) => (
                    <tr key={v.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3 font-mono text-xs">{v.email}</td>
                      <td className="py-2 px-3"><div className="flex items-center gap-1">{statusIcon(v.status)}<Badge variant={v.status === "valid" ? "default" : v.status === "invalid" ? "destructive" : "secondary"}>{v.status}</Badge></div></td>
                      <td className="py-2 px-3">{v.score ?? "—"}</td>
                      <td className="py-2 px-3 text-muted-foreground">{v.reason || "—"}</td>
                      <td className="py-2 px-3 text-muted-foreground">{v.createdAt ? new Date(v.createdAt).toLocaleDateString() : "—"}</td>
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
