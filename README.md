# 🏆 Code Battle Platform

A high-performance, real-time competitive coding platform where contestants battle live while judges and audiences watch, chat, and vote.

---

## 🚀 Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- npm

### 2. Installation
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 3. Running Locally
You need **two terminals** running simultaneously:

**Terminal 1 (Backend)**
```bash
cd backend
npm start
```

**Terminal 2 (Frontend)**
```bash
cd frontend
npm run dev
```

Visit **http://localhost:5173** to start.

---

## 🎮 Arena Roles

| Role | Access | Powers |
|------|--------|--------|
| **Judge** | `role=judge` | Set prompt, start timer, declare winner. |
| **Contestant** | `role=contestant1/2` | Code live (HTML/CSS/JS) with instant preview. |
| **Audience** | `role=audience` | Watch live code, chat, and vote for the winner. |

---

## 🔥 Key Features


- **Live Code Sync**: Audience sees live preview along with code changes in real time.
- **Active Tab Tracking**: The audience view automatically follows the contestant's active tab (HTML/CSS/JS).
- **Dynamic Timer**: A timer that turns **red** when time expires, automatically locking contestant editors.
- **Interactive Voting**: Audience can change their votes during the contest; results lock when the timer hits zero.
- **Winner Declaration**: Judges can select a winner, triggering a celebratory broadcast to all participants.
- **Glassmorphism UI**: A modern, sleek dark-mode interface with blurred panels and vibrant accents.

---

## 📁 Project Structure

```text
code-battle/
├── backend/
│   └── server.js        # Node.js + Socket.io (State & Timer management)
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── CodeEditor.jsx   # Tabbed editor with auto-scroll & highlighting
    │   │   ├── LivePreview.jsx  # Isolated iframe with scroll persistence
    │   │   ├── ChatPanel.jsx    # Real-time contest chat
    │   │   └── VotingSystem.jsx # Live audience voting
    │   ├── pages/
    │   │   ├── Landing.jsx      # Role-based entry (Judge/Contestant/Audience)
    │   │   └── ContestArena.jsx # Main hub for all user views
    │   ├── socket.js            # Socket.io client instance
    │   └── App.jsx              # Main routing & layout
    └── index.css                # Glassmorphism design system & animations
```

---

## 🛠 Tech Stack

- **Frontend**: React 19 (Hooks & Props-based state sync)
- **Bundler**: Vite (Fast HMR)
- **Editor Core**: CodeMirror 6 (Decorations & State extensions)
- **Real-time Engine**: Socket.io (Rooms & Targeted broadcasts)
- **Design System**: Vanilla CSS with CSS Variables (Custom scrollbars & Glassmorphism)
- **Icons**: Lucide React
- **Typography**: Inter / Outfit (Modern Sans-Serif)
- **Theme**: Premium Dark (Glassmorphism)

## Demo
![admin creates battle][../admin.png]
![admin creates invite links][../invites.png]
![choose_display_name][../display_name.png]
![judge][../judge.png]
![judge][../'Screenshot 2026-05-15 at 15-21-06 Code Battle.png']
![judge][../'Screenshot 2026-05-15 at 15-22-19 Code Battle.png']
![judge][../'Screenshot 2026-05-15 at 15-24-56 Code Battle.png']
![judge][../'Screenshot 2026-05-15 at 15-25-41 Code Battle.png']
![judge][../'Screenshot 2026-05-15 at 15-26-10 Code Battle.png']


