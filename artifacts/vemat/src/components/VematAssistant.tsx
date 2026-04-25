import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  ExternalLink,
  Loader2,
  Maximize2,
  MessageSquare,
  Minimize2,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useLang } from "@/i18n/I18nProvider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getLocalAssistantReply } from "@/lib/chatbotLocalSearch";
import {
  buildGuidedComparatorResult,
  getGuidedComparatorStep,
  type GuidedAnswers,
  type GuidedJobType,
} from "@/lib/guidedComparator";
import { useIsMobile } from "@/hooks/use-mobile";

type AssistantSource = {
  type: "product" | "part" | "document" | "page" | "article";
  title: string;
  url: string;
  subtitle?: string;
  snippet?: string;
};

type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: AssistantSource[];
};

type AssistantApiResponse = {
  mode: "openai" | "local";
  message: string;
  sources: AssistantSource[];
  suggestions: string[];
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function buildApiUrl(path: string) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatInline(value: string) {
  let html = escapeHtml(value);

  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="font-semibold text-accent underline underline-offset-2">$1</a>',
  );

  return html;
}

function renderMessageHtml(content: string) {
  const lines = content.split("\n");
  let html = "";
  let inList = false;

  const closeList = () => {
    if (inList) {
      html += "</ul>";
      inList = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      closeList();
      continue;
    }

    if (/^###\s+/.test(line)) {
      closeList();
      html += `<h4 class="mt-3 text-sm font-black text-zinc-950">${formatInline(
        line.replace(/^###\s+/, ""),
      )}</h4>`;
      continue;
    }

    if (/^##\s+/.test(line)) {
      closeList();
      html += `<h3 class="mt-3 text-base font-black text-zinc-950">${formatInline(
        line.replace(/^##\s+/, ""),
      )}</h3>`;
      continue;
    }

    if (/^- /.test(line)) {
      if (!inList) {
        html += '<ul class="mt-2 space-y-1 pl-4">';
        inList = true;
      }
      html += `<li class="list-disc text-sm leading-relaxed text-zinc-700">${formatInline(
        line.replace(/^- /, ""),
      )}</li>`;
      continue;
    }

    closeList();
    html += `<p class="text-sm leading-relaxed text-zinc-700">${formatInline(line)}</p>`;
  }

  closeList();
  return html;
}

function AssistantRichText({ content }: { content: string }) {
  return <div className="space-y-2" dangerouslySetInnerHTML={{ __html: renderMessageHtml(content) }} />;
}

export function VematAssistant() {
  const { lang } = useLang();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [guidedAnswers, setGuidedAnswers] = useState<GuidedAnswers | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const copy = useMemo(
    () =>
      lang === "fr"
        ? {
            title: "Assistant Vemat",
            subtitle: "Machines, pieces, docs et infos Vemat en une seule conversation.",
            placeholder: "Ex: Je cherche une grue 70 t ou la brochure du TRT 35",
            cta: "Parlez a l assistant",
            disclaimer: "Reponses basees sur le catalogue et les pages du site.",
            emptyTitle: "Que voulez-vous trouver ?",
            emptyBody:
              "Je peux vous aider a retrouver une machine, une piece, une brochure ou les coordonnees Vemat.",
            send: "Envoyer",
            thinking: "Analyse en cours...",
            sourceLabel: "Sources utiles",
            resizeHint: "Tu peux agrandir la fenetre ou utiliser le bouton taille.",
            guidedPrompt: "Lancer un comparateur guide",
            sourceTypes: {
              product: "Produit",
              part: "Piece",
              document: "Document",
              page: "Page",
              article: "Article",
            },
            quickPrompts: [
              "Je cherche une machine pour levage lourd",
              "As-tu la brochure du TRT 35 ?",
              "Je cherche une piece JLG par reference",
              "Comment contacter Vemat ?",
            ],
          }
        : {
            title: "Vemat Assistant",
            subtitle: "Machines, spare parts, documents, and Vemat info in one conversation.",
            placeholder: "Example: I need a 70 t crane or the TRT 35 brochure",
            cta: "Chat with the assistant",
            disclaimer: "Answers are grounded in the site catalog and pages.",
            emptyTitle: "What do you want to find?",
            emptyBody:
              "I can help you find a machine, a spare part, a brochure, or Vemat contact details.",
            send: "Send",
            thinking: "Analyzing...",
            sourceLabel: "Useful sources",
            resizeHint: "You can resize the panel or use the size toggle.",
            guidedPrompt: "Start a guided comparator",
            sourceTypes: {
              product: "Product",
              part: "Part",
              document: "Document",
              page: "Page",
              article: "Article",
            },
            quickPrompts: [
              "I need a machine for heavy lifting",
              "Do you have the TRT 35 brochure?",
              "I need a JLG spare part by reference",
              "How can I contact Vemat?",
            ],
          },
    [lang],
  );

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading, isOpen, guidedAnswers]);

  useEffect(() => {
    setSuggestions(copy.quickPrompts);
  }, [copy.quickPrompts]);

  const panelStyle = isMobile
    ? {}
    : {
        width: isExpanded ? "min(780px, calc(100vw - 2rem))" : "min(520px, calc(100vw - 2rem))",
        height: isExpanded ? "min(86vh, 980px)" : "min(76vh, 840px)",
        minWidth: "420px",
        minHeight: "540px",
        maxWidth: "calc(100vw - 2rem)",
        maxHeight: "calc(100vh - 3rem)",
        resize: "both" as const,
      };

  const submitMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage: AssistantMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(buildApiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang,
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as AssistantApiResponse;

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: payload.message,
          sources: payload.sources,
        },
      ]);
      setSuggestions(payload.suggestions?.length ? payload.suggestions : copy.quickPrompts);
    } catch (_error) {
      const payload = getLocalAssistantReply(trimmed, lang);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: payload.message,
          sources: payload.sources,
        },
      ]);
      setSuggestions(payload.suggestions);
    } finally {
      setIsLoading(false);
    }
  };

  const startGuidedComparator = () => {
    const nextAnswers: GuidedAnswers = {};
    setGuidedAnswers(nextAnswers);
    const step = getGuidedComparatorStep(lang, nextAnswers);
    if (!step) return;

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: step.question,
      },
    ]);
  };

  const handleGuidedChoice = (value: string) => {
    if (!guidedAnswers) return;

    const step = getGuidedComparatorStep(lang, guidedAnswers);
    if (!step) return;

    const selectedLabel = step.options.find((option) => option.value === value)?.label || value;

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: selectedLabel,
      },
    ]);

    const nextAnswers: GuidedAnswers =
      step.key === "jobType"
        ? { ...guidedAnswers, jobType: value as GuidedJobType }
        : step.key === "capacity"
          ? { ...guidedAnswers, capacity: value as GuidedAnswers["capacity"] }
          : { ...guidedAnswers, height: value as GuidedAnswers["height"] };

    const nextStep = getGuidedComparatorStep(lang, nextAnswers);

    if (nextStep) {
      setGuidedAnswers(nextAnswers);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: nextStep.question,
        },
      ]);
      return;
    }

    const result = buildGuidedComparatorResult(lang, nextAnswers);
    setGuidedAnswers(null);

    if (result) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.message,
          sources: result.sources,
        },
      ]);
    }
  };

  const guidedStep = guidedAnswers ? getGuidedComparatorStep(lang, guidedAnswers) : null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            style={panelStyle}
            className="fixed bottom-28 right-4 z-[110] flex w-[calc(100vw-2rem)] max-w-[420px] flex-col overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-[0_30px_80px_rgba(0,0,0,0.18)] md:right-8 md:max-w-none"
          >
            <div className="border-b border-zinc-100 bg-zinc-950 px-6 py-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <h3 className="text-lg font-black tracking-tight">{copy.title}</h3>
                  </div>
                  <p className="text-sm text-zinc-300">{copy.subtitle}</p>
                </div>

                <div className="flex items-center gap-2">
                  {!isMobile && (
                    <button
                      type="button"
                      onClick={() => setIsExpanded((current) => !current)}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                      aria-label="Resize assistant"
                    >
                      {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Close assistant"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {!isMobile && (
                <div className="mt-3 text-xs text-zinc-400">{copy.resizeHint}</div>
              )}
            </div>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-zinc-50 px-4 py-5">
              {messages.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-zinc-200 bg-white p-5">
                  <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <Bot className="h-6 w-6" />
                  </div>
                  <h4 className="mb-2 text-lg font-black text-zinc-950">{copy.emptyTitle}</h4>
                  <p className="text-sm leading-relaxed text-zinc-500">{copy.emptyBody}</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[92%] rounded-[1.5rem] px-4 py-3 shadow-sm ${
                        message.role === "user"
                          ? "bg-accent text-accent-foreground"
                          : "border border-zinc-200 bg-white text-zinc-900"
                      }`}
                    >
                      {message.role === "user" ? (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                      ) : (
                        <AssistantRichText content={message.content} />
                      )}

                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-4 border-t border-zinc-100 pt-3">
                          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                            {copy.sourceLabel}
                          </p>
                          <div className="space-y-2">
                            {message.sources.slice(0, 3).map((source) => (
                              <a
                                key={`${source.type}-${source.title}-${source.url}`}
                                href={source.url}
                                target={source.url.startsWith("http") ? "_blank" : undefined}
                                rel={source.url.startsWith("http") ? "noopener noreferrer" : undefined}
                                className="flex items-start justify-between gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-3 text-left transition-colors hover:border-accent/30 hover:bg-white"
                              >
                                <span className="min-w-0">
                                  <span className="block truncate text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                                    {copy.sourceTypes[source.type]}
                                  </span>
                                  <span className="block text-sm font-bold text-zinc-950">{source.title}</span>
                                  {source.subtitle && (
                                    <span className="block text-xs text-zinc-500">{source.subtitle}</span>
                                  )}
                                  {source.snippet && (
                                    <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
                                      {source.snippet}
                                    </span>
                                  )}
                                </span>
                                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-3 rounded-[1.5rem] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-500 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {copy.thinking}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-zinc-100 bg-white px-4 py-4">
              {guidedStep ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {guidedStep.options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleGuidedChoice(option.value)}
                      className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-600 transition-colors hover:border-accent/30 hover:text-zinc-950"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mb-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={startGuidedComparator}
                    className="rounded-full border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-bold text-zinc-700 transition-colors hover:border-accent hover:text-zinc-950"
                  >
                    {copy.guidedPrompt}
                  </button>
                  {(messages.length === 0 ? copy.quickPrompts : suggestions).slice(0, 4).map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => submitMessage(suggestion)}
                      className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-600 transition-colors hover:border-accent/30 hover:text-zinc-950"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  submitMessage(input);
                }}
                className="space-y-3"
              >
                <Textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={copy.placeholder}
                  rows={3}
                  className="min-h-[96px] resize-none rounded-[1.5rem] border-zinc-200 bg-zinc-50"
                />
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs text-zinc-400">{copy.disclaimer}</p>
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="h-11 rounded-full bg-accent px-5 text-accent-foreground hover:bg-accent/90"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {copy.send}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsOpen((current) => !current)}
        className="fixed bottom-28 right-4 z-[109] flex h-16 w-16 items-center justify-center rounded-full border border-zinc-950 bg-zinc-950 text-white shadow-[0_16px_40px_rgba(0,0,0,0.28)] md:right-8"
        title={copy.cta}
      >
        <MessageSquare className="h-7 w-7" />
      </motion.button>
    </>
  );
}
