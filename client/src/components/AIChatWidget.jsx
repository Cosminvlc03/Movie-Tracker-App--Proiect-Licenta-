import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/apiClient";

const ClapperboardIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 11V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V11M4 11V5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V11M4 11H20M9 3L5 11M14 3L10 11M19 3L15 11" />
  </svg>
);

const ChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export default function AIChatWidget() {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "ai", text: "", isGreeting: true }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const userMsg = { sender: "user", text: inputValue };
    const currentHistory = messages.map(m => ({
      sender: m.sender,
      text: m.isGreeting ? t('aiChat.greeting') : m.text
    }));

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);
    try {
      const data = await api("/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: userMsg.text,
          history: [...currentHistory, userMsg],
          language: i18n.language
        }),
      });
      setMessages((prev) => [...prev, { sender: "ai", text: data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { sender: "ai", text: t('aiChat.error') }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="ai-widget-container">
      {isOpen && (
        <div className="ai-chat-window">
          <div className="ai-chat-header">
            <h4 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, fontSize: "18px" }}>
              <ClapperboardIcon />
              MoviePalAI
            </h4>
            <button className="ai-close-btn" onClick={() => setIsOpen(false)}>✖</button>
          </div>
          
          <div className="ai-chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`ai-message ${msg.sender === "user" ? "user-msg" : "ai-msg"}`}>
                <p>{msg.isGreeting ? t('aiChat.greeting') : msg.text}</p>
              </div>
            ))}
            {isLoading && (
              <div className="ai-message ai-msg">
                <p className="ai-typing">{t('aiChat.typing')}<span>.</span><span>.</span><span>.</span></p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-chat-input">
            <input
              type="text"
              placeholder={t('aiChat.placeholder')}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button onClick={handleSend} disabled={isLoading || !inputValue.trim()}>
              ➤
            </button>
          </div>
        </div>
      )}
      {!isOpen && (
        <button className="ai-floating-btn" onClick={() => setIsOpen(true)}>
          <ChatIcon />
          <span>MoviePalAI</span>
        </button>
      )}
    </div>
  );
}