import { Router } from "express";
import { generateVematChatReply } from "../lib/vematChat";

const chatRouter = Router();

chatRouter.post("/chat", async (req, res, next) => {
  try {
    const rawLang = req.body?.lang;
    const rawMessages = req.body?.messages;

    const lang = rawLang === "en" ? "en" : "fr";
    const messages = Array.isArray(rawMessages)
      ? rawMessages.filter(
          (message): message is { role: "user" | "assistant"; content: string } =>
            (message?.role === "user" || message?.role === "assistant") &&
            typeof message?.content === "string" &&
            message.content.trim().length > 0,
        )
      : [];

    if (messages.length === 0) {
      res.status(400).json({ error: "At least one chat message is required." });
      return;
    }

    const result = await generateVematChatReply({ lang, messages });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default chatRouter;
