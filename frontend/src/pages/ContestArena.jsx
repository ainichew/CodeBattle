import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { socket } from '../socket';
import CodeEditor from '../components/CodeEditor';
import LivePreview from '../components/LivePreview';
import { MessageSquare, ThumbsUp, Send } from 'lucide-react';

function computeChangedLines(oldCode, newCode, tab) {
  const oldLines = (oldCode?.[tab] || '').split('\n');
  const newLines = (newCode?.[tab] || '').split('\n');
  const changed = [];
  const maxLen = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLen; i++) {
    if (oldLines[i] !== newLines[i]) changed.push(i + 1);
  }
  return changed;
}

export default function ContestArena() {
  const { contestId } = useParams();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');

  const [contest, setContest] = useState(null);
  const [error, setError] = useState(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [changedLinesMap, setChangedLinesMap] = useState({}); // { role: number[] }

  const prevCodesRef = useRef({});
  const tabsRef = useRef({});

  useEffect(() => {
    if (!role) { setError('No role specified in URL'); return; }
    if (!hasJoined) return;

    socket.emit('join_contest', { contestId, role, name: displayName || role });

    const handleStateUpdate = (state) => setContest(state);
    const handleError = (err) => setError(err.message);

    const handleCodeUpdate = ({ userId, code }) => {
      const prevCode = prevCodesRef.current[userId] || { html: '', css: '', js: '' };
      const activeTab = tabsRef.current[userId] || 'html';
      const lines = computeChangedLines(prevCode, code, activeTab);
      prevCodesRef.current[userId] = code;
      
      setChangedLinesMap(prev => ({ ...prev, [userId]: lines }));
      setContest(prev => {
        if (!prev) return prev;
        return { ...prev, code: { ...prev.code, [userId]: code } };
      });
    };

    const handleTimerUpdate = ({ timeRemaining }) => {
      setContest(prev => prev ? { ...prev, timeRemaining } : prev);
    };
    const handleVotesUpdate = (votes) => {
      setContest(prev => prev ? { ...prev, votes } : prev);
    };
    const handleNewComment = (msg) => {
      setContest(prev => prev ? { ...prev, chat: [...prev.chat, msg] } : prev);
    };
    const handleTabUpdate = ({ userId, tab }) => {
      tabsRef.current[userId] = tab;
      setContest(prev => {
        if (!prev) return prev;
        return { ...prev, tabs: { ...prev.tabs, [userId]: tab } };
      });
    };

    socket.on('contest_state', handleStateUpdate);
    socket.on('code_updated', handleCodeUpdate);
    socket.on('timer_update', handleTimerUpdate);
    socket.on('votes_updated', handleVotesUpdate);
    socket.on('new_comment', handleNewComment);
    socket.on('tab_updated', handleTabUpdate);
    socket.on('error', handleError);

    return () => {
      socket.off('contest_state', handleStateUpdate);
      socket.off('code_updated', handleCodeUpdate);
      socket.off('timer_update', handleTimerUpdate);
      socket.off('votes_updated', handleVotesUpdate);
      socket.off('new_comment', handleNewComment);
      socket.off('tab_updated', handleTabUpdate);
      socket.off('error', handleError);
    };
  }, [contestId, role, hasJoined, displayName]);

  if (error) return <div className="p-4 text-danger">{error}</div>;

  if (!hasJoined) {
    return (
      <div className="main-content" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel p-4 flex-col gap-4" style={{ width: '100%', maxWidth: '400px' }}>
          <h2 className="text-xl text-center text-gradient">Join Arena</h2>
          <div className="flex-col gap-2">
            <label className="text-sm text-muted">Display Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Alice"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setHasJoined(true)}
              autoFocus
            />
          </div>
          <button className="btn btn-primary mt-2" onClick={() => setHasJoined(true)}>
            Enter Arena
          </button>
        </div>
      </div>
    );
  }

  if (!contest) return <div className="p-4 text-center">Loading Arena...</div>;

  const winnerUser = contest.winner ? contest.users.find(u => u.id === contest.winner) : null;
  const mins = Math.floor(contest.timeRemaining / 60);
  const secs = (contest.timeRemaining % 60).toString().padStart(2, '0');
  const timerStr = contest.state === 'waiting' ? '—' : `${mins}:${secs}`;
  const timerExpired = contest.timeRemaining === 0 && contest.state !== 'waiting';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {winnerUser && (
        <div style={{
          background: 'linear-gradient(90deg, var(--success), #059669)',
          color: 'white', padding: '0.4rem', textAlign: 'center', fontWeight: 700, fontSize: '1rem'
        }}>
          🏆 Winner: <span style={{ textTransform: 'capitalize' }}>{winnerUser.name}</span> 🏆
        </div>
      )}

      {/* Header */}
      <header style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        padding: '0.6rem 2rem',
        borderBottom: '1px solid var(--panel-border)',
        flexShrink: 0,
      }}>
        {/* Left – empty */}
        <div />

        {/* Center – 3D CODE ARENA */}
        <div style={{ textAlign: 'center' }}>
          <span className="text-3d">Code Arena</span>
        </div>

        {/* Right – timer */}
        <div style={{ textAlign: 'right' }}>
          <span
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
              color: timerExpired ? 'var(--danger)' : 'var(--success)',
              transition: 'color 0.5s',
              letterSpacing: '0.05em',
            }}
          >
            {timerStr}
          </span>
        </div>
      </header>

      <div className="main-content" style={{ flexDirection: 'row', gap: '1rem', alignItems: 'stretch' }}>
        <div className="contest-grid" style={{ flex: 1, height: '100%', overflowY: 'auto' }}>
          {role.startsWith('contestant') && <ContestantView contest={contest} role={role} />}
          {role === 'judge' && <JudgeView contest={contest} changedLinesMap={changedLinesMap} />}
          {role === 'audience' && <AudienceView contest={contest} changedLinesMap={changedLinesMap} />}
        </div>

        {(role === 'audience' || role === 'judge') && (
          <div className="side-panel" style={{ height: '100%', overflowY: 'auto' }}>
            <ChatPanel contest={contest} role={role} />
            {role === 'audience' && <VotingSystem contest={contest} />}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Contestant View ──────────────────────────────────────────────── */
function ContestantView({ contest, role }) {
  const initialCode = contest.code[role] || { html: '', css: '', js: '' };
  const [localCode, setLocalCode] = useState(initialCode);
  const isFinished = contest.state === 'finished';

  useEffect(() => {
    if (!isFinished) socket.emit('update_code', { code: localCode });
  }, [localCode, isFinished]);

  const handleTabChange = (tab) => socket.emit('update_tab', { tab });

  return (
    <div className="flex-col gap-4" style={{ height: '100%', overflow: 'hidden' }}>
      <div className="flex-row justify-between glass-panel p-4" style={{ flexShrink: 0 }}>
        <h3>Your Editor</h3>
        {isFinished && (
          <span style={{ color: 'var(--danger)', fontWeight: 600 }}>⏱ Time's up — editing locked</span>
        )}
      </div>
      <div className="flex-row gap-4" style={{ flex: 1, minHeight: 0 }}>
        <div className="glass-panel p-4 flex-col gap-4" style={{ flex: 1, height: '100%', minHeight: 0 }}>
          <CodeEditor
            initialCode={initialCode}
            onCodeChange={setLocalCode}
            onTabChange={handleTabChange}
            readOnly={isFinished}
          />
        </div>
        <div className="glass-panel p-4 flex-col gap-4" style={{ flex: 1, height: '100%', minHeight: 0 }}>
          <h3>Live Preview</h3>
          <LivePreview code={localCode} />
        </div>
      </div>
    </div>
  );
}

/* ─── Judge View ───────────────────────────────────────────────────── */
function JudgeView({ contest, changedLinesMap }) {
  const [prompt, setPrompt] = useState(contest.prompt || '');
  const contestantsMap = new Map();
  contest.users.forEach(u => { if (u.role.startsWith('contestant')) contestantsMap.set(u.role, u); });
  const contestants = Array.from(contestantsMap.values()).sort((a, b) => a.role.localeCompare(b.role));

  const startContest = () => {
    socket.emit('update_prompt', { prompt });
    socket.emit('start_contest');
  };

  return (
    <div className="flex-col gap-4" style={{ height: '100%' }}>
      {contest.state === 'waiting' && (
        <div className="glass-panel p-4 flex-col gap-4">
          <h3>Set Contest Prompt</h3>
          <textarea
            className="input-field"
            rows={4}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe the coding challenge here..."
          />
          <button className="btn btn-primary" onClick={startContest}>Start Contest</button>
        </div>
      )}

      {contest.state !== 'waiting' && (
        <div className="glass-panel p-4 mb-4 flex-row justify-between">
          <div>
            <h3 style={{ display: 'inline' }}>Prompt: </h3>
            <span>{contest.prompt}</span>
          </div>
          {contest.state === 'finished' && !contest.winner && (
            <div className="flex-col gap-2">
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>Declare Winner:</span>
              <div className="flex-row gap-2">
                {contestants.map(c => (
                  <button
                    key={c.id}
                    className="btn btn-primary"
                    onClick={() => socket.emit('declare_winner', { winnerId: c.id })}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex-row gap-4" style={{ flex: 1, alignItems: 'stretch', minHeight: 0, overflowX: 'auto' }}>
        {contestants.map(c => (
          <div key={c.role} className="glass-panel p-4 flex-col gap-4" style={{ flex: '0 0 500px', height: '100%', minHeight: 0 }}>
            <h3>{c.name}</h3>
            <div className="flex-col" style={{ flex: 1, minHeight: 0, gap: '1rem' }}>
              <div style={{ flex: 1, minHeight: 0 }}>
                <CodeEditor
                  readOnly
                  initialCode={contest.code[c.role] || { html: '', css: '', js: '' }}
                  externalActiveTab={contest.tabs?.[c.role]}
                  changedLines={changedLinesMap[c.role] || []}
                />
              </div>
              <div className="flex-col" style={{ flex: 1, minHeight: 0 }}>
                <LivePreview code={contest.code[c.role] || { html: '', css: '', js: '' }} />
              </div>
            </div>
          </div>
        ))}
        {contestants.length === 0 && <p>Waiting for contestants to join...</p>}
      </div>
    </div>
  );
}

/* ─── Audience View ────────────────────────────────────────────────── */
function AudienceView({ contest, changedLinesMap }) {
  const contestantsMap = new Map();
  contest.users.forEach(u => { if (u.role.startsWith('contestant')) contestantsMap.set(u.role, u); });
  const contestants = Array.from(contestantsMap.values()).sort((a, b) => a.role.localeCompare(b.role));

  const statusMessage = () => {
    if (contest.state === 'waiting') return 'Waiting for the judge to start...';
    if (contest.state === 'finished' && !contest.winner) return '⏳ Judge is deciding the winner...';
    return null;
  };

  return (
    <div className="flex-col gap-4" style={{ height: '100%' }}>
      <div className="glass-panel p-4">
        {statusMessage() ? (
          <p className="text-muted text-sm" style={{ fontStyle: 'italic' }}>{statusMessage()}</p>
        ) : (
          <><h3 style={{ display: 'inline' }}>Prompt: </h3><span>{contest.prompt}</span></>
        )}
      </div>

      <div className="flex-row gap-4" style={{ flex: 1, alignItems: 'stretch', minHeight: 0, overflowX: 'auto' }}>
        {contestants.map(c => (
          <div key={c.role} className="glass-panel p-4 flex-col gap-4" style={{ flex: '0 0 500px', height: '100%', minHeight: 0 }}>
            <h3>{c.name}</h3>
            <div className="flex-col" style={{ flex: 1, minHeight: 0, gap: '1rem' }}>
              <div style={{ flex: 1, minHeight: 0 }}>
                <CodeEditor
                  readOnly
                  initialCode={contest.code[c.role] || { html: '', css: '', js: '' }}
                  externalActiveTab={contest.tabs?.[c.role]}
                  changedLines={changedLinesMap[c.role] || []}
                />
              </div>
              <div className="flex-col" style={{ flex: 1, minHeight: 0 }}>
                <LivePreview code={contest.code[c.role] || { html: '', css: '', js: '' }} />
              </div>
            </div>
          </div>
        ))}
        {contestants.length === 0 && <p>Waiting for contestants...</p>}
      </div>
    </div>
  );
}

/* ─── Chat Panel ───────────────────────────────────────────────────── */
function ChatPanel({ contest, role }) {
  const [text, setText] = useState('');
  const canChat = contest.settings.audienceCanChat || role !== 'audience';
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [contest.chat]);

  const send = () => {
    if (text.trim()) { socket.emit('send_comment', { text }); setText(''); }
  };

  return (
    <div className="glass-panel p-4 flex-col" style={{ flex: 1, minHeight: 0 }}>
      <h3 className="flex-row gap-2" style={{ position: 'sticky', top: 0, zIndex: 10, paddingBottom: '0.5rem' }}>
        <MessageSquare size={18} /> Live Chat
      </h3>
      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', margin: '0.75rem 0' }}>
        {contest.chat.map((c, i) => (
          <div key={i} className="mb-2 text-sm">
            <strong className="text-primary">{c.user}:</strong> {c.text}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      {canChat ? (
        <div className="flex-row gap-2">
          <input
            className="input-field"
            placeholder="Type a message..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
          />
          <button className="btn btn-primary" onClick={send}><Send size={16} /></button>
        </div>
      ) : (
        <div className="text-sm text-muted text-center">Chat is disabled for audience.</div>
      )}
    </div>
  );
}

/* ─── Voting System ────────────────────────────────────────────────── */
function VotingSystem({ contest }) {
  const contestantsMap = new Map();
  contest.users.forEach(u => { if (u.role.startsWith('contestant')) contestantsMap.set(u.role, u); });
  const contestants = Array.from(contestantsMap.values()).sort((a, b) => a.role.localeCompare(b.role));
  const [hasVotedFor, setHasVotedFor] = useState(null);
  const isFinished = contest.state === 'finished';

  if (!contest.settings.audienceCanVote) return null;

  const handleVote = (id) => {
    if (!isFinished) {
      if (hasVotedFor && hasVotedFor !== id) {
        socket.emit('uncast_vote', { votedFor: hasVotedFor });
      }
      setHasVotedFor(id);
      socket.emit('cast_vote', { votedFor: id });
    }
  };

  return (
    <div className="glass-panel p-4 flex-col gap-4">
      <h3 className="flex-row gap-2">
        <ThumbsUp size={18} /> Vote for Winner
        {isFinished && <span className="text-sm text-muted" style={{ fontWeight: 400 }}>&nbsp;(Voting closed)</span>}
      </h3>
      {contestants.map(c => (
        <button
          key={c.id}
          className={`btn flex-row justify-between ${hasVotedFor === c.id ? 'btn-primary' : ''}`}
          onClick={() => handleVote(c.id)}
          disabled={isFinished}
        >
          <span>{c.name}</span>
          <span className="font-bold">{contest.votes[c.id] || 0}</span>
        </button>
      ))}
      {contestants.length === 0 && <span className="text-muted text-sm">Waiting for contestants...</span>}
    </div>
  );
}
