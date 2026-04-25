// Matches imperial parentheticals like (13'4''), (23'4"), (114 hp), (5269 lb)
// Handles both ASCII quotes and Unicode curly quotes (U+2018/2019/201C/201D)
const IMPERIAL_PAREN_RE = /\s*\([^)]*(?:lb[s]?|['‘’]+|ft|hp|mph|gpm|yd³?|psi|["“”])[^)]*\)/gi;

function roundTo1(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

function roundTo2(n: number): string {
  return (Math.round(n * 100) / 100).toString();
}

export function toMetric(raw: string): string {
  if (!raw) return raw;
  const v = raw.trim();

  // "X–ft Y–in" (en-dash or hyphen) → meters e.g. "80–ft 0–in"
  const ftIn = v.match(/^([\d.]+)[–\-]ft\s+([\d.]+)[–\-]in$/i);
  if (ftIn) {
    const m = (parseFloat(ftIn[1]) + parseFloat(ftIn[2]) / 12) * 0.3048;
    return `${roundTo1(m)} m`;
  }

  // "X–ft" only → meters
  const ftOnly = v.match(/^([\d.]+)[–\-]ft$/i);
  if (ftOnly) {
    const m = parseFloat(ftOnly[1]) * 0.3048;
    return `${roundTo1(m)} m`;
  }

  // "X–in" or "X-in" only → cm
  const inOnly = v.match(/^([\d.]+)[–\-]in$/i);
  if (inOnly) {
    const cm = Math.round(parseFloat(inOnly[1]) * 2.54);
    return `${cm} cm`;
  }

  // "X–lb" or "X,XXX–lb" → kg
  const lb = v.match(/^([\d,]+)[–\-]lb[s]?$/i);
  if (lb) {
    const kg = Math.round(parseFloat(lb[1].replace(/,/g, '')) * 0.453592);
    return `${kg} kg`;
  }

  // Strip imperial parentheticals: "(5269 lb)", "(114 hp)", "(4'6'')", etc.
  const stripped = v.replace(IMPERIAL_PAREN_RE, '').trim();
  if (stripped !== v && stripped.length > 0) {
    // Simple single mm value → convert to m
    const mmSingle = stripped.match(/^([\d,]+)\s*mm$/);
    if (mmSingle) {
      const m = parseFloat(mmSingle[1].replace(',', '')) / 1000;
      return `${roundTo2(m)} m`;
    }
    return stripped;
  }

  return v;
}
