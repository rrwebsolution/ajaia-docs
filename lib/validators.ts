export const MAX_IMPORT_FILE_SIZE = 2 * 1024 * 1024; // 2MB
export const SUPPORTED_IMPORT_EXTENSIONS = [".txt", ".md"] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function isValidDocumentTitle(title: string): boolean {
  return title.trim().length > 0 && title.trim().length <= 200;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImportFile(file: File): FileValidationResult {
  const name = file.name.toLowerCase();
  const hasSupportedExtension = SUPPORTED_IMPORT_EXTENSIONS.some((ext) =>
    name.endsWith(ext),
  );

  if (!hasSupportedExtension) {
    return { valid: false, error: "Only .txt and .md files are supported." };
  }

  if (file.size > MAX_IMPORT_FILE_SIZE) {
    return { valid: false, error: "Maximum file size is 2 MB." };
  }

  return { valid: true };
}

export function fileNameToTitle(fileName: string): string {
  const withoutExtension = fileName.replace(/\.(txt|md)$/i, "");
  const spaced = withoutExtension.replace(/[-_]+/g, " ").trim();
  return spaced
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0]!.toUpperCase() + word.slice(1))
    .join(" ") || "Untitled Document";
}
