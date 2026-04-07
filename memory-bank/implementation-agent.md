# BAYOU BLITZ — Implementation Agent Spec
**Version:** 0.1  
**Author:** GOGG03  
**Workflow:** Cursor Pro — Agent Mode, Fully Autonomous  

---

## Purpose

This document defines the prompt, rules, and operating behavior for the Cursor Agent that will autonomously implement Bayou Blitz from scratch. The agent reads the memory bank, executes the implementation plan step by step, validates each step against its test, commits to Git, and continues — pausing only when a test fails or a decision requires human input.

---

## How to Launch the Agent

Open Cursor on your local machine with the `bayou-blitz/` project folder loaded. Open the Agent panel. Paste the **Session Zero Prompt** below exactly as written. The agent takes it from there.

---

## Session Zero Prompt

Paste this once at the start of the very first session to orient the agent and establish all rules:

```
You are the implementation agent for Bayou Blitz, a multiplayer airboat arena game being built for Vibe Jam 2026.

Your job is to implement the game autonomously by working through the implementation plan in /memory-bank/implementation-plan.md, one step at a time.

Before you write a single line of code, read every file in /memory-bank/ in full. These are your source of truth for every decision you make. Do not deviate from them without flagging it first.

Your operating rules are:

1. ALWAYS read /memory-bank/ at the start of every new session before doing anything else.
2. Check /memory-bank/progress.md to find the last completed step. Begin on the next uncompleted step.
3. Complete one step fully before starting the next.
4. After completing a step, run its test. If the test passes, document the step in progress.md and architecture.md, commit to Git with a clear message, then immediately proceed to the next step without waiting.
5. If a test fails, stop. Diagnose the failure, attempt one fix, run the test again. If it fails a second time, stop and report clearly: what step you are on, what the test expects, what is actually happening, and what you tried. Do not proceed past a failing step.
6. Never rewrite a file that is already working to add new functionality — extend it. Preserve what passes.
7. Never modify /shared/types.ts without explicitly stating you are doing so and why. This file is shared between client and server — changes here have cascading effects.
8. Keep all files modular. No file should exceed 200 lines. If a file is growing beyond that, split it before continuing.
9. Never hardcode values that belong in /src/constants/GameConfig.ts. Physics constants, timers, counts, and sizes all live there.
10. After every 5 steps, run the full project build (npm run build) and confirm zero type errors before continuing.
11. Commit to Git after every step using the format: "Step N — [short description]"
12. If you encounter a decision not covered by the memory bank documents, stop and ask before proceeding. Do not invent architecture.

Your first action right now: read all files in /memory-bank/, confirm you understand the full scope of the project, then state which step you are beginning and why.
```

---

## Session Resume Prompt

Use this at the start of every subsequent Cursor session after the first. The agent will orient itself from progress.md and continue:

```
You are the implementation agent for Bayou Blitz. Read all files in /memory-bank/ — especially progress.md and architecture.md — to understand what has been built so far. Identify the next uncompleted step in implementation-plan.md and continue from there. Follow all operating rules defined in the agent spec. Do not ask me questions unless a test fails twice or a decision is not covered by the memory bank. Begin.
```

---

## Progress Tracking

The agent maintains two files in `/memory-bank/` after each step:

### `progress.md` format

The agent appends an entry after each completed step:

```
## Step N — [Step Title]
**Status:** Complete  
**Date:** [date]  
**Summary:** [1-2 sentences on what was built]  
**Test result:** Passed — [brief description of what was verified]  
**Git commit:** Step N — [short description]
```

### `architecture.md` format

The agent updates this file whenever a new file is created or an existing file's responsibility changes:

```
## [filename]
**Location:** src/[path]/[filename].ts  
**Responsibility:** [one sentence]  
**Dependencies:** [list of files it imports from]  
**Last updated:** Step N
```

---

## Failure Protocol

When a test fails twice, the agent stops and outputs this exact format:

```
AGENT STOPPED — Step N failure

Step: [step title]
Expected: [what the test should produce]
Actual: [what is actually happening]
Attempts: [what was tried on attempt 1 and attempt 2]
Files modified: [list of files touched during this step]
Suggested next action: [agent's best guess at root cause and fix approach]

Awaiting human input before continuing.
```

Do not attempt a third fix. Wait for instruction.

---

## Git Discipline

- Commit after every step — no batching multiple steps into one commit
- Commit message format: `Step N — [short description]`
- Examples:
  - `Step 1 — Vite + TypeScript scaffold`
  - `Step 7 — Tile map renderer`
  - `Step 17 — Authoritative server game room loop`
- Never commit a failing build
- Never commit `.env`

---

## File Creation Rules

When creating a new file the agent must:
1. Check `architecture.md` — does a file with this responsibility already exist?
2. If yes, extend that file rather than creating a duplicate
3. If no, create the file and immediately add it to `architecture.md`
4. Import from `/shared/types.ts` for any type that crosses the client/server boundary

---

## Scope Boundaries

The agent must not implement anything outside the implementation plan without explicit instruction. Specifically:

- No boat customization or skins
- No team modes
- No mobile touch controls
- No additional weapon types beyond the net gun
- No persistent player stats across sessions
- No map voting

If a step seems to require out-of-scope work to complete, stop and flag it.

---

## Phase Checkpoints

At the end of each phase the agent runs a full checkpoint before starting the next phase:

```
Phase [N] Checkpoint:
- npm run build → zero errors ✓/✗
- All steps in this phase marked complete in progress.md ✓/✗
- architecture.md updated for all new files ✓/✗
- All commits pushed to Git ✓/✗

Proceeding to Phase [N+1] — Step [X].
```

If any checkpoint item fails, the agent resolves it before moving on.

---

## Deployment Phase Notes

When the agent reaches Phase 10 (Steps 32–38), it will need SSH access to root@72.60.67.208. At that point it should stop and output:

```
DEPLOYMENT PHASE REACHED — Step 32

Ready to begin VPS deployment. This phase requires SSH access to root@72.60.67.208.
Confirm you are ready to proceed and that you have SSH access available in this terminal session.
Awaiting confirmation before continuing.
```

This is the only planned human confirmation gate in the fully autonomous workflow.

---

## Context Window Management

Following the vibe coding guide methodology:
- Start a new Cursor Agent session after every 5 completed steps using the Session Resume Prompt
- Use `/compact` if context feels heavy mid-session rather than starting fresh
- Never let context drop below 50% — start a new session before that point
- Each new session always begins by reading `/memory-bank/` in full

---

## Quick Reference Card

| Situation | Agent Action |
|---|---|
| Session start | Read memory bank → check progress.md → find next step → begin |
| Step complete | Update progress.md + architecture.md → commit → next step |
| Test fails once | Diagnose → fix → retest |
| Test fails twice | STOP → output failure report → wait |
| File exceeds 200 lines | Split before continuing |
| Decision not in memory bank | STOP → ask |
| Out of scope feature needed | STOP → flag |
| Every 5 steps | Run full build → confirm zero errors |
| Phase complete | Run phase checkpoint → proceed |
| Step 32 reached | STOP → request SSH confirmation |

---

*This document lives in /memory-bank/implementation-agent.md and is read at the start of every session.*
