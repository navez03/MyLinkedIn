import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { Card } from "./card";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}
const API_BASE_URL = "http://localhost:3000";
const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm your AI assistant. Give a text and I'll help you make it more formal.",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // se quiseres default sempre PT:
  const preferredLanguage = "Portuguese (European)";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();

    const userMessage: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/aiagent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: userText,
          // preferredLanguage: "Portuguese (European)",
        }),
      });

      const raw = await response.text();
      console.log("AI raw response:", response.status, raw);

      if (!response.ok) {
        throw new Error(`Status ${response.status} – body: ${raw}`);
      }

      let data: any;
      try {
        data = JSON.parse(raw);
      } catch (err) {
        throw new Error(
          "Falha ao fazer parse do JSON: " + (err as Error).message
        );
      }

      const aiText =
        data.formalText ||
        "Sorry, I couldn't generate a formal message right now. Please try again.";

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        sender: "ai",
        timestamp: new Date(),
      };

      const followUpMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: "Tens mais algum texto que queiras tornar mais formal?",
        sender: "ai",
        timestamp: new Date(),
      };

      // 1️⃣ Adiciona a resposta principal da IA
      setMessages((prev) => [...prev, aiMessage]);

      // 2️⃣ Espera 10 segundos antes de fazer follow-up
      setTimeout(() => {
        const followUpMessage: Message = {
          id: (Date.now() + 2).toString(),
          text: "Tens mais algum texto que queiras tornar mais formal?",
          sender: "ai",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, followUpMessage]);
      }, 10000); // 10,000 ms = 10 segundos
    } catch (error) {
      console.error("AI assistant error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 3).toString(),
        text: "Ocorreu um erro ao falar com o assistente. Tenta outra vez dentro de alguns segundos.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Chat Card */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <Card className="w-[380px] h-[500px] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary text-primary-foreground rounded-t-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">AI Assistant</h3>
                  <p className="text-xs opacity-90">Online</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-primary-foreground/10 p-1 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-4 py-2 ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-secondary text-foreground rounded-lg px-4 py-2">
                    <div className="flex gap-1">
                      <span
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></span>
                      <span
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></span>
                      <span
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-border bg-card"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center z-50"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}

        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            1
          </span>
        )}
      </button>
    </>
  );
};

export default AIChatWidget;
