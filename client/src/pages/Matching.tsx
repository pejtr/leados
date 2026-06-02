import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Target, Plus, Trash2, Search, Building2, MapPin, Loader2, Sparkles, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Matching() {
  const [open, setOpen] = useState(false);
  const [matchResults, setMatchResults] = useState<any[] | null>(null);
  const [matchingProfileId, setMatchingProfileId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    industries: "",
    companySizeMin: 10,
    companySizeMax: 500,
    revenueMin: "",
    revenueMax: "",
    locations: "",
    keywords: "",
  });

  const utils = trpc.useUtils();
  const { data: profiles = [], isLoading } = trpc.matching.list.useQuery();

  const createMut = trpc.matching.create.useMutation({
    onSuccess: () => {
      toast.success("ICP profile created");
      utils.matching.list.invalidate();
      setOpen(false);
      setForm({ name: "", industries: "", companySizeMin: 10, companySizeMax: 500, revenueMin: "", revenueMax: "", locations: "", keywords: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = trpc.matching.delete.useMutation({
    onSuccess: () => {
      toast.success("Profile deleted");
      utils.matching.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMut = trpc.matching.update.useMutation({
    onSuccess: () => utils.matching.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const findMatchesMut = trpc.matching.findMatches.useMutation({
    onSuccess: (data) => {
      const results = Array.isArray(data) ? data : [];
      setMatchResults(results);
      if (results.length > 0) {
        toast.success(`Found ${results.length} matches!`);
      } else {
        toast.info("No matches found. Try adjusting your ICP.");
      }
    },
    onError: (e) => {
      toast.error(e.message);
      setMatchingProfileId(null);
    },
  });

  const handleFindMatches = (profileId: number) => {
    setMatchingProfileId(profileId);
    setMatchResults(null);
    findMatchesMut.mutate({ profileId });
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              B2B Matching
            </h1>
            <p className="text-muted-foreground mt-1">
              Define your Ideal Customer Profile (ICP) and find matching companies with AI.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> New ICP Profile</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create ICP Profile</DialogTitle>
                <DialogDescription>Define your ideal customer profile for AI-powered matching.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Profile Name</Label>
                  <Input placeholder="e.g. Enterprise SaaS" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label>Target Industries</Label>
                  <Input placeholder="e.g. Technology, SaaS, Fintech" value={form.industries} onChange={(e) => setForm({ ...form, industries: e.target.value })} />
                  <p className="text-xs text-muted-foreground mt-1">Comma-separated list</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Min Company Size</Label>
                    <Input type="number" min={1} value={form.companySizeMin} onChange={(e) => setForm({ ...form, companySizeMin: parseInt(e.target.value) || 10 })} />
                  </div>
                  <div>
                    <Label>Max Company Size</Label>
                    <Input type="number" min={1} value={form.companySizeMax} onChange={(e) => setForm({ ...form, companySizeMax: parseInt(e.target.value) || 500 })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Min Revenue</Label>
                    <Input placeholder="e.g. $1M" value={form.revenueMin} onChange={(e) => setForm({ ...form, revenueMin: e.target.value })} />
                  </div>
                  <div>
                    <Label>Max Revenue</Label>
                    <Input placeholder="e.g. $50M" value={form.revenueMax} onChange={(e) => setForm({ ...form, revenueMax: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Target Locations</Label>
                  <Input placeholder="e.g. United States, Europe" value={form.locations} onChange={(e) => setForm({ ...form, locations: e.target.value })} />
                </div>
                <div>
                  <Label>Keywords (optional)</Label>
                  <Input placeholder="e.g. AI, automation, cloud" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Zrušit</Button>
                <Button
                  disabled={!form.name || !form.industries || !form.locations || createMut.isPending}
                  onClick={() => createMut.mutate(form)}
                >
                  {createMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Create Profile
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : profiles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No ICP profiles yet</h3>
              <p className="text-muted-foreground mb-4">Define your ideal customer and let AI find matching companies.</p>
              <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Create ICP Profile</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {profiles.map((profile: any) => (
              <Card key={profile.id} className={!profile.isActive ? "opacity-60" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{profile.name}</CardTitle>
                      <Badge variant={profile.isActive ? "default" : "secondary"}>
                        {profile.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={findMatchesMut.isPending && matchingProfileId === profile.id}
                        onClick={() => handleFindMatches(profile.id)}
                      >
                        {findMatchesMut.isPending && matchingProfileId === profile.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-1" />
                        )}
                        Find Matches
                      </Button>
                      <Switch
                        checked={profile.isActive}
                        onCheckedChange={(v) => toggleMut.mutate({ id: profile.id, isActive: v })}
                      />
                      <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate({ id: profile.id })} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {profile.industries}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {profile.companySizeMin}–{profile.companySizeMax} employees
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {profile.locations}
                    </div>
                    {profile.keywords && (
                      <div className="flex items-center gap-1">
                        <Search className="h-3.5 w-3.5" />
                        {profile.keywords}
                      </div>
                    )}
                  </div>

                  {/* Match Results */}
                  {matchingProfileId === profile.id && matchResults && matchResults.length > 0 && (
                    <div className="mt-4 space-y-2 border-t pt-4">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">AI Match Results</p>
                      {matchResults.map((match: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <div>
                            <p className="font-medium text-sm">{match.companyName}</p>
                            <p className="text-xs text-muted-foreground">
                              {match.industry} &middot; {match.size} employees &middot; {match.location}
                            </p>
                            {match.matchReason && (
                              <p className="text-xs text-muted-foreground mt-1">{match.matchReason}</p>
                            )}
                          </div>
                          <Badge variant={match.matchScore >= 80 ? "default" : "secondary"}>
                            {match.matchScore}% match
                          </Badge>
                        </div>
                      ))}
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
