import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Copy, CheckCircle2, Loader2, Sheet } from "lucide-react";

interface SheetsExportModalProps {
  open: boolean;
  onClose: () => void;
  /** If provided, only these lead IDs will be exported */
  leadIds?: number[];
  /** If provided, all leads from this session will be exported */
  sessionId?: number;
  /** Label shown in the dialog (e.g. "12 selected leads" or "Session #3") */
  label?: string;
}

export default function SheetsExportModal({
  open,
  onClose,
  leadIds,
  sessionId,
  label,
}: SheetsExportModalProps) {
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
  const [sheetName, setSheetName] = useState("Leads");
  const [copied, setCopied] = useState(false);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);

  const { data: serviceEmail } = trpc.sheets.serviceEmail.useQuery();

  const exportMutation = trpc.sheets.export.useMutation({
    onSuccess: (data) => {
      setExportedUrl(data.sheetUrl);
      toast.success(`${data.rowsWritten} leads exported to Google Sheets!`);
    },
    onError: (err) => {
      toast.error("Export failed: " + err.message);
    },
  });

  const handleCopyEmail = () => {
    if (serviceEmail) {
      navigator.clipboard.writeText(serviceEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExport = () => {
    if (!spreadsheetUrl.trim()) {
      toast.error("Please enter a Google Sheets URL or ID");
      return;
    }
    exportMutation.mutate({
      spreadsheetUrl: spreadsheetUrl.trim(),
      sheetName: sheetName.trim() || "Leads",
      leadIds,
      sessionId,
    });
  };

  const handleClose = () => {
    setSpreadsheetUrl("");
    setSheetName("Leads");
    setExportedUrl(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sheet className="h-5 w-5 text-green-500" />
            Export to Google Sheets
          </DialogTitle>
          <DialogDescription>
            {label
              ? `Export ${label} directly to a Google Spreadsheet.`
              : "Export your leads directly to a Google Spreadsheet."}
          </DialogDescription>
        </DialogHeader>

        {exportedUrl ? (
          /* Success state */
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="text-center font-medium">Leads exported successfully!</p>
            <Button asChild variant="outline" className="gap-2">
              <a href={exportedUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Open Google Sheet
              </a>
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Step 1: Share the sheet */}
            <div className="rounded-lg border border-dashed p-4 space-y-3">
              <p className="text-sm font-medium">
                Step 1 — Share your Google Sheet with this service account:
              </p>
              {serviceEmail ? (
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-muted px-3 py-2 text-xs font-mono break-all">
                    {serviceEmail}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={handleCopyEmail}
                    title="Copy email"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <Badge variant="destructive">Service account not configured</Badge>
              )}
              <p className="text-xs text-muted-foreground">
                Open your Google Sheet → Share → paste the email above → give{" "}
                <strong>Editor</strong> access.
              </p>
            </div>

            {/* Step 2: Paste URL */}
            <div className="space-y-2">
              <Label htmlFor="sheet-url">
                Step 2 — Paste your Google Sheets URL or Spreadsheet ID
              </Label>
              <Input
                id="sheet-url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={spreadsheetUrl}
                onChange={(e) => setSpreadsheetUrl(e.target.value)}
              />
            </div>

            {/* Sheet name */}
            <div className="space-y-2">
              <Label htmlFor="sheet-name">Sheet / Tab name (optional)</Label>
              <Input
                id="sheet-name"
                placeholder="Leads"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                If the tab doesn't exist it will be created automatically.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {exportedUrl ? "Close" : "Cancel"}
          </Button>
          {!exportedUrl && (
            <Button
              onClick={handleExport}
              disabled={exportMutation.isPending || !serviceEmail}
              className="gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              {exportMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting…
                </>
              ) : (
                <>
                  <Sheet className="h-4 w-4" />
                  Export to Sheets
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
