# 🏆 Code Battle Platform

> A real-time competitive coding arena where developers go head-to-head, judges set the challenge, and audiences watch, vote, and cheer — live.

---

## Overview

Code Battle Platform is a browser-based competitive coding environment built for live events. Two contestants receive a prompt from a judge, then race against a countdown timer to build the best HTML/CSS/JS solution they can. A live audience watches both editors update in real time, votes for their favourite, and chats throughout. When the timer hits zero, the judge declares a winner.

No accounts. No logins. No database. Just a link and a fight.

---

## The Problem

Live coding events are awkward to run. Screen-sharing tools weren't built for competition. Judges have no control surface. Audiences are passive. Voting is a show of hands. There is no tension, no drama, and no feedback loop between the crowd and the competitors.

The problem was simple: **there was no tool purpose-built for this format.** Everything that existed was either a collaborative editor (not competitive), a judging platform (asynchronous), or a streaming setup (one-way). Nothing gave all four roles — judge, two contestants, audience — a tailored, simultaneous, real-time experience in a single browser tab.

---

## The Outcome

A working platform where:

- A judge creates a contest in seconds and shares four role-specific links
- Two contestants code live in a full-featured editor with syntax highlighting
- Judges and audiences watch both editors update in real time, with changed lines highlighted and auto-scrolled into view
- A live preview renders each contestant's output as they type
- An audience votes and chats in real time
- A countdown timer creates genuine pressure
- The judge declares a winner at the end

All of it over WebSockets. All of it in the browser. No installation required for participants.

---

## From the User's Perspective — Start to Finish

**The Judge** lands on the homepage, sets a time limit and toggles audience permissions (chat, vote), and clicks Create Contest. Four unique links appear — one for each role. They copy and share them however they like: a Slack message, a QR code on a projector, a Discord channel.

**The Contestants** each open their link. They land in the arena with a full code editor — HTML, CSS, and JS tabs — and a live preview panel beside it. They wait. When the judge posts the prompt and starts the timer, the contest begins. They code. Every keystroke is broadcast. Every tab switch is mirrored on the observers' screens.

**The Audience** opens their link to a read-only view of both editors side by side. They can see exactly where each contestant is working — changed lines glow yellow and scroll into view automatically. They vote for whoever they think is winning. They chat in the sidebar. The energy is live.

**The Judge** watches both previews, reads the chat, monitors the vote counts, and when the timer expires, declares a winner. The result is broadcast to everyone simultaneously.

The whole thing — from creating the contest to declaring a winner — can happen in under ten minutes, entirely in the browser.

---

## Frontend — Client-Side Technologies

| Technology | Purpose |
|---|---|
| **React** | Component framework. Role-based views (judge, contestant, audience) are composed from shared components — the same `CodeEditor` renders as editable for contestants and read-only with live highlights for observers. |
| **Vite** | Build toolchain and dev server. Provides instant HMR during development and, critically, proxies `/socket.io` WebSocket traffic from port 5173 to the backend on 3001 — solving the cross-origin problem with one config line. |
| **React Router** | Client-side routing. Maps `/` to the landing page and `/contest/:contestId` to the arena. The `contestId` and `role` are parsed directly from the URL, meaning a link is all you need to join the right contest with the right permissions. |
| **Socket.IO Client** | Real-time bidirectional communication. Emits events (code changes, votes, chat messages) and listens for broadcasts (timer ticks, state updates, code from other contestants). |
| **CodeMirror 6** | The code editor. Chosen specifically for its extension API, which enabled the changed-line highlight feature — incoming diffs are converted to line decorations dispatched as state effects, with auto-scroll and a timed fade. |
| **Lucide React** | Icon library for UI chrome. |

---

## Backend — Server-Side Technologies

| Technology | Purpose |
|---|---|
| **Node.js** | Runtime. Handles concurrent WebSocket connections efficiently with its event-loop model — important when broadcasting timer ticks to many clients every second. |
| **Express** | HTTP server scaffolding. Minimal role — creates the server that Socket.IO attaches to, and sets CORS headers. No REST routes are defined; all logic flows through WebSocket events. |
| **Socket.IO Server** | The core of the backend. Manages rooms (one per contest), event routing, acknowledgement callbacks, and broadcasting. Every contest runs in its own named room; `io.to(contestId).emit(...)` scopes all broadcasts correctly. |
| **In-memory store (`contests{}`)** | All contest state — code, votes, chat, timer, settings — lives in a plain JavaScript object. No database, no serialisation overhead. Chosen deliberately: contests are ephemeral sessions, not records. |

---

## 🚀 Installation

### Prerequisites
- Node.js 18+
- npm

### Backend

```bash
# From the project root
npm install express socket.io cors
node server.js
# Server runs on http://localhost:3001
```

### Frontend

```bash
# From the frontend directory (where vite.config.js lives)
npm install
npm run dev
# App runs on http://localhost:5173
```

The Vite proxy handles routing — no additional CORS configuration needed.

---

## Usage

1. Open `http://localhost:5173` in a browser
2. Set a time limit and audience permissions, then click **Create Contest**
3. Four role links are generated — share them with participants
4. Each participant opens their link in a browser tab
5. The judge posts a prompt and clicks **Start Contest**
6. Contestants code; audience watches, votes, and chats
7. When the timer expires, the judge declares a winner

---

## Project Structure

```
├── server.js                  # Express + Socket.IO backend
├── src/
│   ├── main.jsx               # React entry point
│   ├── App.jsx                # Router — maps URLs to views
│   ├── socket.js              # Socket.IO client singleton
│   ├── index.css              # Global design system (CSS variables, utilities)
│   ├── App.css                # Legacy styles
│   └── pages/
│       ├── Landing.jsx        # Contest creation UI (admin/judge)
│       └── ContestArena.jsx   # Main arena — all four role views
│   └── components/
│       ├── CodeEditor.jsx     # CodeMirror editor with highlight extension
│       └── LivePreview.jsx    # Sandboxed iframe preview
├── index.html                 # HTML entry point
└── vite.config.js             # Vite config with Socket.IO proxy
```
