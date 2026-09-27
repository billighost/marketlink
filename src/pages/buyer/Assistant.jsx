import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, Sparkles, AlertCircle, Store, Leaf, Receipt, MapPin } from 'lucide-react';
import { streamAssistantMessage, sendAssistantMessage } from '@/api/assistant';
import { getProductDetail, getFarmerDetail, getMarketDetail } from '@/api/catalog';
import ProductCard from '@/components/domain/ProductCard';
import FarmerCard from '@/components/domain/FarmerCard';
import MarketCard from '@/components/domain/MarketCard';
import Page from '@/components/layout/Page';
import PageTitle from '@/components/layout/PageTitle';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useSmartBasket } from '@/context/SmartBasketContext';
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

function AssistantEntityCard({ card }) {
  const [data, setData] = useState(card.data || null);
  const [loading, setLoading] = useState(!card.data && Boolean(card.id));
  const [error, setError] = useState(false);

  useEffect(() => {
    if (data || !card.id) return;
    let mounted = true;

    async function loadEntity() {
      try {
        setLoading(true);
        if (card.type === 'product' || card.type === 'produce') {
          const res = await getProductDetail(card.id);
          if (mounted) setData(res);
        } else if (card.type === 'farmer' || card.type === 'stall') {
          const res = await getFarmerDetail(card.id);
          if (mounted) setData(res);
        } else if (card.type === 'market') {
          const res = await getMarketDetail(card.id);
          if (mounted) setData(res);
        }
      } catch {
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadEntity();
    return () => {
      mounted = false;
    };
  }, [card.id, card.type, data]);

  if (loading) {
    return (
      <div className={styles.cardSkeleton} aria-label="Loading recommendation...">
        <div className={styles.skeletonMedia} />
        <div className={styles.skeletonBody}>
          <div className={styles.skeletonLineShort} />
          <div className={styles.skeletonLineFull} />
        </div>
      </div>
    );
  }

  const { openSmartBasket } = useSmartBasket();

  if (card.type === 'action' && card.action === 'open-smart-basket') {
    const budgetNum = card.params?.budget;
    const budgetLabel = budgetNum ? `₦${Number(budgetNum).toLocaleString()}` : 'your budget';

    return (
      <div className={styles.actionCard}>
        <div className={styles.actionCardHeader}>
          <div className={styles.actionIconBadge} aria-hidden="true">
            <Sparkles size={18} />
          </div>
          <div>
            <h4 className={styles.actionCardTitle}>{card.label || 'Build Smart Basket'}</h4>
            <p className={styles.actionCardSub}>
              Custom produce bundle curated within {budgetLabel} from real market inventory
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => openSmartBasket(card.params)}
          className={styles.actionCardBtn}
        >
          {card.label || 'Start Smart Basket'}
        </button>
      </div>
    );
  }

  if (error || !data) {
    const Icon = getChipIcon(card.type);
    return (
      <Link to={card.path || getChipPath(card.type, card.id)} className={styles.entityPillFallback}>
        <Icon size={14} className={styles.fallbackIcon} aria-hidden="true" />
        <span className={styles.fallbackLabel}>{card.label || `View ${card.type}`}</span>
      </Link>
    );
  }

  if (card.type === 'product' || card.type === 'produce') {
    return (
      <div className={styles.cardWrapper}>
        <ProductCard product={data} variant="compact" />
      </div>
    );
  }

  if (card.type === 'farmer' || card.type === 'stall') {
    return (
      <div className={styles.cardWrapper}>
        <FarmerCard farmer={data} variant={data.openToday !== undefined ? 'stall' : 'row'} />
      </div>
    );
  }

  if (card.type === 'market') {
    return (
      <div className={styles.marketCardWrapper}>
        <MarketCard market={data} />
      </div>
    );
  }

  const Icon = getChipIcon(card.type);
  return (
    <Link to={card.path || getChipPath(card.type, card.id)} className={styles.entityPillFallback}>
      <Icon size={14} className={styles.fallbackIcon} aria-hidden="true" />
      <span className={styles.fallbackLabel}>{card.label || `View ${card.type}`}</span>
    </Link>
  );
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
      cards: [],
      chips: [],
      suggestions: [],
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
      const rawCards = res?.cards || [];

      // Collect structured cards and text entity tags [type:id]
      const cardMap = new Map();

      rawCards.forEach((c) => {
        const type = c.type === 'farmer' ? 'stall' : c.type;
        const key = `${type}:${c.id || c.action || Math.random()}`;
        if (!cardMap.has(key)) {
          cardMap.set(key, {
            type,
            id: c.id,
            data: c.data || null,
            action: c.action,
            label: c.name || c.title || c.stallName || c.label || `View ${type}`,
            params: c.params,
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
        if (!cardMap.has(key)) {
          cardMap.set(key, {
            type,
            id,
            data: null,
            label: `View ${type}`,
            path: getChipPath(type, id),
          });
        }
      }

      const cleanReply = replyText
        .replace(/\[(product|farmer|stall|market|order):([a-zA-Z0-9_-]+)\]/g, '')
        .trim();

      const collectedCards = Array.from(cardMap.values());

      setMessages((prev) =>
        prev.map((m) =>
          m.id === asstMsgId
            ? {
                ...m,
                text: cleanReply,
                cards: collectedCards,
                chips: collectedCards,
                suggestions: res?.suggestions || [],
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

                  {/* Proper entity cards shelf */}
                  {!isUser && msg.cards && msg.cards.length > 0 && (
                    <div className={styles.cardsShelf} aria-label="Recommended items">
                      <div className={styles.cardsTrack}>
                        {msg.cards.map((card, cIdx) => (
                          <AssistantEntityCard
                            key={`${card.type}-${card.id || card.action || cIdx}`}
                            card={card}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contextual follow-up suggestions */}
                  {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
                    <div className={styles.followupSuggestions} aria-label="Suggested follow-up questions">
                      {msg.suggestions.map((suggestion, sIdx) => (
                        <button
                          key={`${sIdx}-${suggestion}`}
                          type="button"
                          className={styles.followupChip}
                          onClick={() => handleSend(suggestion)}
                          disabled={isTyping}
                        >
                          <Sparkles size={12} className={styles.followupIcon} aria-hidden="true" />
                          <span>{suggestion}</span>
                        </button>
                      ))}
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