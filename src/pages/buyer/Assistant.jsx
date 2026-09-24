import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, ArrowLeft } from 'lucide-react';
import { assistantReplies, products } from '@/data/placeholders';
import { useAuth } from '@/context/AuthContext';
import ProductCard from '@/components/domain/ProductCard';
import styles from './Assistant.module.css';

const SUGGESTIONS = [
  "What's fresh on Saturday?",
  "Who sells eggs?",
  "When does Elm Street close?",
];

/**
 * Assistant chat sheet ("Ask MarketLink").
 */
export function Assistant({ inSheet = true, onClose }) {
  const { user } = useAuth();
  const displayName = user?.firstName || 'there';

  const [messages, setMessages] = useState([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `Good day, ${displayName}. I'm here to help you shop this Saturday. Ask me what's fresh, where to find specific harvests, or about market hours.`,
      time: 'Just now',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      time: 'Just now',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate assistant reply with recommended product cards
    setTimeout(() => {
      let replyText = assistantReplies[text];
      const lower = text.toLowerCase();
      let matchedProducts = [];

      if (!replyText) {
        if (lower.includes('fresh') || lower.includes('produce') || lower.includes('vegetable')) {
          replyText = assistantReplies["What's fresh on Saturday?"];
          matchedProducts = [products.find((p) => p.id === 'p-01'), products.find((p) => p.id === 'p-02')].filter(Boolean);
        } else if (lower.includes('egg') || lower.includes('chicken') || lower.includes('poultry')) {
          replyText = assistantReplies["Who sells eggs?"];
          matchedProducts = [products.find((p) => p.id === 'p-12')].filter(Boolean);
        } else if (lower.includes('hour') || lower.includes('close') || lower.includes('time') || lower.includes('open')) {
          replyText = assistantReplies["When does Elm Street close?"];
        } else {
          replyText = assistantReplies.default;
        }
      } else {
        if (text === "What's fresh on Saturday?") {
          matchedProducts = [products.find((p) => p.id === 'p-01'), products.find((p) => p.id === 'p-02')].filter(Boolean);
        } else if (text === "Who sells eggs?") {
          matchedProducts = [products.find((p) => p.id === 'p-12')].filter(Boolean);
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: replyText,
          products: matchedProducts,
          time: 'Just now',
        },
      ]);
      setIsTyping(false);
    }, 600);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <div className={`${styles.container} ${!inSheet ? styles.standalone : ''}`}>
      {/* Standalone fallback header */}
      {!inSheet && (
        <div className={styles.fallbackHeader}>
          <button type="button" className={styles.backButton} onClick={onClose}>
            <ArrowLeft size={20} aria-hidden="true" />
            <span>Back to market</span>
          </button>
        </div>
      )}

      {/* Sheet Title */}
      <div className={styles.sheetHeader}>
        <div className={styles.titleGroup}>
          <div className={styles.sparkleCircle}>
            <Sparkles size={20} className={styles.sparkleIcon} aria-hidden="true" />
          </div>
          <div>
            <h2 className={styles.title}>Ask MarketLink</h2>
            <span className={styles.subtitle}>Your Saturday market guide</span>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className={styles.messagesArea} role="log" aria-live="polite">
        <div className={styles.dateSeparator} aria-hidden="true">
          <span>Today</span>
        </div>

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.messageWrapper} ${msg.sender === 'user' ? styles.userWrapper : styles.assistantWrapper}`}
          >
            <div
              className={`${styles.bubble} ${msg.sender === 'user' ? styles.userBubble : styles.assistantBubble}`}
            >
              <p className={styles.messageText}>{msg.text}</p>
              {msg.products && msg.products.length > 0 && (
                <div className={styles.productRow}>
                  {msg.products.map((p) => (
                    <ProductCard key={p.id} product={p} variant="compact" />
                  ))}
                </div>
              )}
            </div>
            <span className={styles.timestamp}>{msg.time}</span>
          </div>
        ))}

        {isTyping && (
          <div className={`${styles.messageWrapper} ${styles.assistantWrapper}`}>
            <div className={`${styles.bubble} ${styles.assistantBubble} ${styles.typingBubble}`}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts row (shown only on first empty prompt) */}
      {messages.length <= 1 && (
        <div className={styles.suggestionsRow} aria-label="Suggested questions">
          {SUGGESTIONS.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              className={styles.suggestionChip}
              onClick={() => handleSendMessage(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Message Input Bar */}
      <form className={styles.inputBar} onSubmit={handleSubmit}>
        <input
          type="text"
          className={styles.textInput}
          placeholder="Ask about stalls, items, or pickup..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          enterKeyHint="send"
          aria-label="Type your message"
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={!inputValue.trim()}
          aria-label="Send message"
        >
          <Send size={18} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}

export default Assistant;
