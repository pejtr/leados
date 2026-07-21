import { describe, it, expect } from "vitest";
import { extractText, type TextContent, type ImageContent, type FileContent } from "./llm";

describe("LLM extractText", () => {
  it("returns string content directly", () => {
    expect(extractText("Hello world")).toBe("Hello world");
  });

  it("returns empty string for empty string", () => {
    expect(extractText("")).toBe("");
  });

  it("extracts text from a single TextContent part", () => {
    const content: TextContent[] = [{ type: "text", text: "Hello" }];
    expect(extractText(content)).toBe("Hello");
  });

  it("joins multiple TextContent parts", () => {
    const content: TextContent[] = [
      { type: "text", text: "Hello " },
      { type: "text", text: "world" },
    ];
    expect(extractText(content)).toBe("Hello world");
  });

  it("filters out ImageContent parts", () => {
    const content: (TextContent | ImageContent)[] = [
      { type: "text", text: "Hello" },
      { type: "image_url", image_url: { url: "https://example.com/img.png" } },
      { type: "text", text: "world" },
    ];
    expect(extractText(content)).toBe("Helloworld");
  });

  it("filters out FileContent parts", () => {
    const content: (TextContent | FileContent)[] = [
      { type: "text", text: "Report" },
      { type: "file_url", file_url: { url: "https://example.com/file.pdf", mime_type: "application/pdf" } },
    ];
    expect(extractText(content)).toBe("Report");
  });

  it("handles empty array", () => {
    expect(extractText([])).toBe("");
  });

  it("handles mixed content types with only text", () => {
    const content: (TextContent | ImageContent | FileContent)[] = [
      { type: "image_url", image_url: { url: "data:image/png;base64,abc" } },
      { type: "text", text: "visible" },
      { type: "file_url", file_url: { url: "file.pdf", mime_type: "application/pdf" } },
    ];
    expect(extractText(content)).toBe("visible");
  });

  it("handles content with multiple text parts separated by images", () => {
    const content: (TextContent | ImageContent)[] = [
      { type: "text", text: "Part1" },
      { type: "image_url", image_url: { url: "img.png" } },
      { type: "text", text: "Part2" },
      { type: "image_url", image_url: { url: "img2.png" } },
      { type: "text", text: "Part3" },
    ];
    expect(extractText(content)).toBe("Part1Part2Part3");
  });
});
