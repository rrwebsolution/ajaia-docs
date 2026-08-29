import { describe, expect, it } from "vitest";
import {
  fileNameToTitle,
  isValidEmail,
  MAX_IMPORT_FILE_SIZE,
  validateImportFile,
} from "@/lib/validators";

function makeFile(name: string, sizeBytes: number, type = "text/plain"): File {
  const content = new Uint8Array(sizeBytes);
  return new File([content], name, { type });
}

describe("isValidEmail", () => {
  it("accepts well-formed emails", () => {
    expect(isValidEmail("owner@ajaia-demo.com")).toBe(true);
  });

  it("rejects malformed emails", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("missing-domain@")).toBe(false);
  });
});

describe("validateImportFile", () => {
  it("accepts a .txt file under the size limit", () => {
    expect(validateImportFile(makeFile("notes.txt", 1024)).valid).toBe(true);
  });

  it("accepts a .md file under the size limit", () => {
    expect(validateImportFile(makeFile("notes.md", 1024)).valid).toBe(true);
  });

  it("rejects unsupported file extensions", () => {
    const result = validateImportFile(makeFile("report.docx", 1024));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/only \.txt and \.md/i);
  });

  it("rejects files over the 2MB limit", () => {
    const result = validateImportFile(makeFile("big.txt", MAX_IMPORT_FILE_SIZE + 1));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/2 MB/i);
  });
});

describe("fileNameToTitle", () => {
  it("converts a kebab-case filename into a title", () => {
    expect(fileNameToTitle("meeting-notes.md")).toBe("Meeting Notes");
  });

  it("converts a snake_case filename into a title", () => {
    expect(fileNameToTitle("q3_roadmap.txt")).toBe("Q3 Roadmap");
  });
});
