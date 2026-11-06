/**
 * Identité Vemat Westchase LTD pour tous les documents téléchargeables
 * (devis, commandes, bons, factures, avoirs). Reprend à l'identique les modèles
 * DE26635 / DE26636 : logo rond centré, filet rouge pleine largeur, pied de page à 3 lignes.
 */

import {
  Header, Footer, Paragraph, TextRun, ImageRun, AlignmentType, LineRuleType, BorderStyle,
  HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom, TextWrappingType,
} from "docx";

const FONT = "Arial";

/** Marge d'en-tête des modèles (w:header = 39) : le logo remonte en haut de page. */
export const WC_HEADER_MARGIN = 39;

export function westchaseHeader(logo: Uint8Array): Header {
  return new Header({
    children: [
      new Paragraph({
        children: [
          new ImageRun({
            type: "png",
            data: logo,
            // 1 534 160 EMU = 161 px : taille et position des modèles
            transformation: { width: 161, height: 161 },
            floating: {
              horizontalPosition: { relative: HorizontalPositionRelativeFrom.COLUMN, offset: 2493299 },
              verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: -24765 },
              behindDocument: true,
              allowOverlap: true,
              wrap: { type: TextWrappingType.NONE },
            },
          }),
        ],
      }),
      // Filet rouge pleine largeur sous le logo (#FF0313, 2 pt)
      new Paragraph({
        spacing: { before: 0, after: 0, line: 2300, lineRule: LineRuleType.EXACT },
        indent: { left: -709, right: -424 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 16, color: "FF0313", space: 0 } },
        children: [],
      }),
    ],
  });
}

function fr(text: string, o: { bold?: boolean; size: number }) {
  return new TextRun({ text, font: FONT, bold: o.bold, size: o.size });
}

export function westchaseFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          fr("VEMAT WESTCHASE LTD", { bold: true, size: 16 }),
          fr(" – 11, Sumbo Jibowu Ikoyi, Lagos, Lagos, Nigeria", { size: 16 }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [fr("Tél. : +234 814 315 5517 -  vematwestchase@vematgroup.com", { size: 16 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          fr(
            "Vemat Westchase LTD  is an authorized distributor of TEREX RT CRANES, TADANO, JLG, MAGNI, INGERSOLL RAND, and MECALAC  products",
            { size: 13 },
          ),
        ],
      }),
    ],
  });
}

/** Mêmes lignes de pied de page en texte brut (PDF). */
export const WC_FOOTER_TEXT = [
  "VEMAT WESTCHASE LTD – 11, Sumbo Jibowu Ikoyi, Lagos, Lagos, Nigeria",
  "Tél. : +234 814 315 5517 -  vematwestchase@vematgroup.com",
  "Vemat Westchase LTD  is an authorized distributor of TEREX RT CRANES, TADANO, JLG, MAGNI, INGERSOLL RAND, and MECALAC  products",
] as const;

/**
 * Coordonnées bancaires, telles que sur les devis DE26636 (USD et NAIRA : Zenith Bank).
 * EUR : inchangé, en attente de confirmation (le dernier modèle fourni est encore à l'ancien nom).
 */
export const WC_BANK = {
  USD: [
    "Account Name: VEMAT WESTCHASE LTD",
    "Number:  USD ACCOUNT NO : 5076001382",
    "BENEFICIARY BANK: ZENITH BANK PLC",
  ],
  NAIRA: [
    "Account Name: VEMAT WESTCHASE LTD",
    "Number:  NAIRA ACCOUNT NO : 1312037496",
    "BENEFICIARY BANK: ZENITH BANK PLC",
  ],
  EUR: [
    "Account Name: WESTCHASE OIL AND GAS LTD - VEMAT",
    "Number:  EUR ACCOUNT NO : 1309288049",
    "BENEFICIARY BANK: PROVIDUS BANK PLC",
  ],
} as const;
