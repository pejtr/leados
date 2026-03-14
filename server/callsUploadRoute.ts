import { Express, Request, Response } from "express";
import multer from "multer";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { callRecordings } from "../drizzle/schema";
import { storagePut } from "./storage";
import { transcribeAudio } from "./_core/voiceTranscription";
import { sdk } from "./_core/sdk";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 16 * 1024 * 1024 }, // 16MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/mp4", "audio/webm", "video/mp4"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file format. Use MP3, WAV, OGG, MP4, or WebM."));
    }
  },
});

export function registerCallsUploadRoute(app: Express) {
  app.post(
    "/api/calls/upload",
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        // Auth check
        const user = await sdk.authenticateRequest(req).catch(() => null);
        if (!user) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const file = req.file;
        if (!file) {
          return res.status(400).json({ error: "No file provided" });
        }

        const { leadId } = req.body;

        // Upload to S3
        const suffix = Math.random().toString(36).slice(2, 8);
        const ext = file.originalname.split(".").pop() || "mp3";
        const filename = `${Date.now()}-${suffix}.${ext}`;
        const fileKey = `calls/${user.id}/${filename}`;
        const { url: audioUrl } = await storagePut(fileKey, file.buffer, file.mimetype);

        // Insert initial record
        const db = await getDb();
        const [record] = await db.insert(callRecordings).values({
          userId: user.id,
          leadId: leadId ? parseInt(leadId) : null,
          filename,
          s3Url: audioUrl,
          s3Key: fileKey,
          callStatus: "transcribing",
        }).$returningId();

        // Transcribe asynchronously (fire and forget)
        transcribeAudio({ audioUrl, language: "en" })
          .then(async (result) => {
            const dbInner = await getDb();
            await dbInner.update(callRecordings)
              .set({
                transcription: result.text,
                duration: result.segments && result.segments.length > 0
                  ? Math.round(result.segments[result.segments.length - 1]?.end ?? 0)
                  : null,
                callStatus: "done",
              })
              .where(eq(callRecordings.id, record.id));
          })
          .catch(async (err) => {
            console.error("[CallUpload] Transcription failed:", err);
            const dbErr = await getDb();
            await dbErr.update(callRecordings)
              .set({ callStatus: "error" })
              .where(eq(callRecordings.id, record.id));
          });

        return res.json({ id: record.id, status: "transcribing" });
      } catch (err: any) {
        console.error("[CallUpload] Error:", err);
        return res.status(500).json({ error: err.message || "Upload failed" });
      }
    }
  );
}
