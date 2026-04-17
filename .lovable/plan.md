

## Plan: Score Progress Chart + Expanded MCQ Bank

### What we're building

**1. Score Progress Chart on `/exams` page**

A new section between the hero and the country filter showing a line chart of score history over time, per exam. Uses Recharts (already installed via `chart.tsx`).

- Read all `exam_progress_*` keys from localStorage on mount
- Each stored result has: `{ examId, date, total, score, durationSec }`
- Chart: X-axis = date, Y-axis = score %, one colored line per exam (up to 20 results each)
- Exam selector tabs/chips to toggle which exam's line is visible
- Pass mark reference line at 60%
- Empty state: "Complete a simulation to see your progress here"
- Placed in a Card with heading "My Progress"

**2. Expand MCQ Bank from ~19 → 200+ questions**

Current bank has only 19 questions — way too few for a realistic exam simulation (real exams are 100–200 questions). We'll add ~180+ new MCQs covering all 13 topics evenly:

- ~15 questions per topic across easy/medium/hard
- Each with stem, 4 options, correct answer, explanation, reference
- Tagged with relevant `exams[]` where applicable
- This ensures the simulator slider (5–150) actually works meaningfully

### Files to change

| File | Action |
|------|--------|
| `src/data/mcqBank.ts` | Add ~180 new MCQ entries |
| `src/pages/Exams.tsx` | Add progress chart section with Recharts LineChart |
| `src/components/exams/ExamSimulator.tsx` | No changes needed (already reads/writes localStorage correctly) |

### Technical details

- Chart uses `ChartContainer` from `src/components/ui/chart.tsx` with `LineChart`, `Line`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`
- localStorage key pattern: `exam_progress_{examId}` — already established
- No new dependencies needed
- No backend changes

