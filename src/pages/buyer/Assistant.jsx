import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { streamAssistantMessage } from '@/api/assistant';
import { getProductDetail } from '@/api/catalog';
import { useAuth } from '@/context/AuthContext';
import ProductCard from '@/components/domain/ProductCard';
import Page from '@/components/layout/Page';
import PageTitle from '@/components/layout/PageTitle';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './Assistant.module.css';

const DEFAULT_SUGGESTIONS = [
  "What's fresh on Saturday?",
  "Who sells eggs?",
  "When does Elm Street close?",
];

/**
 * Assistant chat page ("Ask MarketLink").
 * Connected to live backend POST /assistant/message with fast token streaming.
 */
export function Assistant() {
  const { user } = useAuth();
  const displayName = user?.firstName || 'there';

  useDocumentTitle('Ask MarketLink · MarketLink');

  const [messages, setMessages] = useState([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `Good day, ${displayName}. I'm here to help you shop this Saturday. Ask me what's fresh, where to find specific harvests, or about market hours.`,
      time: 'Just now',
    },
  ]);
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const activeAbortControllerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Clean up any ongoing streaming request on unmount
  useEffect(() => {
    return () => {
      if (activeAbortControllerRef.current) {
        activeAbortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isTyping) return;

    // Abort previous in-flight request if any
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    activeAbortControllerRef.current = abortController;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      time: 'Just now',
    };

    const assistantMsgId = `asst-${Date.now()}`;
    const initialAssistantMessage = {
      id: assistantMsgId,
      sender: 'assistant',
      text: '',
      time: 'Just now',
      streaming: true,
      products: [],
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
    setInputValue('');
    setIsTyping(true);

    let accumulatedText = '';

    try {
      await streamAssistantMessage(
        text,
        (token) => {
          accumulatedText += token;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, text: accumulatedText } : msg
            )
          );
        },
        abortController.signal
      );

      // Extract referenced product tags like [product:id]
      const productMatches = [...accumulatedText.matchAll(/\[product:([a-zA-Z0-9_-]+)\]/g)];
      if (productMatches.length > 0) {
        const productIds = [...new Set(productMatches.map((m) => m[1]))];
        const loadedProducts = await Promise.all(
          productIds.map(async (pId) => {
            try {
              return await getProductDetail(pId, abortController.signal);
            } catch {
              return null;
            }
          })
        );
        const validProducts = loadedProducts.filter(Boolean);

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, products: validProducts } : msg
          )
        );
      }

      // Remove streaming flag
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId ? { ...msg, streaming: false } : msg
        )
      );

      // Rotate suggestions after response
      setSuggestions([
        'Where is organic honey?',
        'Tell me about Riverbend Farm',
        'Can I pay with card?',
      ]);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  text: 'Sorry, I had trouble reaching the market. Please ask again.',
                  streaming: false,
                }
              : msg
          )
        );
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <Page width="read">
      <PageTitle
        title="Ask MarketLink"
        context="Your Saturday market guide"
        backTo="/buyer"
        backLabel="Back to today"
      />
      <div className={styles.container}>
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
                {msg.streaming && !msg.text ? (
                  <div className={styles.typingBubble}>
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                  </div>
                ) : (
                  <p className={styles.messageText}>{msg.text}</p>
                )}
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

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested prompts row */}
        {suggestions.length > 0 && (
          <div className={styles.suggestionsRow} aria-label="Suggested questions">
            {suggestions.map((suggestion, idx) => (
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
            maxLength={300}
          />
          <button
            type="submit"
            className={styles.sendButton}
            disabled={!inputValue.trim() || isTyping}
            aria-label="Send message"
          >
            <Send size={18} aria-hidden="true" />
          </button>
        </form>
      </div>
    </Page>
  );
}

export default Assistant;
