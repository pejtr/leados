import { describe, it, expect, beforeAll } from "vitest";
import { transcribeAudio } from "./_core/voiceTranscription";

describe("transcribeAudio - config validation", () => {
  beforeAll(() => {
    process.env.BUILT_IN_FORGE_API_URL = "";
    process.env.BUILT_IN_FORGE_API_KEY = "";
  });

  it("returns SERVICE_ERROR when forgeApiUrl is not configured", async () => {
    const result = await transcribeAudio({
      audioUrl: "https://example.com/audio.mp3",
    });
    expect(result).toHaveProperty("error");
    expect(result).toHaveProperty("code", "SERVICE_ERROR");
  });
});
