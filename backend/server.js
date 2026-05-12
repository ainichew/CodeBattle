const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// In-memory store
const contests = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create_contest', (data, callback) => {
    const contestId = Math.random().toString(36).substring(2, 8);
    contests[contestId] = {
      id: contestId,
      settings: data.settings || { timeLimit: 300, audienceCanMic: false, audienceCanChat: true, audienceCanVote: true },
      prompt: '',
      users: [],
      state: 'waiting', // waiting, active, finished
      winner: null,
      timeRemaining: data.settings?.timeLimit || 300,
      code: {}, // { userId: { html, css, js } }
      tabs: {}, // { userId: activeTab }
      votes: {}, // { contestantId: voteCount }
      chat: []
    };
    callback({ contestId });
  });

  socket.on('join_contest', ({ contestId, role, name }) => {
    const contest = contests[contestId];
    if (!contest) {
      return socket.emit('error', { message: 'Contest not found' });
    }

    socket.join(contestId);
    socket.contestId = contestId;
    socket.role = role;
    socket.name = name || role;

    contest.users.push({ id: socket.id, role, name: socket.name });
    
    // Initialize code for contestant
    if (role.startsWith('contestant') && !contest.code[role]) {
        contest.code[role] = { html: '', css: '', js: '' };
    }

    io.to(contestId).emit('contest_state', getPublicContestState(contestId));
  });

  socket.on('update_prompt', ({ prompt }) => {
    const contestId = socket.contestId;
    const contest = contests[contestId];
    if (contest && socket.role === 'judge') {
      contest.prompt = prompt;
      io.to(contestId).emit('contest_state', getPublicContestState(contestId));
    }
  });

  socket.on('update_code', ({ code }) => {
    const contestId = socket.contestId;
    const contest = contests[contestId];
    if (contest && socket.role.startsWith('contestant') && contest.state !== 'finished') {
      contest.code[socket.role] = code;
      io.to(contestId).emit('code_updated', { userId: socket.role, code });
    }
  });

  socket.on('update_tab', ({ tab }) => {
    const contestId = socket.contestId;
    const contest = contests[contestId];
    if (contest && socket.role.startsWith('contestant')) {
      contest.tabs[socket.role] = tab;
      io.to(contestId).emit('tab_updated', { userId: socket.role, tab });
    }
  });

  socket.on('start_contest', () => {
    const contestId = socket.contestId;
    const contest = contests[contestId];
    if (contest && socket.role === 'judge') {
      contest.state = 'active';
      io.to(contestId).emit('contest_started');
      io.to(contestId).emit('contest_state', getPublicContestState(contestId));
      
      contest.timerInterval = setInterval(() => {
        contest.timeRemaining--;
        io.to(contestId).emit('timer_update', { timeRemaining: contest.timeRemaining });
        if (contest.timeRemaining <= 0) {
          clearInterval(contest.timerInterval);
          contest.state = 'finished';
          io.to(contestId).emit('contest_ended');
          io.to(contestId).emit('contest_state', getPublicContestState(contestId));
        }
      }, 1000);
    }
  });

  socket.on('declare_winner', ({ winnerId }) => {
    const contestId = socket.contestId;
    const contest = contests[contestId];
    if (contest && socket.role === 'judge' && contest.state === 'finished') {
      contest.winner = winnerId;
      io.to(contestId).emit('contest_state', getPublicContestState(contestId));
    }
  });

  socket.on('send_comment', ({ text }) => {
    const contestId = socket.contestId;
    const contest = contests[contestId];
    if (contest && contest.settings.audienceCanChat) {
      const msg = { id: Date.now(), user: socket.name, text };
      contest.chat.push(msg);
      io.to(contestId).emit('new_comment', msg);
    }
  });

  socket.on('cast_vote', ({ votedFor }) => {
    const contestId = socket.contestId;
    const contest = contests[contestId];
    if (contest && contest.settings.audienceCanVote && socket.role === 'audience' && contest.state !== 'finished') {
      contest.votes[votedFor] = (contest.votes[votedFor] || 0) + 1;
      io.to(contestId).emit('votes_updated', contest.votes);
    }
  });

  socket.on('uncast_vote', ({ votedFor }) => {
    const contestId = socket.contestId;
    const contest = contests[contestId];
    if (contest && contest.settings.audienceCanVote && socket.role === 'audience' && contest.state !== 'finished') {
      if (contest.votes[votedFor] && contest.votes[votedFor] > 0) {
        contest.votes[votedFor]--;
      }
      io.to(contestId).emit('votes_updated', contest.votes);
    }
  });

  socket.on('disconnect', () => {
    const contestId = socket.contestId;
    if (contestId && contests[contestId]) {
      contests[contestId].users = contests[contestId].users.filter(u => u.id !== socket.id);
      io.to(contestId).emit('contest_state', getPublicContestState(contestId));
    }
  });
});

function getPublicContestState(contestId) {
  const c = contests[contestId];
  if (!c) return null;
  const { timerInterval, ...publicState } = c;
  return publicState;
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend Server running on port ${PORT}`);
});
