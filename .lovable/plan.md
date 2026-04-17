

## Plan: Mock Exam Mode (150Q × 3h) with Topic-Wise Performance Report

### What we're building

A new **"Mock Exam"** mode in the exam simulator that mimics real licensing-exam conditions, plus a detailed end-of-exam analytics report.

### 1. Mock Exam Mode (in `ExamSimulator.tsx`)

Add a fourth mode alongside `setup | running | review`:

- **Toggle on setup screen**: A prominent "🎯 Mock Exam Mode (150Q · 3h)" switch. When ON:
  - Force `count = 150`, `topic = All`, `difficulty = All`
  - Force timer = 10800s (3 hours), single global countdown (not per-question)
  - Disable AI generation toggle (uses bank only for stability)
  - Hide topic/difficulty/count controls (locked)
- **During the exam**:
  - **No explanations shown** after answering (locked until end)
  - **No "correct/incorrect" feedback** per question
  - Add a **question navigator grid** (clickable 1–150 numbers, color-coded: answered / flagged / unanswered)
  - Add **"Flag for review"** button per question
  - Auto-submit when timer hits 0
  - "End Exam" requires confirmation dialog
- **Persist** in localStorage with `mode: "mock"` flag

### 2. Detailed Performance Report (review mode enhancement)

When mock exam ends, show an enhanced review screen with:

- **Score header**: Overall %, pass/fail vs exam's actual pass mark (from `examsData`), time used / total
- **Topic-wise breakdown table**: For each topic appearing in the exam → questions attempted, correct, %, weakness badge ("Strong" ≥75%, "Adequate" 60–74%, "Needs review" <60%)
- **Topic radar/bar chart**: Recharts BarChart of % per topic for instant visual
- **Difficulty breakdown**: Easy/Medium/Hard accuracy
- **Time analysis**: Average sec/question, fastest, slowest
- **Flagged questions section**: Quick jump to review only flagged items
- **Question-by-question** review (existing) but collapsed under an accordion

### 3. Bank capacity check

Current `ALL_MCQS` ≈ 156. For 150-question mock we need **at least 150 unique** — currently borderline. Plan:
- Allow mock exam to run with whatever's available (cap at `min(150, bank.length)`)
- Show warning if bank < 150: "Mock exam will use X questions (full bank)"
- Optionally trigger AI generation in background to top up — **deferred to follow-up** to keep this scope tight

### Files to change

| File | Action |
|------|--------|
| `src/components/exams/ExamSimulator.tsx` | Add mock mode toggle, locked timer, navigator grid, flag system, hide explanations during run, expanded report |
| `src/data/examsData.ts` | (read-only) use existing `passMark` field for pass/fail logic |

### Technical notes

- Reuse existing `localStorage` key pattern `exam_progress_{examId}`; add `mode`, `topicBreakdown`, `flaggedIds` to stored entry so the chart on `/exams` keeps working
- Single global timer via `setInterval` already exists — just change initial value
- Question navigator uses a 10-col grid of small square buttons
- Topic breakdown computed via `useMemo` over `questions` + `answers`
- No new dependencies; Recharts already available

