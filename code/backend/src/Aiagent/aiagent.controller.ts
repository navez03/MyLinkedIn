// src/aiagent/aiagent.controller.ts
import { Body, Controller, Post } from "@nestjs/common";
import OpenAI from "openai";
import { AiAgentDto } from "./dto/aiagent.dto";

@Controller("aiagent")
export class AiAgentController {
  private groq: OpenAI;

  constructor() {
    this.groq = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }

  @Post()
  async handleMessage(@Body() body: AiAgentDto) {
    const { text, preferredLanguage } = body;

    if (!text) {
      return { error: "Missing 'text' in body" };
    }

    const language = preferredLanguage || "Portuguese (European)";

    const completion = await this.groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `
You are an AI assistant embedded in a professional networking website.

Your job:
- Help the user WRITE or REWRITE short, formal messages.
- Default language: ${language}, unless the user explicitly asks for another language.
- If the user sends an informal text, rewrite it in a formal, polite tone.
- If the user only gives context, propose 1-2 formal drafts.
- Respond ONLY with the final message(s), ready to copy-paste.
- Do NOT explain what you are doing.
- Be concise.
        `,
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.3,
    });

    const answer = completion.choices[0]?.message?.content ?? "";

    return { formalText: answer };
  }
}
