import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, Store, Leaf, Receipt, MapPin } from 'lucide-react';
import { streamAssistantMessage, sendAssistantMessage } from '@/api/assistant';
import Page from '@/components/layout/Page';
import PageTitle from '@/components/layout/PageTitle';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './Assistant.module.css';

const SUGGESTED_PROMPTS = [
  'What time does the market open?',
  'Who has eggs this Saturday?',
  'When can I collect order MK-2049?',
];

function getChipIcon(type) {
  switch (type) {
    case 'stall':
    case 'farmer':
      return Store;
    case 'produce':
    case 'product':
      return Leaf;
    case 'order':
      return Receipt;
    case 'market':
    default:
      return MapPin;
  }
}

function getChipPath(type, id) {
  switch (type) {
    case 'stall':
    case 'farmer':
      return `/buyer/stalls/${id}`;
    case 'produce':
    case 'product':
      return `/buyer/products/${id}`;
    case 'order':
      return `/buyer/orders/${id}`;
    case 'market':
    default:
      return `/buyer/markets/${id}`;
  }
}

export function Assistant() {
  useDocumentTitle('Ask MarketLink · MarketLink');

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastFailedText, setLastFailedText] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSend = async (rawText) => {
    const text = (rawText || inputValue).trim();
    if (!text || isTyping) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
    };

    const asstMsgId = `asst-${Date.now()}`;
    const initialAsstMsg = {
      id: asstMsgId,
      sender: 'assistant',
      text: '',
      chips: [],
      streaming: true,
    };

    setMessages((prev) => [...prev, userMsg, initialAsstMsg]);
    setInputValue('');
    setIsTyping(true);
    setLastFailedText(null);

    // Build history for backend
    const historyPayload = messages
      .filter((m) => !m.error)
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }));

    let accumulatedText = '';

    try {
      // Try streaming with fallback to sendAssistantMessage
      let res;
      try {
        res = await streamAssistantMessage(
          text,
          historyPayload,
          {
            onChunk: (chunk) => {
              accumulatedText += chunk;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === asstMsgId ? { ...m, text: accumulatedText } : m
                )
              );
            },
            signal: controller.signal,
          }
        );
      } catch {
        res = await sendAssistantMessage(text, historyPayload, controller.signal);
      }

      const replyText = res?.reply || accumulatedText || 'I have checked the market schedule and stock for you.';
      const cards = res?.cards || [];

      // Build navigation chips from structured cards or parsed mentions
      const chips = [];
      cards.forEach((c) => {
        const type = c.type === 'farmer' ? 'stall' : c.type;
        chips.push({
          type,
          id: c.id,
          label: c.name || c.title || c.stallName || `View ${type}`,
          path: getChipPath(type, c.id),
        });
      });

      // Also parse any [product:id], [stall:id], [farmer:id], [market:id] in reply
      const entityRegex = /\[(product|farmer|stall|market|order):([a-zA-Z0-9_-]+)\]/g;
      let match;
      while ((match = entityRegex.exec(replyText)) !== null) {
        const rawType = match[1];
        const id = match[2];
        const type = rawType === 'farmer' ? 'stall' : rawType;
        if (!chips.some((ch) => ch.id === id)) {
          chips.push({
            type,
            id,
            label: `View ${type}`,
            path: getChipPath(type, id),
          });
        }
      }

      // Clean stripped text if any tokens remained
      const cleanReply = replyText.replace(/\[(product|farmer|stall|market|order):([a-zA-Z0-9_-]+)\]/g, '').trim();

      setMessages((prev) =>
        prev.map((m) =>
          m.id === asstMsgId
            ? {
                ...m,
                text: cleanReply,
                chips,
                streaming: false,
              }
            : m
        )
      );
    } catch (err) {
      if (err.name !== 'AbortError') {
        setLastFailedText(text);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstMsgId
              ? {
                  ...m,
                  error: true,
                  text: 'I could not reach the market data just now.',
                  streaming: false,
                }
              : m
          )
        );
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedText) {
      handleSend(lastFailedText);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  const hasUserMessages = messages.some((m) => m.sender === 'user');

  return (
    <Page width="read">
      <PageTitle
        title="Ask MarketLink"
        context="Market times, what is in stock, where a stall is."
        backTo="/buyer"
        backLabel="Back to today"
      />

      <div className={styles.container}>
        <div className={styles.messagesArea} role="log" aria-live="polite">
          {/* Welcome Message */}
          <div className={`${styles.messageWrapper} ${styles.assistantWrapper}`}>
            <div className={`${styles.bubble} ${styles.assistantBubble}`}>
              <p className={styles.messageText}>
                Hello. I can answer questions about market opening times, what produce is in stock, or where to find specific stalls.
              </p>
            </div>
          </div>

          {/* Suggested Prompts when conversation is fresh */}
          {!hasUserMessages && (
            <div className={styles.suggestionsBlock}>
              <h2 className={styles.suggestionsHeading}>Try asking</h2>
              <div className={styles.suggestionsList}>
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className={styles.promptBtn}
                    onClick={() => handleSend(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversation history */}
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            if (msg.error) {
              return (
                <div key={msg.id} className={`${styles.messageWrapper} ${styles.assistantWrapper}`}>
                  <div className={styles.failureBubble}>
                    <p className={styles.failureText}>{msg.text}</p>
                    <button type="button" className={styles.retryBtn} onClick={handleRetry}>
                      Retry
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`${styles.messageWrapper} ${isUser ? styles.userWrapper : styles.assistantWrapper}`}
              >
                <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.assistantBubble}`}>
                  {msg.streaming && !msg.text ? (
                    <div className={styles.typingBubble} aria-label="Thinking">
                      <span className={styles.dot} />
                      <span className={styles.dot} />
                      <span className={styles.dot} />
                    </div>
                  ) : (
                    <p className={styles.messageText}>{msg.text}</p>
                  )}
                </div>

                {/* Navigation Chips under assistant messages */}
                {!isUser && msg.chips && msg.chips.length > 0 && (
                  <div className={styles.chipsRow} aria-label="Related links">
                    {msg.chips.map((chip) => {
                      const Icon = getChipIcon(chip.type);
                      return (
                        <Link key={chip.path} to={chip.path} className={styles.chipLink}>
                          <Icon size={12} aria-hidden="true" />
                          <span>{chip.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Sticky Composer */}
        <form className={styles.composerForm} onSubmit={handleSubmit}>
          <div className={styles.inputWrapper}>
            <input
              ref={inputRef}
              type="text"
              className={styles.input}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about the market…"
              disabled={isTyping}
            />
          </div>
          <button
            type="submit"
            className={styles.sendBtn}
            disabled={!inputValue.trim() || isTyping}
          >
            <span>Send</span>
            <Send size={14} strokeWidth={2} aria-hidden="true" />
          </button>
        </form>
      </div>
    </Page>
  );
}

export default Assistant;
