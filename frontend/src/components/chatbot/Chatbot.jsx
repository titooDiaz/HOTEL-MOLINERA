import { useEffect, useRef, useState } from "react";
import { getAuthToken } from "../../api.js";
import "./Chatbot.css";

const INITIAL_MESSAGE = {
  role: "assistant",
  content: "¡Hola! Soy el asistente virtual de Hotel Molinera. ¿En qué puedo ayudarte?",
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const messagesRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
    inputRef.current?.focus();
  }, [isOpen, messages, isSending]);

  const sendMessage = async (event) => {
    event.preventDefault();
    const content = input.trim();
    if (!content || isSending) return;

    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setIsSending(true);

    try {
      const headers = { "Content-Type": "application/json" };
      const authToken = getAuthToken();
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: nextMessages.slice(-10),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "No se pudo contactar al asistente.");
      setMessages((current) => [...current, { role: "assistant", content: body.message }]);
    } catch (requestError) {
      setError(requestError.message || "No se pudo contactar al asistente.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="chatbot">
      {isOpen && (
        <section className="chatbot-panel" aria-label="Chat con el asistente virtual">
          <header className="chatbot-header">
            <div className="chatbot-avatar" aria-hidden="true">
              <span>✦</span>
            </div>
            <div>
              <strong>Asistente Hotel Molinera</strong>
              <span><i className="chatbot-status-dot" /> Disponible · IA local</span>
            </div>
            <button type="button" className="chatbot-close" onClick={() => setIsOpen(false)} aria-label="Cerrar chat">
              ×
            </button>
          </header>

          <div className="chatbot-messages" ref={messagesRef} aria-live="polite">
            {messages.map((message, index) => (
              <p key={`${message.role}-${index}`} className={`chatbot-message chatbot-message--${message.role}`}>
                {message.content}
              </p>
            ))}
            {isSending && <p className="chatbot-message chatbot-message--assistant chatbot-typing">Escribiendo...</p>}
            {error && <p className="chatbot-error">{error}</p>}
          </div>

          <form className="chatbot-form" onSubmit={sendMessage}>
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Escribe tu pregunta..."
              aria-label="Mensaje para el asistente"
              maxLength={500}
              disabled={isSending}
            />
            <button type="submit" disabled={!input.trim() || isSending} aria-label="Enviar mensaje">
              <span aria-hidden="true">➤</span>
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="chatbot-fab"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={isOpen ? "Cerrar chat con el asistente" : "Abrir chat con el asistente"}
        aria-expanded={isOpen}
      >
        <span className="chatbot-fab-sparkle" aria-hidden="true">✦</span>
        <span className="chatbot-fab-label">Chat</span>
      </button>
    </div>
  );
}
