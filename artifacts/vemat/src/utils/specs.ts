/**
 * Extracts a numerical value from a specification string.
 * Handles both metric and imperial units.
 * Returns value in metric (meters for length, kg for weight) if possible.
 */
export function parseSpecValue(value: string | undefined): number | null {
  if (!value) return null;
  
  // Normalize string: remove non-breaking spaces, en-dashes, etc.
  const cleanValue = value.toLowerCase()
    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ') // whitespace
    .replace(/[–—]/g, '-') // dashes
    .replace(/,/g, '') // remove thousands separator (e.g. 1,100 -> 1100)
    .trim();

  // Handle Foot/Inch: "10-ft 2-in" or "10' 2\""
  if (cleanValue.includes('ft') || cleanValue.includes('in') || cleanValue.includes("'") || cleanValue.includes('"')) {
    const ftMatch = cleanValue.match(/(\d+(?:\.\d+)?)\s*(?:ft|')/);
    const inMatch = cleanValue.match(/(\d+(?:\.\d+)?)\s*(?:in|")/);
    let feet = ftMatch ? parseFloat(ftMatch[1]) : 0;
    let inches = inMatch ? parseFloat(inMatch[1]) : 0;
    return (feet * 0.3048) + (inches * 0.0254);
  }

  // Handle Weight: "550-lb"
  if (cleanValue.includes('lb')) {
    const lbMatch = cleanValue.match(/(\d+(?:\.\d+)?)\s*lb/);
    if (lbMatch) return parseFloat(lbMatch[1]) * 0.453592;
  }
  
  // Handle metric: "6300 mm", "9400 kg", "11 t", "55.4 kw"
  // Look for the first number followed by unit
  const metricMatch = cleanValue.match(/(\d+(?:\.\d+)?)\s*(mm|m|kg|t|hp|kw|da n|lbf)/);
  if (metricMatch) {
    let val = parseFloat(metricMatch[1]);
    let unit = metricMatch[2].replace(/\s/g, '');
    if (unit === 'mm') return val / 1000;
    if (unit === 't') return val * 1000;
    return val;
  }

  // Default: find first number
  const genericMatch = cleanValue.match(/(\d+(?:\.\d+)?)/);
  if (genericMatch) return parseFloat(genericMatch[1]);

  return null;
}

export const SPEC_KEYS = {
  HEIGHT: [
    "Hauteur max. plateforme", 
    "Hauteur de travail", 
    "Hauteur de levage avec fourches", 
    "Hauteur max. crochet", 
    "Hauteur de levage",
    "Hauteur de la machine"
  ],
  CAPACITY: [
    "Capacité max. plateforme", 
    "Capacité de levage", 
    "Charge maximale",
    "Capacité max."
  ],
  WEIGHT: [
    "Poids de la machine", 
    "Poids en ordre de marche", 
    "Poids total",
    "Masse"
  ],
};

