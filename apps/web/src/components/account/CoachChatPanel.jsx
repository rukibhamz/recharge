import { useEffect, useRef, useState } from 'react';
import {
  COACH_NAME,
  COACH_STARTERS,
} from '@recharge/shared/coachPersona';
import {
  fetchCoachStatus,
  sendCoachMessage,
  startCoachConversation,
} from '../../services/api.js';
import Button from '../shared/Button.jsx';
import { formatDate } from '../../lib/formatDate.js';

export default function CoachChatPanel({ getAccessToken }) {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [input, setInput] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const bottomRef = useRef(null);

  const loadStatus = async () => {
    setError(null);
    try {
      const token = await getAccessToken();
      const data = await fetchCoachStatus(token);
      setStatus(data);
      setSelectedSessionId(data.activeSessionId || data.assessments?.[0]?.sessionId || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [getAccessToken]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [status?.messages?.length, sending]);

  const handleStart = async () => {
    setStarting(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const data = await startCoachConversation(token, selectedSessionId || null);
      setStatus(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setStarting(false);
    }
  };

  const handleSend = async (text) => {
    const content = String(text ?? input).trim();
    if (!content || sending) return;
    if (!status?.conversation?.id) {
      setError('Start a chat with Oma first.');
      return;
    }

    setSending(true);
    setError(null);
    setInput('');

    const optimisticUser = {
      id: `local-user-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setStatus((prev) =>
      prev
        ? { ...prev, messages: [...(prev.messages ?? []), optimisticUser] }
        : prev,
    );

    try {
      const token = await getAccessToken();
      const data = await sendCoachMessage(token, status.conversation.id, content);
      setStatus((prev) => {
        if (!prev) return prev;
        const withoutOptimistic = (prev.messages ?? []).filter((m) => m.id !== optimisticUser.id);
        return {
          ...prev,
          messages: [...withoutOptimistic, data.userMessage, data.assistantMessage],
        };
      });
    } catch (err) {
      setStatus((prev) =>
        prev
          ? {
              ...prev,
              messages: (prev.messages ?? []).filter((m) => m.id !== optimisticUser.id),
            }
          : prev,
      );
      setInput(content);
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-gutter text-center">
        <p className="font-sans text-body-md text-on-surface-variant">Opening chat with Oma…</p>
      </div>
    );
  }

  if (!status?.hasAssessment) {
    return (
      <div className="glass-card space-y-4 p-gutter text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-fern-tint text-2xl">
          🌿
        </div>
        <h3 className="font-display text-headline-md text-primary">Meet {COACH_NAME}</h3>
        <p className="font-sans text-body-md text-on-surface-variant">
          Oma is your private wellbeing coach. Save an assessment to your account first — she uses
          your personality, burnout pattern, and recovery preferences to talk with you.
        </p>
        {error ? (
          <p className="font-sans text-body-md text-severe" role="alert">
            {error}
          </p>
        ) : null}
        <Button onClick={() => { window.location.href = '/'; }}>Take assessment</Button>
      </div>
    );
  }

  const messages = status.messages ?? [];
  const conversation = status.conversation;

  return (
    <div className="space-y-4">
      <div className="glass-card space-y-4 p-gutter">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="card-eyebrow">Private coach</p>
            <h3 className="font-display text-headline-md text-primary">Talk with {COACH_NAME}</h3>
            <p className="mt-1 font-sans text-body-md text-on-surface-variant">
              Grounded conversation shaped by your saved check-ins — not therapy, just a calm ear
              and practical tips.
            </p>
          </div>
          {conversation ? (
            <Button variant="secondary" size="sm" onClick={handleStart} disabled={starting}>
              {starting ? 'Starting…' : 'New chat'}
            </Button>
          ) : null}
        </div>

        {status.assessments?.length > 1 ? (
          <label className="block">
            <span className="field-label">Assessment context</span>
            <select
              className="field"
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
            >
              {status.assessments.map((a) => (
                <option key={a.sessionId} value={a.sessionId}>
                  {formatDate(a.createdAt)} · {a.burnoutLevel || 'Check-in'} ·{' '}
                  {a.personalityName || 'Profile'}
                </option>
              ))}
            </select>
            {conversation ? (
              <p className="mt-1 font-sans text-label-sm text-on-surface-variant">
                Start a new chat to switch which assessment Oma uses.
              </p>
            ) : null}
          </label>
        ) : null}

        {error ? (
          <p className="font-sans text-body-md text-severe" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {!conversation ? (
        <div className="glass-card space-y-4 p-gutter text-center">
          <p className="font-sans text-body-md text-on-surface-variant">
            Ready when you are. Oma will open with your latest saved profile nearby.
          </p>
          <Button onClick={handleStart} disabled={starting}>
            {starting ? 'Connecting…' : `Start chatting with ${COACH_NAME}`}
          </Button>
        </div>
      ) : (
        <div className="glass-card flex min-h-[28rem] flex-col overflow-hidden">
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
            {messages.map((message) => {
              const isUser = message.role === 'user';
              return (
                <div
                  key={message.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 font-sans text-[14px] leading-relaxed ${
                      isUser
                        ? 'rounded-br-md bg-canopy text-white'
                        : 'rounded-bl-md bg-linen-sunken text-ink'
                    }`}
                  >
                    {!isUser ? (
                      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.06em] text-fern">
                        {COACH_NAME}
                      </p>
                    ) : null}
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              );
            })}
            {sending ? (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-linen-sunken px-4 py-3 font-sans text-[14px] text-ink-soft">
                  Oma is thinking…
                </div>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          {messages.length <= 1 ? (
            <div className="flex flex-wrap gap-2 border-t border-outline-variant/20 px-4 py-3">
              {COACH_STARTERS.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  disabled={sending}
                  onClick={() => handleSend(starter)}
                  className="rounded-full border border-outline-variant/40 bg-white px-3 py-1.5 font-sans text-label-sm text-on-surface-variant transition-colors hover:border-canopy/40 hover:text-canopy disabled:opacity-50"
                >
                  {starter}
                </button>
              ))}
            </div>
          ) : null}

          <form
            className="flex gap-2 border-t border-outline-variant/20 p-3 sm:p-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              className="field flex-1"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Share what is on your mind…"
              maxLength={2000}
              disabled={sending}
              aria-label="Message to Oma"
            />
            <Button type="submit" disabled={sending || !input.trim()}>
              Send
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
