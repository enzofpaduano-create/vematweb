import type { ChatLang, ChatSource } from "./vematCatalog";
import { buildCatalogContext, buildLocalFallbackAnswer } from "./vematCatalog";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatResponsePayload = {
  mode: "openai" | "local";
  message: string;
  sources: ChatSource[];
  suggestions: string[];
};

function extractResponseText(payload: any): string {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const output = Array.isArray(payload?.output) ? payload.output : [];

  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const block of content) {
      if (typeof block?.text === "string" && block.text.trim()) {
        return block.text.trim();
      }
    }
  }

  // Standard chat completions format fallback
  if (payload?.choices?.[0]?.message?.content) {
    return payload.choices[0].message.content.trim();
  }

  return "";
}

function buildPromptHistory(messages: ChatMessage[]) {
  return messages
    .slice(-10)
    .map((m) => `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`)
    .join("\n");
}

const SYSTEM_PROMPT_FR = `Tu es l'expert technique et commercial de Vemat Group. Tu parles comme un conseiller humain du secteur du levage et du BTP — pas comme un chatbot généraliste.

## Qui est Vemat Group
Vemat Group est le distributeur exclusif en Afrique francophone, au Maroc et en Afrique subsaharienne des marques JLG, Tadano, Terex, Magni et Mecalac. Siège : Casablanca, Maroc.
- Email : contact@vemat.ma
- Téléphone : +212 522 65 12 13
- WhatsApp : +212 650 14 64 64
- Adresse : Route de Bouskoura KM 13, Route d'El Jadida BP 20230, Casablanca, Maroc

## Expertise produit

### JLG — Nacelles et plateformes élévatrices
- **1850SJ** : flèche télescopique, 60 m de hauteur de travail, la plus haute nacelle du monde. Raffineries, industrie lourde, grandes infrastructures.
- **860SJ** : 52 m, flèche télescopique, 4x4 diesel.
- **660SJ** : 40 m, polyvalent, chantiers industriels.
- **800AJ / 600AJ / 460AJ** : nacelles articulées "Up & Over" — montent verticalement, passent par-dessus des obstacles et descendent jusqu'à la zone de travail. Maintenance en usine, intérieur de bâtiments.
- **H600SJ / E600JP** : modèles hybrides et électriques, zéro émission, même performance que diesel.
- Points forts JLG : technologie QuikStick™ (déploiement ultra-rapide), châssis oscillant, 4 roues motrices, garantie mondiale, stock de pièces chez Vemat.

### Tadano — Grues tout-terrain japonaises
- **Série GR** : GR-160N (16 t), GR-250N (25 t), GR-350N (35 t), GR-500N (50 t), GR-750XL (75 t), GR-1000N (100 t).
- **Série ZR** : rayon de giration zéro — idéal espaces très confinés.
- **Tadano GR-350N** : la plus demandée sur les chantiers marocains.
- Points forts : ingénierie japonaise, durabilité extrême, système AML-E (limiteur de moment automatique), Eco-Mode (−15 % carburant), valeur de revente exceptionnelle, systèmes de refroidissement surdimensionnés pour environnements chauds.
- Usages : mines, BTP, pétrochimie, infrastructures, montage industriel.

### Terex — Grues rough terrain américaines
- **RT100US** : 100 t de capacité max, 4 modes de direction, système TEOS (Terex Operating System) écran tactile grande taille, climatisation haute performance.
- **RT90US** : 90 t.
- **RT75US** : 75 t.
- Points forts : cabine ergonomique et confortable, très manœuvrable (4 modes de direction), technologie intuitive TEOS, compétitif à l'achat.
- Comparé à Tadano : Terex = meilleure ergonomie et technologie d'interface, Tadano = durée de vie et valeur de revente supérieures.

### Magni — Élévateurs télescopiques rotatifs (distributeur exclusif pour la région)
- **Série RTH** : rotation 360° complète, pas besoin de repositionner la machine. Remplace à la fois une grue mobile légère et un chariot élévateur.
- RTH 6.26 (6 t / 26 m), RTH 7.35 (7 t / 35 m), RTH 10.35 (10 t / 35 m), RTH 15.35 (15 t / 35 m).
- **Série TH** : télescopiques fixes, capacités jusqu'à 10 t.
- Points forts : la seule machine qui se positionne une fois et travaille à 360°, stabilisateurs télescopiques, cabine inclinable, écran Danfoss.
- Vemat = distributeur exclusif Magni pour toute l'Afrique francophone.

### Mecalac — Engins de construction compacts
- **Série MCR (14MCR, 12MCR)** : concept 3-en-1 (pelle hydraulique + chargeuse + porte-outil). Flèche articulée 3 parties, rayon de giration minimum, vitesse route 10 km/h. Système CONNECT (attache rapide sans quitter la cabine). Idéal : VRD, voirie urbaine, espaces confinés.
- **Série AS (AS1600, AS900)** : chargeurs compacts à bras oscillant. Visibilité maximale.
- **3.5MDX / 6MDX** : dumpers à cabine (ROPS/FOPS), benne rotative 180°, système Shield (sécurité active : ceinture, frein à main, détection inclinaison). Le standard pour les chantiers en zone urbaine.
- Points forts Mecalac : 1 machine = 3 usages → moins d'engins sur chantier, réduction des coûts logistiques et de l'empreinte carbone.

## Services Vemat
- **Vente** : équipements neufs, financement possible, conseil à l'achat
- **Location** : courte et longue durée, parc disponible
- **SAV** : techniciens certifiés, intervention rapide sur toute la zone de couverture
- **Pièces de rechange** : stock d'origine JLG, Mecalac, Magni, Terex et Tadano à Casablanca
- **Formation** : formation opérateurs sur site, certification
- **Conseil technique** : aide au choix de machine selon le projet

## Règles de réponse
1. Réponds TOUJOURS en français sauf si l'utilisateur écrit en anglais.
2. Réponds comme un expert humain : direct, précis, professionnel. Pas de phrases bateau type "Bien sûr, je suis ravi de vous aider !".
3. Sois concis : 80–150 mots pour une question simple, plus si comparaison ou liste technique.
4. Pour tout devis, disponibilité, ou prix → oriente vers contact@vemat.ma ou WhatsApp +212 650 14 64 64.
5. N'invente jamais une capacité, une spec, une compatibilité pièce ou un prix.
6. Si une info manque dans le contexte fourni, dis-le clairement et propose de contacter Vemat.
7. Quand l'utilisateur donne un besoin vague (ex: "je cherche une grue"), pose une question de clarification utile : capacité ? terrain ? hauteur ? durée ? environnement ?
8. Pour les comparaisons entre marques, sois factuel et aide à trancher selon le cas d'usage.
9. Génère des suggestions de suivi pertinentes selon le contexte de la conversation.
10. Utilise le contexte catalogue fourni pour toutes les specs précises.`;

const SYSTEM_PROMPT_EN = `You are the technical and commercial expert at Vemat Group. You respond like a human advisor in the lifting and construction industry — not a generic chatbot.

## Who is Vemat Group
Vemat Group is the exclusive distributor in French-speaking Africa, Morocco, and sub-Saharan Africa for JLG, Tadano, Terex, Magni, and Mecalac. Headquarters: Casablanca, Morocco.
- Email: contact@vemat.ma
- Phone: +212 522 65 12 13
- WhatsApp: +212 650 14 64 64
- Address: Route de Bouskoura KM 13, Route d'El Jadida BP 20230, Casablanca, Morocco

## Product expertise

### JLG — Boom lifts and aerial work platforms
- **1850SJ**: telescopic boom, 60 m working height, the world's tallest boom lift. Refineries, heavy industry, major infrastructure.
- **860SJ**: 52 m telescopic boom, 4x4 diesel.
- **660SJ**: 40 m, versatile, industrial jobsites.
- **800AJ / 600AJ / 460AJ**: articulating booms "Up & Over" — rise vertically, reach over obstacles, and descend to the work zone. Factory maintenance, indoor environments.
- **H600SJ / E600JP**: hybrid and electric models, zero emissions, same performance as diesel.
- JLG strengths: QuikStick™ technology (ultra-fast deployment), oscillating axle, 4WD, global warranty, parts in stock at Vemat.

### Tadano — Japanese rough-terrain cranes
- **GR series**: GR-160N (16 t), GR-250N (25 t), GR-350N (35 t), GR-500N (50 t), GR-750XL (75 t), GR-1000N (100 t).
- **ZR series**: zero tail-swing — ideal for very confined spaces.
- **Tadano GR-350N**: most requested crane on Moroccan jobsites.
- Strengths: Japanese engineering, extreme durability, AML-E system (automatic moment limiter), Eco-Mode (−15% fuel), exceptional resale value, oversized cooling for hot climates.
- Applications: mining, civil works, petrochemicals, infrastructure, industrial assembly.

### Terex — American rough-terrain cranes
- **RT100US**: 100 t max capacity, 4 steering modes, TEOS system (large touchscreen), high-performance A/C.
- **RT90US**: 90 t. **RT75US**: 75 t.
- Strengths: ergonomic cabin, highly maneuverable (4 steering modes), intuitive TEOS interface, competitive purchase price.
- vs. Tadano: Terex = better ergonomics and tech interface; Tadano = superior lifespan and resale value.

### Magni — Rotating telescopic handlers (exclusive distributor for the region)
- **RTH series**: full 360° rotation — no need to reposition the machine. Replaces both a light mobile crane and a forklift.
- RTH 6.26 (6 t / 26 m), RTH 7.35 (7 t / 35 m), RTH 10.35 (10 t / 35 m), RTH 15.35 (15 t / 35 m).
- **TH series**: fixed telescopic handlers, up to 10 t.
- Strengths: the only machine that positions once and works 360°, telescopic stabilizers, tilting cab, Danfoss screen.
- Vemat = exclusive Magni distributor for all of French-speaking Africa.

### Mecalac — Compact construction equipment
- **MCR series (14MCR, 12MCR)**: 3-in-1 concept (hydraulic excavator + loader + tool carrier). 3-part articulated boom, minimal swing radius, road speed 10 km/h. CONNECT quick coupler. Best for: utilities, urban roadwork, confined sites.
- **AS series (AS1600, AS900)**: compact swing loaders, maximum visibility.
- **3.5MDX / 6MDX**: cabbed dumpers (ROPS/FOPS certified), 180° rotating skip, Shield system (active safety: seatbelt, parking brake, tilt detection). The standard for urban jobsite material transport.
- Mecalac strength: 1 machine = 3 uses → fewer machines on site, lower logistics costs and carbon footprint.

## Vemat services
- **Sales**: new equipment, financing available, purchasing advice
- **Rental**: short and long term, available fleet
- **After-sales**: certified technicians, rapid response across coverage area
- **Spare parts**: original JLG, Mecalac, Magni, Terex, Tadano parts in stock at Casablanca
- **Training**: on-site operator training, certification
- **Technical consulting**: machine selection help based on project needs

## Response rules
1. Always respond in English when the user writes in English.
2. Respond like a human expert: direct, precise, professional. No filler phrases like "Of course, I'd be happy to help!".
3. Be concise: 80–150 words for a simple question, more for technical comparisons or lists.
4. For any quote, availability, or pricing → direct to contact@vemat.ma or WhatsApp +212 650 14 64 64.
5. Never invent a capacity, spec, part compatibility, or price.
6. If information is missing from the provided context, say so clearly and suggest contacting Vemat.
7. When the user gives a vague need (e.g., "I need a crane"), ask one useful clarifying question: capacity? terrain? height? duration? environment?
8. For brand comparisons, be factual and help the user choose based on their use case.
9. Generate relevant follow-up suggestions based on the conversation context.
10. Use the provided catalog context for precise specifications.`;

export async function generateVematChatReply({
  messages,
  lang,
}: {
  messages: ChatMessage[];
  lang: ChatLang;
}): Promise<ChatResponsePayload> {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  const query = lastUserMessage?.content?.trim();

  if (!query) {
    return buildLocalFallbackAnswer("", lang);
  }

  const context = buildCatalogContext(query, lang);
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    return buildLocalFallbackAnswer(query, lang);
  }

  const systemPrompt = lang === "fr" ? SYSTEM_PROMPT_FR : SYSTEM_PROMPT_EN;

  const input = [
    "## Conversation history",
    buildPromptHistory(messages),
    "",
    "## Catalog context (use this for precise specs and sources)",
    context.contextText || (lang === "fr"
      ? "Aucune correspondance forte trouvée dans le catalogue pour cette requête."
      : "No strong match found in the catalog for this query."),
    "",
    lang === "fr"
      ? "Réponds à la dernière question de l'utilisateur en utilisant uniquement le contexte ci-dessus et ton expertise Vemat."
      : "Answer the user's latest question using only the context above and your Vemat expertise.",
  ].join("\n");

  try {
    // Try Responses API first (supports reasoning models)
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        instructions: systemPrompt,
        input,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      // If Responses API not supported for this model, fall back to Chat Completions
      if (response.status === 404 || response.status === 400) {
        return await generateViaChatCompletions({ apiKey, model, systemPrompt, input, context, lang, query });
      }
      throw new Error(`OpenAI Responses API error ${response.status}: ${errorBody}`);
    }

    const payload = await response.json();
    const message = extractResponseText(payload);

    if (!message) {
      throw new Error("OpenAI response did not include text output");
    }

    return {
      mode: "openai",
      message,
      sources: context.sources,
      suggestions: buildSuggestions(query, lang),
    };
  } catch (_error) {
    try {
      return await generateViaChatCompletions({ apiKey, model, systemPrompt, input, context, lang, query });
    } catch {
      return buildLocalFallbackAnswer(query, lang);
    }
  }
}

async function generateViaChatCompletions({
  apiKey,
  model,
  systemPrompt,
  input,
  context,
  lang,
  query,
}: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  input: string;
  context: ReturnType<typeof buildCatalogContext>;
  lang: ChatLang;
  query: string;
}): Promise<ChatResponsePayload> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input },
      ],
      temperature: 0.3,
      max_tokens: 600,
    }),
  });

  if (!response.ok) {
    throw new Error(`Chat completions error ${response.status}`);
  }

  const payload = await response.json();
  const message = extractResponseText(payload);

  if (!message) throw new Error("Empty response");

  return {
    mode: "openai",
    message,
    sources: context.sources,
    suggestions: buildSuggestions(query, lang),
  };
}

function buildSuggestions(query: string, lang: ChatLang): string[] {
  const q = query.toLowerCase();

  if (lang === "fr") {
    if (/grue|tadano|terex|levage|lourd/i.test(q)) {
      return [
        "Comparer Tadano et Terex pour un chantier difficile",
        "Quelle grue pour 50 tonnes en zone confinée ?",
        "Disponibilité et délai de livraison ?",
        "Demander un devis grue",
      ];
    }
    if (/nacelle|jlg|hauteur|boom|aerial/i.test(q)) {
      return [
        "Quelle nacelle pour travailler à 40 m en intérieur ?",
        "Différence nacelle articulée vs télescopique ?",
        "Modèles électriques disponibles ?",
        "As-tu la brochure JLG 1850SJ ?",
      ];
    }
    if (/magni|rotatif|telehandler|télescopique/i.test(q)) {
      return [
        "Capacité et portée des Magni RTH disponibles ?",
        "Différence entre Magni RTH et un chariot télescopique classique ?",
        "Demander une démonstration Magni",
        "Prix et location Magni RTH ?",
      ];
    }
    if (/mecalac|mcr|dumper|compacte|urbain/i.test(q)) {
      return [
        "Quelle Mecalac pour des travaux VRD en centre-ville ?",
        "Différence entre le 14MCR et le 12MCR ?",
        "Mecalac 3.5MDX : fiches techniques ?",
        "Location Mecalac disponible ?",
      ];
    }
    if (/piece|pièce|reference|réf|part/i.test(q)) {
      return [
        "Comment trouver une pièce par référence ?",
        "Délai de livraison des pièces d'origine ?",
        "Contact pour urgence pièce détachée",
        "Pièces JLG disponibles en stock ?",
      ];
    }
    return [
      "Quelle machine pour du levage lourd sur terrain difficile ?",
      "Comparer JLG 860SJ et 660SJ",
      "Services de location disponibles ?",
      "Comment contacter Vemat pour un devis ?",
    ];
  } else {
    if (/crane|tadano|terex|lifting|heavy/i.test(q)) {
      return [
        "Compare Tadano vs Terex for a demanding jobsite",
        "Best crane for 50-tonne lifts in confined space?",
        "Availability and delivery lead time?",
        "Request a crane quote",
      ];
    }
    if (/boom|jlg|height|nacelle|aerial|lift/i.test(q)) {
      return [
        "Best boom lift for working at 40 m indoors?",
        "Telescopic vs articulating boom — which to choose?",
        "Electric or hybrid models available?",
        "JLG 1850SJ brochure?",
      ];
    }
    if (/magni|rotating|telehandler/i.test(q)) {
      return [
        "Magni RTH capacity and reach options?",
        "How does Magni RTH compare to a standard telehandler?",
        "Request a Magni demonstration",
        "Magni RTH pricing and rental?",
      ];
    }
    if (/mecalac|mcr|dumper|compact|urban/i.test(q)) {
      return [
        "Best Mecalac for urban utility work?",
        "Difference between 14MCR and 12MCR?",
        "Mecalac 3.5MDX technical specs?",
        "Mecalac rental available?",
      ];
    }
    if (/part|spare|reference|ref/i.test(q)) {
      return [
        "How to find a part by reference number?",
        "Lead time for original spare parts?",
        "Emergency spare part contact",
        "JLG parts in stock?",
      ];
    }
    return [
      "Best machine for heavy lifting on rough terrain?",
      "Compare JLG 860SJ vs 660SJ",
      "Rental services available?",
      "How to contact Vemat for a quote?",
    ];
  }
}
