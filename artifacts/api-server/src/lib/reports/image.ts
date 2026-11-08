/** Décodage minimal des data-URL image (JPEG / PNG) et lecture de leurs dimensions. */

export interface DecodedImage {
  buf: Buffer;
  ext: "png" | "jpeg";
  width: number;
  height: number;
}

export function decodeDataUrl(dataUrl: string | null | undefined): DecodedImage | null {
  const m = /^data:image\/(png|jpe?g);base64,([A-Za-z0-9+/=\s]+)$/i.exec(dataUrl ?? "");
  if (!m) return null;
  const buf = Buffer.from(m[2], "base64");
  const ext = m[1].toLowerCase() === "png" ? "png" : "jpeg";
  const size = ext === "png" ? pngSize(buf) : jpegSize(buf);
  if (!size) return null;
  return { buf, ext, ...size };
}

function pngSize(b: Buffer): { width: number; height: number } | null {
  if (b.length < 24 || b.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

function jpegSize(b: Buffer): { width: number; height: number } | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const marker = b[i + 1];
    if (marker === 0xff) { i++; continue; }
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}

/** Dimensions d'une image réduite pour tenir dans une boîte, sans déformation. */
export function fit(w: number, h: number, boxW: number, boxH: number): { width: number; height: number } {
  const k = Math.min(boxW / w, boxH / h);
  return { width: w * k, height: h * k };
}
