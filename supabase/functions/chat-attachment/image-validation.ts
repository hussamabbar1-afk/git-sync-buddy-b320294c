const signatures = {
  "image/jpeg": (bytes: Uint8Array) =>
    bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  "image/png": (bytes: Uint8Array) =>
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a,
  "image/webp": (bytes: Uint8Array) =>
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP",
} as const;

export type AllowedImageType = keyof typeof signatures;

export function matchesImageSignature(bytes: Uint8Array, mimeType: string): boolean {
  const check = signatures[mimeType as AllowedImageType];
  return check ? check(bytes) : false;
}

export function safeImageName(value: string, extension: string): string {
  const printableValue = Array.from(value, (character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127 || character === "/" || character === "\\" ? "-" : character;
  }).join("");
  const stem = printableValue
    .replace(/\.[^.]+$/, "")
    .normalize("NFKC")
    .replace(/-+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
  return `${stem || "kundenfoto"}.${extension}`;
}
