import { SUPPORTED_FILE_TYPES, MAX_FILE_SIZES } from "./constants";

// File type validation
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
  return allowedTypes.includes(fileExtension);
}

// File size validation
export function isValidFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}

// Get file category
export function getFileCategory(file: File): "document" | "spreadsheet" | "audio" | "video" | "unknown" {
  const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
  
  if (SUPPORTED_FILE_TYPES.DOCUMENTS.includes(extension as any)) return "document";
  if (SUPPORTED_FILE_TYPES.SPREADSHEETS.includes(extension as any)) return "spreadsheet";
  if (SUPPORTED_FILE_TYPES.AUDIO.includes(extension as any)) return "audio";
  if (SUPPORTED_FILE_TYPES.VIDEO.includes(extension as any)) return "video";
  
  return "unknown";
}

// Get max file size for category
export function getMaxFileSizeForCategory(category: string): number {
  switch (category) {
    case "document":
      return MAX_FILE_SIZES.DOCUMENT;
    case "spreadsheet":
      return MAX_FILE_SIZES.SPREADSHEET;
    case "audio":
      return MAX_FILE_SIZES.AUDIO;
    case "video":
      return MAX_FILE_SIZES.VIDEO;
    default:
      return MAX_FILE_SIZES.DOCUMENT; // Default to document size
  }
}

// Validate multiple files
export function validateFiles(
  files: File[]
): { valid: File[]; invalid: Array<{ file: File; reason: string }> } {
  const valid: File[] = [];
  const invalid: Array<{ file: File; reason: string }> = [];

  files.forEach((file) => {
    const category = getFileCategory(file);
    
    if (category === "unknown") {
      invalid.push({ file, reason: "Unsupported file type" });
      return;
    }

    const maxSize = getMaxFileSizeForCategory(category);
    
    if (!isValidFileSize(file, maxSize)) {
      invalid.push({ file, reason: `File size exceeds ${maxSize / (1024 * 1024)}MB limit` });
      return;
    }

    valid.push(file);
  });

  return { valid, invalid };
}

// Convert file to base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// Get MIME type from file extension
export function getMimeType(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    csv: "text/csv",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    m4a: "audio/mp4",
    mp4: "video/mp4",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
  };

  return mimeTypes[extension || ""] || "application/octet-stream";
}