import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageMotion } from '../components/PageMotion'
import { ScrollVelocity } from '../components/ScrollVelocity'
import { chatWithCoach, sessionToChatContext } from '../lib/pitchApi'
import {
  loadChatHistory,
  loadPitchSession,
  saveChatHistory,
  type ChatTurn,
  type PitchSessionStored,
} from '../lib/pitchSession'

export function CoachChat() {
  const navigate = useNavigate()
  const [session, setSession] = useState<PitchSessionStored | null>(null)
  const [messages, setMessages] = useState<ChatTurn[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const s = loadPitchSession()
    if (!s?.evaluation) {
      navigate('/app/session/setup', { replace: true })
      return
    }
    setSession(s)
    setMessages(loadChatHistory())
  }, [navigate])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function send() {
    const text = input.trim()
    if (!text || sending || !session) return
    setInput('')
    setSending(true)

    const nextMsgs: ChatTurn[] = [...messages, { role: 'user', content: text }]
    setMessages(nextMsgs)
    saveChatHistory(nextMsgs)

    try {
      const history = nextMsgs.slice(-21, -1).map((m) => ({ role: m.role, content: m.content }))
      const reply = await chatWithCoach({
        message: text,
        history,
        sessionContext: sessionToChatContext(session),
      })
      const withReply = [...nextMsgs, { role: 'assistant' as const, content: reply }]
      setMessages(withReply)
      saveChatHistory(withReply)
    } catch (e) {
      const err =
        e instanceof Error ? e.message : 'Chat failed. Is the API server running (port 3001)?'
      const withReply = [...nextMsgs, { role: 'assistant' as const, content: `Sorry — ${err}` }]
      setMessages(withReply)
      saveChatHistory(withReply)
    } finally {
      setSending(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  if (!session) {
    return (
      <PageMotion className="page page--app" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p className="setup-sub">Loading…</p>
      </PageMotion>
    )
  }

  return (
    <PageMotion className="page page--app">
      <div className="coach-chat-layout">
        <div className="page-scroll-marquee" aria-hidden>
          <ScrollVelocity
            texts={['AI Coach']}
            velocity={50}
            numCopies={8}
            className="coach__velocity-text"
            parallaxClassName="coach__velocity"
            scrollerClassName="coach__velocity-scroller"
          />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
          <p className="setup-sub" style={{ marginBottom: 0 }}>
            Coach chat · {session.evaluationLabel}
          </p>
          <Link to="/app/debrief" style={{ fontSize: 10, fontWeight: 600, color: 'var(--grey-600)' }}>
            ← Back to debrief
          </Link>
        </div>
        <p className="setup-sub" style={{ marginBottom: 8 }}>
          Each message includes your evaluation scores, audio metrics, and transcript—the same payload the coach API expects.
        </p>

        <div className="coach-chat-msgs">
          {messages.length === 0 && !sending && (
            <p className="setup-sub" style={{ textAlign: 'center', padding: 24 }}>
              Ask how to improve, request a practice plan, or dig into a category score.
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'coach-chat-bubble-user' : 'coach-chat-bubble-ai'}>
              {m.content}
            </div>
          ))}
          {sending && <div className="coach-chat-bubble-ai">Thinking…</div>}
          <div ref={endRef} />
        </div>

        <div className="coach-chat-input-row">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Message the coach…"
            rows={2}
            disabled={sending}
          />
          <button type="button" className="coach-chat-send" disabled={!input.trim() || sending} onClick={() => void send()}>
            Send
          </button>
        </div>
      </div>
    </PageMotion>
  )
}
