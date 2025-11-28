import { API_BASE_URL } from "./api";

export interface AiAgentResponse {
  formalText: string;
  error?: string;
}

export const aiService = {
  sendMessage: async (text: string, preferredLanguage?: string): Promise<AiAgentResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/aiagent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, preferredLanguage }),
      });
      const raw = await response.text();
      if (!response.ok) {
        throw new Error(`Status ${response.status} - body: ${raw}`);
      }
      let data: any;
      try {
        data = JSON.parse(raw);
      } catch (err) {
        throw new Error("Falha ao fazer parse do JSON: " + (err as Error).message);
      }
      return data;
    } catch (error) {
      return {
        formalText: "",
        error:
          error instanceof Error
            ? error.message
            : "Erro de ligação ao servidor",
      };
    }
  },
};
