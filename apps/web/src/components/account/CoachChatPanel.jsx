import { useEffect, useRef, useState, useCallback } from 'react';
import {
  COACH_NAME,
  COACH_STARTERS,
} from '@recharge/shared/coachPersona';
import {
  fetchCoachConversationMessages,
  fetchCoachStatus,
  sendCoachMessage,
  startCoachConversation,
} from '../../services/api.js';
import Button from '../shared/Button.jsx';
import { formatDate } from '../../lib/formatDate.js';
import { useRefreshOnFocus } from '../../hooks/useRefreshOnFocus.js';

export default function CoachChatPanel({ getAccessToken }) {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [input, setInput] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const bottomRef = useRef(null);

  const loadStatus = useCallback(async () => {
    setError(null);
    try {
      const token = await getAccessToken();
      const data = await fetchCoachStatus(token);
      setStatus(data);
      setSelectedSessionId(data.activeSessionId || data.assessments?.[0]?.sessionId || '');
      const liveId = data.conversation?.id;
      const archivedId = (data.conversations ?? []).find((c) => c.archived)?.id;
      setSelectedConversationId(liveId || archivedId || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useRefreshOnFocus(loadStatus, true);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [status?.messages?.length, sending]);

  const handleStart = async () => {
    setStarting(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const data = await startCoachConversation(token, selectedSessionId || null);
      setStatus((prev) => ({
        ...data,
        conversations: data.conversations ?? prev?.conversations ?? [],
      }));
      setSelectedConversationId(data.conversation?.id || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setStarting(false);
    }
  };

  const handleContinueConversation = async () => {
    if (!selectedConversationId) return;
    setStarting(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const data = await fetchCoachConversationMessages(token, selectedConversationId);
      setStatus((prev) =>
        prev
          ? {
              ...prev,
              conversation: data.conversation,
              messages: data.messages,
            }
          : prev,
      );
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

  const coachName = status?.coachName || COACH_NAME;

  if (loading) {
    return (
      <div className="glass-card p-gutter text-center">
        <p className="font-sans text-body-md text-on-surface-variant">
          Opening chat with {coachName}…
        </p>
      </div>
    );
  }

  if (!status?.hasAssessment) {
    return (
      <div className="glass-card space-y-4 p-gutter text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-fern-tint text-2xl">
          🌿
        </div>
        <h3 className="font-display text-headline-md text-primary">Meet {coachName}</h3>
        <p className="font-sans text-body-md text-on-surface-variant">
          {coachName} is your private wellbeing coach. Save an assessment to your account first,
          then she uses your personality, burnout pattern, and recovery preferences to talk with you.
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
  const conversationOptions = status.conversations ?? [];

  return (
    <div className="space-y-4">
      <div className="glass-card space-y-4 p-gutter">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="card-eyebrow">Private coach</p>
            <h3 className="font-display text-headline-md text-primary">Talk to {coachName}</h3>
            <p className="mt-1 font-sans text-body-md text-on-surface-variant">
              A calm ear and practical tips shaped by your saved check-ins. {coachName} is not a
              therapist, doctor, or crisis service.
            </p>
          </div>
          {conversation ? (
            <Button variant="secondary" size="sm" onClick={handleStart} disabled={starting}>
              {starting ? 'Starting…' : 'New chat'}
            </Button>
          ) : null}
        </div>

        {conversationOptions.length > 0 ? (
          <div className="space-y-2">
            <span className="field-label">Earlier chats</span>
            <div className="flex gap-2">
              <select
                className="field flex-1"
                value={selectedConversationId}
                onChange={(e) => setSelectedConversationId(e.target.value)}
              >
                {conversationOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.archived ? 'Archived · ' : ''}
                    {formatDate(c.updatedAt)} · {c.messageCount || 0} msgs
                    {c.lastMessageSnippet ? ` · ${c.lastMessageSnippet}` : ''}
                  </option>
                ))}
              </select>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleContinueConversation}
                disabled={starting || !selectedConversationId}
              >
                Open
              </Button>
            </div>
            <p className="font-sans text-label-sm text-on-surface-variant">
              Chats go quiet after a while. A new login starts a fresh thread. Open an earlier one
              if you want to pick it back up.
            </p>
          </div>
        ) : null}

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
            {conversationOptions.some((c) => c.archived)
              ? `Last chat is archived. Start a new one with ${coachName}, or open an earlier thread above.`
              : `Ready when you are. Start a new chat, or continue an old one from above.`}
          </p>
          <Button onClick={handleStart} disabled={starting}>
            {starting ? 'Connecting…' : `Start talking to ${coachName}`}
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
                        {coachName}
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
                  {coachName} is thinking…
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
