import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, Sparkles, AlertCircle, Store, Leaf, Receipt, MapPin } from 'lucide-react';
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
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

    // Snapshot history before this exchange is appended to state.
    const historyPayload = messages
      .filter((m) => !m.error)
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }));

    setMessages((prev) => [...prev, userMsg, initialAsstMsg]);
    setInputValue('');
    setIsTyping(true);
    setLastFailedText(null);

    let accumulatedText = '';

    try {
      let res;
      try {
        res = await streamAssistantMessage(text, historyPayload, {
          onChunk: (chunk) => {
            accumulatedText += chunk;
            setMessages((prev) =>
              prev.map((m) => (m.id === asstMsgId ? { ...m, text: accumulatedText } : m))
            );
          },
          signal: controller.signal,
        });
      } catch {
        res = await sendAssistantMessage(text, historyPayload, controller.signal);
      }

      const replyText =
        res?.reply || accumulatedText || 'I have checked the market schedule and stock for you.';
      const cards = res?.cards || [];

      // Build navigation chips from structured cards, then from any
      // [product:id] / [stall:id] / [farmer:id] / [market:id] / [order:id]
      // tokens left in the reply text. Dedupe on type+id, not id alone,
      // since ids are only unique within their own type.
      const chipMap = new Map();

      cards.forEach((c) => {
        const type = c.type === 'farmer' ? 'stall' : c.type;
        const key = `${type}:${c.id}`;
        if (!chipMap.has(key)) {
          chipMap.set(key, {
            type,
            id: c.id,
            label: c.name || c.title || c.stallName || `View ${type}`,
            path: getChipPath(type, c.id),
          });
        }
      });

      const entityRegex = /\[(product|farmer|stall|market|order):([a-zA-Z0-9_-]+)\]/g;
      let match;
      while ((match = entityRegex.exec(replyText)) !== null) {
        const rawType = match[1];
        const id = match[2];
        const type = rawType === 'farmer' ? 'stall' : rawType;
        const key = `${type}:${id}`;
        if (!chipMap.has(key)) {
          chipMap.set(key, {
            type,
            id,
            label: `View ${type}`,
            path: getChipPath(type, id),
          });
        }
      }

      const cleanReply = replyText
        .replace(/\[(product|farmer|stall|market|order):([a-zA-Z0-9_-]+)\]/g, '')
        .trim();

      setMessages((prev) =>
        prev.map((m) =>
          m.id === asstMsgId
            ? {
                ...m,
                text: cleanReply,
                chips: Array.from(chipMap.values()),
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

      <div className={styles.chatShell}>
        {!hasUserMessages ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon} aria-hidden="true">
              <Sparkles size={20} strokeWidth={1.75} />
            </div>
            <p className={styles.emptyText}>
              Ask about opening times, what is in stock, or where to find a stall.
            </p>
            <div className={styles.suggestionsList}>
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className={styles.promptChip}
                  onClick={() => handleSend(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.messageList} role="log" aria-live="polite">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';

              if (msg.error) {
                return (
                  <div key={msg.id} className={`${styles.messageWrapper} ${styles.assistantWrapper}`}>
                    <div className={styles.failureBubble}>
                      <AlertCircle size={16} strokeWidth={1.75} className={styles.failureIcon} aria-hidden="true" />
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
                      <p className={styles.messageText}>
                        {msg.text}
                        {msg.streaming && msg.text && <span className={styles.cursor} aria-hidden="true" />}
                      </p>
                    )}
                  </div>

                  {!isUser && msg.chips && msg.chips.length > 0 && (
                    <div className={styles.chipsRow} aria-label="Related links">
                      {msg.chips.map((chip) => {
                        const Icon = getChipIcon(chip.type);
                        return (
                          <Link key={`${chip.type}-${chip.id}`} to={chip.path} className={styles.chipLink}>
                            <Icon size={12} strokeWidth={1.75} aria-hidden="true" />
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
        )}

        <form className={styles.composer} onSubmit={handleSubmit}>
          <div className={styles.inputBar}>
            <input
              ref={inputRef}
              type="text"
              className={styles.input}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about the market…"
              disabled={isTyping}
              aria-label="Message"
            />
            <button
              type="submit"
              className={styles.sendBtn}
              disabled={!inputValue.trim() || isTyping}
              aria-label="Send message"
            >
              <ArrowUp size={18} strokeWidth={2.25} aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
    </Page>
  );
}

export default Assistant;