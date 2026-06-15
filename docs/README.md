## Development Approach with AI

### AI Tools and Models Used

| Tool / Model | Purpose |
|---|---|
| **Antigravity / Windsurf** | Primary development assistant. Used for architecture decisions, component design, debugging the CodeMirror extension API, and iterating on the real-time diff and highlight logic. |

---

## AI Agents — Roles and Skills


**Architect** — Early sessions focused on system design. The AI was prompted to think through the role model, state ownership, and the tradeoffs between client-side and server-side state. It pushed back on unnecessary complexity (no database, no auth) and justified the in-memory approach.

**Implementer** — Given component specs and constraints, the AI generated working implementations.

**Debugger** — AI figured out that synchronizing code alone would not provide enough context for spectators, so it updated Socket.io event and stored the contestant's active tab in shared contest state. Audience and judge views automatically switched tabs to follow the contestant's current workspace.

---


## Key Prompts Used

These were the prompts that drove the most significant decisions and outputs:

> *"I want to build a live competitive coding platform. Four roles: judge, two contestants, audience. What's the simplest architecture that actually works in real time?"*

This established the WebSocket-first, in-memory, server-authoritative design. The AI immediately ruled out REST polling and a database for this use case.

> *"The audience needs to see which lines the contestant just changed, highlighted in the editor, and it should scroll to that location. How do I do this in CodeMirror 6?"*

This produced the `StateEffect` / `StateField` / `Decoration` pattern that became the highlight system — the most technically complex part of the frontend.

---

## Key Review Points and Decisions Made

**In-memory state over a database**
Reviewed and confirmed. All contest state — code, votes, chat, timer, settings — lives in a plain JavaScript object. No database, no serialisation overhead. Chosen deliberately: contests are ephemeral sessions, not records. The cost of adding Redis or Postgres — connection overhead, serialisation, failure modes — was not justified by any requirement. If persistence matters in a future version, Redis pub/sub drops in cleanly. 

**Server-authoritative state**
Every mutation goes to the server first. The server broadcasts the result. Clients never update their own state speculatively. This eliminated an entire class of sync bugs at the cost of one extra network hop — a good tradeoff for a correctness-critical feature like a timer.

---

### What Worked
- AI significantly accelerated initial development.
- Antigravity rapidly generated a functional first version of the platform.
- Windsurf was effective for debugging, implementation support, and exploring architectural options.
- AI was particularly useful for generating React components, Socket.io workflows, and CodeMirror integrations.
- Active tab tracking successfully allowed audience members and judges to follow the contestant's workflow.
- Line-level highlighting provided additional context about where contestants were actively making changes.

### What Failed 
- AI-generated solutions focused primarily on feature correctness rather than overall user experience.
- The initial implementation only synchronized code and did not consider audience awareness of contestant activity.
- Scroll persistence in the live preview remains unresolved because updating the iframe recreates the document and resets browser-managed state.
- AI did not initially identify the distinction between content synchronization and view-state preservation.

### What Changed
- Added active tab synchronization so viewers automatically follow the contestant's current file.
- Added automatic scrolling to recently modified lines in read-only spectator views.
- Refined Socket.io events to support code updates, tab changes, voting, chat, and timer synchronization.
- Investigated multiple approaches to preserving preview scroll position rather than repeatedly patching symptoms.

### Rationale

This project demonstrated that AI is highly effective at accelerating implementation, but complex real-time applications still require human reasoning around synchronization, state management, and user experience. Rather than accepting generated solutions directly, AI was used as a collaborator to rapidly explore ideas, generate implementations, identify trade-offs, and iterate on designs. The most valuable lessons came from debugging real-time interaction issues that only emerged when multiple users interacted with the system simultaneously.