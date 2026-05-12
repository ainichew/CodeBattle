import React, { useState } from 'react';
import { socket } from '../socket';
import { Settings, Users, Link as LinkIcon, Code2, ExternalLink } from 'lucide-react';

export default function LandingPage() {
  const [timeLimit, setTimeLimit] = useState(300); // 5 minutes
  const [audienceCanChat, setAudienceCanChat] = useState(true);
  const [audienceCanVote, setAudienceCanVote] = useState(true);
  const [contestId, setContestId] = useState(null);

  const createContest = () => {
    socket.emit('create_contest', {
      settings: {
        timeLimit: parseInt(timeLimit, 10),
        audienceCanChat,
        audienceCanVote,
        audienceCanMic: false
      }
    }, (response) => {
      setContestId(response.contestId);
    });
  };

  const getInviteLink = (role) => {
    return `${window.location.origin}/contest/${contestId}?role=${role}`;
  };

  const copyLink = (role) => {
    navigator.clipboard.writeText(getInviteLink(role));
  };

  return (
    <div className="main-content" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel p-4 animate-fade-in" style={{ width: '100%', maxWidth: '600px' }}>
        <h1 className="text-2xl text-gradient mb-4 flex-row gap-2" style={{ justifyContent: 'center' }}>
          <Code2 size={32} /> Code Battle Platform
        </h1>

        {!contestId ? (
          <div className="flex-col gap-4">
            <h2 className="text-lg">Contest Settings (Admin)</h2>
            
            <div className="flex-col gap-2">
              <label className="text-sm text-muted">Time Limit (Seconds)</label>
              <input 
                type="number" 
                className="input-field" 
                value={timeLimit} 
                onChange={(e) => setTimeLimit(e.target.value)} 
              />
            </div>

            <div className="flex-col gap-2 mt-4">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={audienceCanChat} 
                  onChange={(e) => setAudienceCanChat(e.target.checked)} 
                />
                Audience can Chat
              </label>

              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={audienceCanVote} 
                  onChange={(e) => setAudienceCanVote(e.target.checked)} 
                />
                Audience can Vote
              </label>
            </div>

            <button className="btn btn-primary mt-4" onClick={createContest}>
              <Settings size={20} /> Create Contest
            </button>
          </div>
        ) : (
          <div className="flex-col gap-4 animate-fade-in">
            <h2 className="text-lg text-success text-center">Contest Created Successfully!</h2>
            <p className="text-sm text-muted text-center">Share these unique links with the participants.</p>
            
            {['judge', 'contestant1', 'contestant2', 'audience'].map(role => (
              <div key={role} className="flex-row justify-between glass-panel p-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <span className="flex-row gap-2" style={{ textTransform: 'capitalize' }}>
                  <Users size={18} /> {role}
                </span>
                <div className="flex-row gap-2">
                  <button className="btn" onClick={() => copyLink(role)} title="Copy Link">
                    <LinkIcon size={16} />
                  </button>
                  <a
                    href={getInviteLink(role)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ textDecoration: 'none', padding: '0.4rem 0.6rem' }}
                    title={`Open ${role} link`}
                  >
                    <ExternalLink size={15} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
