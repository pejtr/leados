import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { UserPlus, Users, Crown, User, Trash2, Mail, Shield } from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  agent: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  viewer: "bg-white/5 text-white/50 border-white/10",
};

const ROLE_ICONS: Record<string, React.ElementType> = {
  admin: Crown,
  agent: User,
  viewer: Shield,
};

export default function Team() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: members = [], isLoading } = trpc.team.list.useQuery();
  const inviteMutation = trpc.team.invite.useMutation({
    onSuccess: () => { utils.team.list.invalidate(); toast.success("Team member invited"); setShowInvite(false); setEmail(""); setRole("agent"); },
    onError: (e) => toast.error(e.message),
  });
  const removeMutation = trpc.team.remove.useMutation({
    onSuccess: () => { utils.team.list.invalidate(); toast.success("Member removed"); setRemoveId(null); },
    onError: (e) => toast.error(e.message),
  });
  const updateRoleMutation = trpc.team.updateRole.useMutation({
    onSuccess: () => { utils.team.list.invalidate(); toast.success("Role updated"); },
    onError: (e) => toast.error(e.message),
  });

  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "agent" | "viewer">("agent");
  const [removeId, setRemoveId] = useState<number | null>(null);

  const handleInvite = () => {
    if (!email.trim()) { toast.error("Email is required"); return; }
    inviteMutation.mutate({ email, role });
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Team Management</h1>
            <p className="text-sm text-white/50 mt-1">Invite team members, assign roles, and manage access to your lead generation platform.</p>
          </div>
          <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => setShowInvite(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </div>

        {/* Role Guide */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { role: "admin", label: "Admin", desc: "Full access to all features, team management, and settings." },
            { role: "agent", label: "Agent", desc: "Can generate leads, manage pipeline, and use templates." },
            { role: "viewer", label: "Viewer", desc: "Read-only access to leads and statistics." },
          ].map((r) => {
            const Icon = ROLE_ICONS[r.role]!;
            return (
              <Card key={r.role} className="bg-white/[0.03] border-white/[0.06]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-white/60" />
                    <Badge className={`text-xs ${ROLE_COLORS[r.role]}`}>{r.label}</Badge>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">{r.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Members List */}
        {isLoading ? (
          <div className="text-center py-16 text-white/40">Loading team members...</div>
        ) : members.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40 text-lg font-medium">No team members yet</p>
            <p className="text-white/30 text-sm mt-1">Invite your first team member to collaborate on lead generation.</p>
            <Button className="mt-4 bg-violet-600 hover:bg-violet-700" onClick={() => setShowInvite(true)}>
              <UserPlus className="w-4 h-4 mr-2" /> Invite Member
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((m) => {
              const Icon = ROLE_ICONS[m.role] ?? User;
              return (
                <Card key={m.id} className="bg-white/[0.03] border-white/[0.06] hover:border-white/10 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/30 to-blue-500/30 flex items-center justify-center text-sm font-bold text-white">
                          {(m.name ?? m.email ?? "?")[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-white text-sm">{m.name ?? "Pending"}</div>
                          <div className="text-xs text-white/40 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {m.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Select
                          value={m.role}
                          onValueChange={(v) => updateRoleMutation.mutate({ id: m.id, role: v as "admin" | "agent" | "viewer" })}
                        >
                          <SelectTrigger className="w-28 h-8 bg-white/5 border-white/10 text-white text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#13131a] border-white/10">
                            <SelectItem value="admin" className="text-white text-xs">Admin</SelectItem>
                            <SelectItem value="agent" className="text-white text-xs">Agent</SelectItem>
                            <SelectItem value="viewer" className="text-white text-xs">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-white/40 hover:text-red-400 h-8 w-8 p-0"
                          onClick={() => setRemoveId(m.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Invite Dialog */}
        <Dialog open={showInvite} onOpenChange={setShowInvite}>
          <DialogContent className="bg-[#13131a] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Invite Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-white/70 text-sm mb-1.5 block">Email Address</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                />
              </div>
              <div>
                <Label className="text-white/70 text-sm mb-1.5 block">Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#13131a] border-white/10">
                    <SelectItem value="admin" className="text-white">Admin — Full access</SelectItem>
                    <SelectItem value="agent" className="text-white">Agent — Generate & manage leads</SelectItem>
                    <SelectItem value="viewer" className="text-white">Viewer — Read-only access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" className="text-white/60" onClick={() => setShowInvite(false)}>Cancel</Button>
              <Button
                className="bg-violet-600 hover:bg-violet-700"
                onClick={handleInvite}
                disabled={inviteMutation.isPending}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Send Invite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Confirm */}
        <AlertDialog open={!!removeId} onOpenChange={(o) => { if (!o) setRemoveId(null); }}>
          <AlertDialogContent className="bg-[#13131a] border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Remove Team Member?</AlertDialogTitle>
              <AlertDialogDescription className="text-white/50">
                This member will lose access to the platform immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => { if (removeId) removeMutation.mutate({ id: removeId }); }}
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
