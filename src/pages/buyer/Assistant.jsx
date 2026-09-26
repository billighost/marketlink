<<<<<<< HEAD
import React, { useState, useRef, useEffect } from 'react';import { Send, Sparkles, ArrowLeft } from 'lucide-react';import { sendAssistantMessage } from '@/api/assistant';import { getProductDetail } from '@/api/catalog';import { useAuth } from '@/context/AuthContext';import ProductCard from '@/components/domain/ProductCard';import styles from './Assistant.module.css';const DEFAULT_SUGGESTIONS = [  "What's fresh on Saturday?",  "Who sells eggs?",  "When does Elm Street close?",];export function Assistant({ inSheet = true, onClose }) {  const { user } = useAuth();  const displayName = user?.firstName || 'there';  const [messages, setMessages] = useState([    {      id: 'msg-welcome',      sender: 'assistant',      text: `Good day, ${displayName}. I'm here to help you shop this Saturday. Ask me what's fresh, where to find specific harvests, or about market hours.`,      time: 'Just now',    },  ]);  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);  const [inputValue, setInputValue] = useState('');  const [isTyping, setIsTyping] = useState(false);  const messagesEndRef = useRef(null);  const scrollToBottom = () => {    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });  };  useEffect(() => {    scrollToBottom();  }, [messages, isTyping]);  const handleSendMessage = async (textToSend) => {    const text = (textToSend || inputValue).trim();    if (!text || isTyping) return;    const userMessage = {      id: `user-${Date.now()}`,      sender: 'user',      text,      time: 'Just now',    };    const newMessages = [...messages, userMessage];    setMessages(newMessages);    setInputValue('');    setIsTyping(true);    try {      const history = messages        .filter((m) => m.id !== 'msg-welcome')        .slice(-4)        .map((m) => ({          role: m.sender === 'user' ? 'user' : 'assistant',          content: m.text,        }));      const res = await sendAssistantMessage(text, history);      let loadedProducts = [];      if (res?.cards && Array.isArray(res.cards)) {        const productCards = res.cards.filter((c) => c.type === 'product' && c.id);        const resolved = await Promise.all(          productCards.map((c) => getProductDetail(c.id).catch(() => null))        );        loadedProducts = resolved.filter(Boolean);      }      setMessages((prev) => [        ...prev,        {          id: `assistant-${Date.now()}`,          sender: 'assistant',          text: res?.reply || "I'm here to help with market schedules, produce prices, and order tracking.",          products: loadedProducts,          time: 'Just now',        },      ]);      if (res?.suggestions && Array.isArray(res.suggestions) && res.suggestions.length > 0) {        setSuggestions(res.suggestions);      }    } catch {      setMessages((prev) => [        ...prev,        {          id: `assistant-${Date.now()}`,          sender: 'assistant',          text: "I'm having a little trouble looking that up right now, but I'm here to help with market schedules, produce prices, and order tracking.",          time: 'Just now',        },      ]);    } finally {      setIsTyping(false);    }  };  const handleSubmit = (e) => {    e.preventDefault();    handleSendMessage();  };  return (    <div className={`${styles.container} ${!inSheet ? styles.standalone : ''}`}>      {}      {!inSheet && (        <div className={styles.fallbackHeader}>          <button type="button" className={styles.backButton} onClick={onClose}>            <ArrowLeft size={20} aria-hidden="true" />            <span>Back to market</span>          </button>        </div>      )}      {}      <div className={styles.sheetHeader}>        <div className={styles.titleGroup}>          <div className={styles.sparkleCircle}>            <Sparkles size={20} className={styles.sparkleIcon} aria-hidden="true" />          </div>          <div>            <h2 className={styles.title}>Ask MarketLink</h2>            <span className={styles.subtitle}>Your Saturday market guide</span>          </div>        </div>      </div>      {}      <div className={styles.messagesArea} role="log" aria-live="polite">        <div className={styles.dateSeparator} aria-hidden="true">          <span>Today</span>        </div>        {messages.map((msg) => (          <div            key={msg.id}            className={`${styles.messageWrapper} ${msg.sender === 'user' ? styles.userWrapper : styles.assistantWrapper}`}          >            <div              className={`${styles.bubble} ${msg.sender === 'user' ? styles.userBubble : styles.assistantBubble}`}            >              <p className={styles.messageText}>{msg.text}</p>              {msg.products && msg.products.length > 0 && (                <div className={styles.productRow}>                  {msg.products.map((p) => (                    <ProductCard key={p.id} product={p} variant="compact" />                  ))}                </div>              )}            </div>            <span className={styles.timestamp}>{msg.time}</span>          </div>        ))}        {isTyping && (          <div className={`${styles.messageWrapper} ${styles.assistantWrapper}`}>            <div className={`${styles.bubble} ${styles.assistantBubble} ${styles.typingBubble}`}>              <span className={styles.dot} />              <span className={styles.dot} />              <span className={styles.dot} />            </div>          </div>        )}        <div ref={messagesEndRef} />      </div>      {}      {suggestions.length > 0 && (        <div className={styles.suggestionsRow} aria-label="Suggested questions">          {suggestions.map((suggestion, idx) => (            <button              key={idx}              type="button"              className={styles.suggestionChip}              onClick={() => handleSendMessage(suggestion)}            >              {suggestion}            </button>          ))}        </div>      )}      {}      <form className={styles.inputBar} onSubmit={handleSubmit}>        <input          type="text"          className={styles.textInput}          placeholder="Ask about stalls, items, or pickup..."          value={inputValue}          onChange={(e) => setInputValue(e.target.value)}          enterKeyHint="send"          aria-label="Type your message"          maxLength={300}        />        <button          type="submit"          className={styles.sendButton}          disabled={!inputValue.trim() || isTyping}          aria-label="Send message"        >          <Send size={18} aria-hidden="true" />        </button>      </form>    </div>  );}export default Assistant;
=======
import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, ArrowLeft } from 'lucide-react';
import { streamAssistantMessage } from '@/api/assistant';
import { getProductDetail } from '@/api/catalog';
import { useAuth } from '@/context/AuthContext';
import ProductCard from '@/components/domain/ProductCard';
import styles from './Assistant.module.css';

const DEFAULT_SUGGESTIONS = [
  "What's fresh on Saturday?",
  "Who sells eggs?",
  "When does Elm Street close?",
];

/**
 * Assistant chat sheet ("Ask MarketLink").
 * Connected to live backend POST /assistant/message with fast token streaming.
 */
export function Assistant({ inSheet = true, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.firstName || 'there';

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

    const assistantMsgId = `assistant-${Date.now()}`;
    const assistantPlaceholder = {
      id: assistantMsgId,
      sender: 'assistant',
      text: '', // Empty text initially triggers typing dots inside the bubble
      streaming: true,
      time: 'Just now',
    };

    const newMessages = [...messages, userMessage, assistantPlaceholder];
    setMessages(newMessages);
    setInputValue('');
    setIsTyping(true);

    try {
      // Build lightweight recent history (last 4 turns)
      const history = messages
        .filter((m) => m.id !== 'msg-welcome' && m.text)
        .slice(-4)
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        }));

      let accumulatedText = '';
      const res = await streamAssistantMessage(text, history, {
        signal: abortController.signal,
        onChunk: (chunk) => {
          accumulatedText += chunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, text: accumulatedText } : msg
            )
          );
        },
      });

      // Load product cards if returned
      let loadedProducts = [];
      const cards = res?.cards || [];
      if (Array.isArray(cards)) {
        const productCards = cards.filter((c) => c.type === 'product' && c.id);
        const resolved = await Promise.all(
          productCards.map((c) => getProductDetail(c.id).catch(() => null))
        );
        loadedProducts = resolved.filter(Boolean);
      }

      const finalText = res?.reply || accumulatedText || "I'm here to help with market schedules, produce prices, and order tracking.";

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                text: finalText,
                streaming: false,
                products: loadedProducts,
              }
            : msg
        )
      );

      if (res?.suggestions && Array.isArray(res.suggestions) && res.suggestions.length > 0) {
        setSuggestions(res.suggestions);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return; // User navigated away or started a new query
      }

      let errorText = "I'm having a little trouble looking that up right now, but I'm here to help with market schedules, produce prices, and order tracking.";
      if (err.status === 503 || err.code === 'ASSISTANT_BUSY') {
        errorText = "The assistant is busy. Try again in a moment.";
      } else if (!navigator.onLine || err.message?.includes('Failed to fetch')) {
        errorText = "Unable to connect. Please check your internet connection.";
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                text: errorText,
                streaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsTyping(false);
      activeAbortControllerRef.current = null;
    }
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
              {/* Action cards — Smart Basket CTA */}
              {msg.actionCards && msg.actionCards.length > 0 && (
                <div className={styles.actionCards}>
                  {msg.actionCards.map((card, i) => (
                    <button
                      key={i}
                      type="button"
                      className={styles.actionCardBtn}
                      onClick={() => {
                        if (card.action === 'open-smart-basket') {
                          navigate('/buyer/smart-basket', {
                            state: { smartBasket: card.params || {} },
                          });
                        }
                      }}
                      aria-label={card.label || 'Open Smart Basket'}
                    >
                      <ShoppingBasket size={14} aria-hidden="true" />
                      {card.label || 'Build Smart Basket'}
                    </button>
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
  );
}

export default Assistant;
>>>>>>> bc73418815cde522512fe21a2af884eee3163165
