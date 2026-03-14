import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar, Link2, Plus, Trash2, Copy, CheckCircle2, Clock,
  Users, Zap, Play, Pause, CheckCheck, XCircle, RefreshCw,
  Mail, ExternalLink, Bot, Target
} from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const statusColors: Record<string, string> = {
  active: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  paused: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  completed: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  meeting_booked: "text-violet-400 bg-violet-400/10 border-violet-400/30",
};

const statusIcons: Record<string, React.ReactNode> = {
  active: <Play className="w-3 h-3" />,
  paused: <Pause className="w-3 h-3" />,
  completed: <CheckCheck className="w-3 h-3" />,
  meeting_booked: <CheckCircle2 className="w-3 h-3" />,
};

export default function MeetingScheduler() {
  const [showCreateLink, setShowCreateLink] = useState(false);
  const [showStartSession, setShowStartSession] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [generatingEmail, setGeneratingEmail] = useState<number | null>(null);
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null);

  // Meeting link form
  const [linkTitle, setLinkTitle] = useState("30-Minute Discovery Call");
  const [linkDuration, setLinkDuration] = useState("30");
  const [linkDescription, setLinkDescription] = useState("");
  const [linkTimezone, setLinkTimezone] = useState("UTC");
  const [availability, setAvailability] = useState<{ day: number; startHour: number; endHour: number }[]>([
    { day: 1, startHour: 9, endHour: 17 },
    { day: 2, startHour: 9, endHour: 17 },
    { day: 3, startHour: 9, endHour: 17 },
    { day: 4, startHour: 9, endHour: 17 },
    { day: 5, startHour: 9, endHour: 17 },
  ]);

  // Session form
  const [sessionLeadId, setSessionLeadId] = useState("");
  const [sessionMaxFollowUps, setSessionMaxFollowUps] = useState("5");
  const [sessionMeetingLinkId, setSessionMeetingLinkId] = useState<string>("");

  const { data: meetingLinks = [], refetch: refetchLinks } = trpc.followUp.listMeetingLinks.useQuery();
  const { data: sessions = [], refetch: refetchSessions } = trpc.followUp.listSessions.useQuery();
  const { data: leadsResult } = trpc.leads.list.useQuery({ limit: 100, offset: 0, status: "all" });

  const createLink = trpc.followUp.createMeetingLink.useMutation({
    onSuccess: () => {
      toast.success("Meeting link created!", { description: "Share it with your leads to book time with you." });
      setShowCreateLink(false);
      refetchLinks();
    },
    onError: (e) => toast.error("Error", { description: e.message }),
  });

  const deleteLink = trpc.followUp.deleteMeetingLink.useMutation({
    onSuccess: () => { toast.success("Link deleted"); refetchLinks(); },
  });

  const startSession = trpc.followUp.startSession.useMutation({
    onSuccess: () => {
      toast.success("Follow-up session started!", { description: "AI will generate personalized follow-ups automatically." });
      setShowStartSession(false);
      refetchSessions();
    },
    onError: (e) => toast.error("Error", { description: e.message }),
  });

  const updateStatus = trpc.followUp.updateSessionStatus.useMutation({
    onSuccess: () => refetchSessions(),
  });

  const generateEmail = trpc.followUp.generateFollowUpEmail.useMutation({
    onSuccess: (data) => {
      setGeneratedEmail(data);
      setGeneratingEmail(null);
    },
    onError: (e) => {
      toast.error("Error generating email", { description: e.message });
      setGeneratingEmail(null);
    },
  });

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/book/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
    toast.success("Link copied!", { description: url });
  };

  const toggleDay = (day: number) => {
    const exists = availability.find(a => a.day === day);
    if (exists) {
      setAvailability(availability.filter(a => a.day !== day));
    } else {
      setAvailability([...availability, { day, startHour: 9, endHour: 17 }].sort((a, b) => a.day - b.day));
    }
  };

  const leadsData = (leadsResult as any)?.items ?? [];

  return (
    <div className="min-h-screen bg-[#050510] text-white p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            Meeting Scheduler
          </h1>
          <p className="text-white/50 mt-1">AI-powered follow-up bot + automatic meeting booking</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={showStartSession} onOpenChange={setShowStartSession}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30">
                <Bot className="w-4 h-4 mr-2" /> Start Follow-up Bot
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0d0d1a] border border-white/10 text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">Start AI Follow-up Session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Select Lead</label>
                  <Select value={sessionLeadId} onValueChange={setSessionLeadId}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Choose a lead..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d0d1a] border-white/10 text-white">
                      {leadsData.map((lead: any) => (
                        <SelectItem key={lead.id} value={String(lead.id)}>
                          {lead.companyName} — {lead.contactName ?? "Unknown"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Max Follow-ups</label>
                  <Select value={sessionMaxFollowUps} onValueChange={setSessionMaxFollowUps}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d0d1a] border-white/10 text-white">
                      {[3, 5, 7, 10].map(n => (
                        <SelectItem key={n} value={String(n)}>{n} follow-ups</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(meetingLinks as any[]).length > 0 && (
                  <div>
                    <label className="text-sm text-white/60 mb-1 block">Include Meeting Link (optional)</label>
                    <Select value={sessionMeetingLinkId} onValueChange={setSessionMeetingLinkId}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="No meeting link" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d0d1a] border-white/10 text-white">
                        <SelectItem value="">No meeting link</SelectItem>
                        {(meetingLinks as any[]).map((link: any) => (
                          <SelectItem key={link.id} value={String(link.id)}>
                            {link.title} ({link.duration}min)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button
                  className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 text-white"
                  disabled={!sessionLeadId || startSession.isPending}
                  onClick={() => startSession.mutate({
                    leadId: parseInt(sessionLeadId),
                    maxFollowUps: parseInt(sessionMaxFollowUps),
                    meetingLinkId: sessionMeetingLinkId ? parseInt(sessionMeetingLinkId) : undefined,
                  })}
                >
                  {startSession.isPending ? "Starting..." : "Start AI Follow-up Bot"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateLink} onOpenChange={setShowCreateLink}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-violet-600 to-cyan-600 text-white">
                <Plus className="w-4 h-4 mr-2" /> Create Booking Link
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0d0d1a] border border-white/10 text-white max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-white">Create Meeting Booking Link</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Title</label>
                  <Input
                    value={linkTitle}
                    onChange={e => setLinkTitle(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="30-Minute Discovery Call"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-white/60 mb-1 block">Duration</label>
                    <Select value={linkDuration} onValueChange={setLinkDuration}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d0d1a] border-white/10 text-white">
                        {[15, 30, 45, 60, 90].map(d => (
                          <SelectItem key={d} value={String(d)}>{d} minutes</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-white/60 mb-1 block">Timezone</label>
                    <Select value={linkTimezone} onValueChange={setLinkTimezone}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d0d1a] border-white/10 text-white">
                        {["UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Prague", "Asia/Tokyo"].map(tz => (
                          <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Description (optional)</label>
                  <Textarea
                    value={linkDescription}
                    onChange={e => setLinkDescription(e.target.value)}
                    className="bg-white/5 border-white/10 text-white resize-none"
                    rows={2}
                    placeholder="Brief description of what we'll discuss..."
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Available Days</label>
                  <div className="flex gap-2 flex-wrap">
                    {DAYS.map((day, i) => {
                      const active = availability.some(a => a.day === i);
                      return (
                        <button
                          key={i}
                          onClick={() => toggleDay(i)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                            active
                              ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                              : "bg-white/5 border-white/10 text-white/40"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 text-white"
                  disabled={!linkTitle || createLink.isPending}
                  onClick={() => createLink.mutate({
                    title: linkTitle,
                    duration: parseInt(linkDuration),
                    description: linkDescription || undefined,
                    timezone: linkTimezone,
                    availability: availability.length > 0 ? availability : undefined,
                  })}
                >
                  {createLink.isPending ? "Creating..." : "Create Booking Link"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Active Sessions", value: (sessions as any[]).filter(s => s.status === "active").length, icon: <Bot className="w-5 h-5" />, color: "from-emerald-500 to-teal-500" },
          { label: "Meetings Booked", value: (sessions as any[]).filter(s => s.status === "meeting_booked").length, icon: <CheckCircle2 className="w-5 h-5" />, color: "from-violet-500 to-purple-500" },
          { label: "Booking Links", value: (meetingLinks as any[]).length, icon: <Link2 className="w-5 h-5" />, color: "from-cyan-500 to-blue-500" },
          { label: "Follow-ups Sent", value: (sessions as any[]).reduce((sum: number, s: any) => sum + (s.followUpCount ?? 0), 0), icon: <Mail className="w-5 h-5" />, color: "from-orange-500 to-red-500" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 backdrop-blur-sm"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mb-3`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-sm text-white/50">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Follow-up Sessions */}
        <div className="col-span-3 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-400" />
            Active Follow-up Sessions
          </h2>

          {(sessions as any[]).length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/[0.03] border border-dashed border-white/10 rounded-2xl p-12 text-center"
            >
              <Bot className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40 text-sm">No follow-up sessions yet</p>
              <p className="text-white/25 text-xs mt-1">Start a session to let the AI automatically follow up with leads</p>
              <Button
                className="mt-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
                onClick={() => setShowStartSession(true)}
              >
                <Bot className="w-4 h-4 mr-2" /> Start First Session
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {(sessions as any[]).map((session: any, i: number) => {
                const lead = leadsData.find((l: any) => l.id === session.leadId);
                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
                          <Target className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                          <div className="font-medium text-white text-sm">
                            {lead?.companyName ?? `Lead #${session.leadId}`}
                          </div>
                          <div className="text-xs text-white/40">
                            {lead?.contactName ?? "Unknown contact"} · {lead?.industry ?? ""}
                          </div>
                        </div>
                      </div>
                      <Badge className={`text-xs border ${statusColors[session.status] ?? "text-white/60 bg-white/5 border-white/10"} flex items-center gap-1`}>
                        {statusIcons[session.status]}
                        {session.status.replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-white/40">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {session.followUpCount}/{session.maxFollowUps} sent
                      </span>
                      {session.nextFollowUpAt && session.status === "active" && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Next: {new Date(session.nextFollowUpAt).toLocaleDateString()}
                        </span>
                      )}
                      {session.meetingBooked && (
                        <span className="flex items-center gap-1 text-violet-400">
                          <CheckCircle2 className="w-3 h-3" />
                          Meeting booked
                          {session.meetingAt && ` · ${new Date(session.meetingAt).toLocaleDateString()}`}
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (session.followUpCount / session.maxFollowUps) * 100)}%` }}
                      />
                    </div>

                    <div className="mt-3 flex gap-2">
                      {session.status === "active" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs bg-white/5 border-white/10 text-white/60 hover:text-white"
                            disabled={generatingEmail === session.id}
                            onClick={() => {
                              setGeneratingEmail(session.id);
                              setGeneratedEmail(null);
                              generateEmail.mutate({
                                leadId: session.leadId,
                                sessionId: session.id,
                                followUpNumber: (session.followUpCount ?? 0) + 1,
                              });
                            }}
                          >
                            {generatingEmail === session.id ? (
                              <><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Generating...</>
                            ) : (
                              <><Zap className="w-3 h-3 mr-1" /> Generate Email</>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20"
                            onClick={() => updateStatus.mutate({ id: session.id, status: "paused" })}
                          >
                            <Pause className="w-3 h-3 mr-1" /> Pause
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs bg-violet-500/10 border-violet-500/30 text-violet-400 hover:bg-violet-500/20"
                            onClick={() => updateStatus.mutate({ id: session.id, status: "meeting_booked" })}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Booked
                          </Button>
                        </>
                      )}
                      {session.status === "paused" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                          onClick={() => updateStatus.mutate({ id: session.id, status: "active" })}
                        >
                          <Play className="w-3 h-3 mr-1" /> Resume
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Generated Email Preview */}
          <AnimatePresence>
            {generatedEmail && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/30 rounded-2xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-violet-300 flex items-center gap-2">
                    <Zap className="w-4 h-4" /> AI-Generated Follow-up Email
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs bg-white/5 border-white/10 text-white/60"
                      onClick={() => {
                        navigator.clipboard.writeText(`Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`);
                        toast.success("Email copied to clipboard!");
                      }}
                    >
                      <Copy className="w-3 h-3 mr-1" /> Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs bg-white/5 border-white/10 text-white/40"
                      onClick={() => setGeneratedEmail(null)}
                    >
                      <XCircle className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-white/60 mb-1">Subject:</div>
                <div className="text-sm font-medium text-white mb-3">{generatedEmail.subject}</div>
                <div className="text-xs text-white/60 mb-1">Body:</div>
                <div className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{generatedEmail.body}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Meeting Links */}
        <div className="col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Booking Links
          </h2>

          {(meetingLinks as any[]).length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/[0.03] border border-dashed border-white/10 rounded-2xl p-8 text-center"
            >
              <Calendar className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">No booking links yet</p>
              <Button
                className="mt-3 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 text-xs h-8"
                onClick={() => setShowCreateLink(true)}
              >
                <Plus className="w-3 h-3 mr-1" /> Create Link
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {(meetingLinks as any[]).map((link: any, i: number) => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-white text-sm">{link.title}</div>
                      <div className="text-xs text-white/40 mt-0.5 flex items-center gap-2">
                        <Clock className="w-3 h-3" /> {link.duration} min
                        <span>·</span>
                        <span>{link.timezone}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-white/30 hover:text-red-400"
                      onClick={() => deleteLink.mutate({ id: link.id })}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {link.description && (
                    <p className="text-xs text-white/40 mt-2">{link.description}</p>
                  )}

                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-7 text-xs bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                      onClick={() => copyLink(link.slug)}
                    >
                      {copiedSlug === link.slug ? (
                        <><CheckCircle2 className="w-3 h-3 mr-1" /> Copied!</>
                      ) : (
                        <><Copy className="w-3 h-3 mr-1" /> Copy Link</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs bg-white/5 border-white/10 text-white/40 hover:text-white"
                      onClick={() => window.open(`${window.location.origin}/book/${link.slug}`, "_blank")}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>

                  <div className="mt-2 text-xs text-white/25 truncate">
                    {window.location.origin}/book/{link.slug}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Tips */}
          <div className="bg-gradient-to-br from-violet-500/5 to-cyan-500/5 border border-white/[0.06] rounded-2xl p-4">
            <h3 className="text-xs font-semibold text-white/60 mb-3 uppercase tracking-wider">AI Follow-up Tips</h3>
            <div className="space-y-2 text-xs text-white/40">
              <div className="flex items-start gap-2">
                <Zap className="w-3 h-3 text-violet-400 mt-0.5 shrink-0" />
                <span>AI generates personalized follow-ups based on lead's industry and company</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-3 h-3 text-cyan-400 mt-0.5 shrink-0" />
                <span>Follow-ups are spaced: 1 day, 3 days, 5 days, 7 days, 10 days</span>
              </div>
              <div className="flex items-start gap-2">
                <Users className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                <span>Include a booking link to increase meeting conversion by 40%</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 text-orange-400 mt-0.5 shrink-0" />
                <span>Mark sessions as "Meeting Booked" to stop follow-ups automatically</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
