import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Baby, Heart, Droplet, Activity, Scale, AlertCircle } from "lucide-react";

/* ---------- shared UI ---------- */

type Tone = "info" | "success" | "warning" | "danger";

function ResultBox({
  label,
  value,
  hint,
  tone = "info",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
}) {
  const toneClass: Record<Tone, string> = {
    info: "from-info/15 to-info/5 border-info/30",
    success: "from-success/15 to-success/5 border-success/30",
    warning: "from-warning/15 to-warning/5 border-warning/30",
    danger: "from-danger/15 to-danger/5 border-danger/30",
  };
  const labelTone: Record<Tone, string> = {
    info: "text-info",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  };
  return (
    <div
      className={`mt-3 p-3 rounded-xl bg-gradient-to-br border ${toneClass[tone]}`}
      role="status"
      aria-live="polite"
    >
      <p className={`text-[10px] uppercase tracking-wider font-bold ${labelTone[tone]}`}>{label}</p>
      <p className="text-base font-black text-foreground mt-0.5 tabular-nums">{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{hint}</p>}
    </div>
  );
}

function CalcShell({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-4 space-y-3 border-border/50">
      <div className="flex items-center gap-2 pb-2 border-b border-border/40">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-primary/70">
          <Icon className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-foreground leading-tight">{title}</h3>
          {subtitle && <p className="text-[10px] text-muted-foreground leading-tight">{subtitle}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}

function FieldError({ msg }: { msg?: string | null }) {
  if (!msg) return null;
  return (
    <p className="text-[10px] text-danger flex items-center gap-1 mt-1">
      <AlertCircle className="w-3 h-3" /> {msg}
    </p>
  );
}

/* ---------- helpers ---------- */

const fmtDate = (d: Date) =>
  d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });

const clampNum = (v: string, min: number, max: number) => {
  const n = parseFloat(v);
  if (Number.isNaN(n)) return null;
  return Math.min(Math.max(n, min), max);
};

/* ---------- EDD ---------- */

export function EDDCalculator() {
  const [lmp, setLmp] = useState("");
  const [cycle, setCycle] = useState("28");

  const cycleNum = clampNum(cycle, 21, 45);
  const cycleErr = cycle !== "" && cycleNum === null ? "Enter 21–45 days" : null;

  const result = useMemo(() => {
    if (!lmp || cycleNum === null) return null;
    const d = new Date(lmp);
    if (Number.isNaN(d.getTime())) return null;
    const today = new Date();
    if (d.getTime() > today.getTime()) return { error: "LMP cannot be in the future" } as const;

    const adj = cycleNum - 28;
    const edd = new Date(d.getTime() + (280 + adj) * 86400000);
    const gaDays = Math.floor((today.getTime() - d.getTime()) / 86400000);
    const wk = Math.floor(gaDays / 7);
    const day = gaDays % 7;
    const trimester = wk < 14 ? "1st trimester" : wk < 28 ? "2nd trimester" : "3rd trimester";
    const daysToEDD = Math.ceil((edd.getTime() - today.getTime()) / 86400000);
    return { edd: fmtDate(edd), ga: `${wk}+${day} weeks`, trimester, daysToEDD };
  }, [lmp, cycleNum]);

  return (
    <CalcShell icon={Baby} title="EDD & Gestational Age" subtitle="Naegele's rule (cycle-adjusted)">
      <div className="space-y-2">
        <div>
          <Label htmlFor="edd-lmp" className="text-xs">LMP (first day)</Label>
          <Input
            id="edd-lmp"
            type="date"
            value={lmp}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => setLmp(e.target.value)}
            className="h-9 mt-1"
          />
        </div>
        <div>
          <Label htmlFor="edd-cycle" className="text-xs">Cycle length (days)</Label>
          <Input
            id="edd-cycle"
            type="number"
            inputMode="numeric"
            min={21}
            max={45}
            value={cycle}
            onChange={(e) => setCycle(e.target.value)}
            className="h-9 mt-1"
          />
          <FieldError msg={cycleErr} />
        </div>
      </div>
      {result && "error" in result && <ResultBox label="Invalid input" value={result.error} tone="danger" />}
      {result && !("error" in result) && (
        <>
          <ResultBox label="Estimated Due Date" value={`${result.edd} (${result.daysToEDD} d)`} tone="success" />
          <ResultBox
            label="Current GA"
            value={`${result.ga} • ${result.trimester}`}
            hint="Confirm with first-trimester US (CRL) — ±5 d at <14 wk."
          />
        </>
      )}
    </CalcShell>
  );
}

/* ---------- Bishop ---------- */

export function BishopCalculator() {
  const [scores, setScores] = useState({ dilation: 0, effacement: 0, station: 0, consistency: 0, position: 0 });
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const MAX = 13; // 3+3+3+2+2

  const verdict =
    total >= 8
      ? { text: "Favorable — IOL likely successful", tone: "success" as const }
      : total >= 6
      ? { text: "Intermediate — consider ripening", tone: "warning" as const }
      : { text: "Unfavorable — cervical ripening needed", tone: "danger" as const };

  const fields: { key: keyof typeof scores; label: string; opts: { v: number; l: string }[] }[] = [
    { key: "dilation", label: "Dilation (cm)", opts: [{ v: 0, l: "Closed" }, { v: 1, l: "1–2" }, { v: 2, l: "3–4" }, { v: 3, l: "≥5" }] },
    { key: "effacement", label: "Effacement (%)", opts: [{ v: 0, l: "0–30" }, { v: 1, l: "40–50" }, { v: 2, l: "60–70" }, { v: 3, l: "≥80" }] },
    { key: "station", label: "Station", opts: [{ v: 0, l: "−3" }, { v: 1, l: "−2" }, { v: 2, l: "−1/0" }, { v: 3, l: "+1/+2" }] },
    { key: "consistency", label: "Consistency", opts: [{ v: 0, l: "Firm" }, { v: 1, l: "Medium" }, { v: 2, l: "Soft" }] },
    { key: "position", label: "Position", opts: [{ v: 0, l: "Posterior" }, { v: 1, l: "Mid" }, { v: 2, l: "Anterior" }] },
  ];

  return (
    <CalcShell icon={Activity} title="Bishop Score" subtitle="Cervical favorability for induction">
      <div className="space-y-2.5">
        {fields.map((f) => (
          <div key={f.key}>
            <Label className="text-xs">{f.label}</Label>
            <div className="flex gap-1 mt-1 flex-wrap" role="radiogroup" aria-label={f.label}>
              {f.opts.map((o) => {
                const selected = scores[f.key] === o.v;
                return (
                  <button
                    key={o.v}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setScores({ ...scores, [f.key]: o.v })}
                    className={`px-2 py-1 rounded-md text-[10px] font-semibold border transition ${
                      selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border/50 text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    {o.l} <span className="opacity-60">({o.v})</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <ResultBox label="Total Score" value={`${total} / ${MAX}`} hint={verdict.text} tone={verdict.tone} />
    </CalcShell>
  );
}

/* ---------- APGAR (1 & 5 min) ---------- */

type ApgarSet = { appearance: number; pulse: number; grimace: number; activity: number; respiration: number };
const apgarFields: { key: keyof ApgarSet; label: string; opts: string[] }[] = [
  { key: "appearance", label: "Appearance (color)", opts: ["Blue/pale", "Body pink, extremities blue", "All pink"] },
  { key: "pulse", label: "Pulse", opts: ["Absent", "<100", "≥100"] },
  { key: "grimace", label: "Grimace (reflex)", opts: ["No response", "Grimace", "Cry/cough"] },
  { key: "activity", label: "Activity (tone)", opts: ["Limp", "Some flexion", "Active motion"] },
  { key: "respiration", label: "Respiration", opts: ["Absent", "Slow/irregular", "Strong cry"] },
];

function ApgarBlock({ label, value, onChange }: { label: string; value: ApgarSet; onChange: (v: ApgarSet) => void }) {
  const total = Object.values(value).reduce((a, b) => a + b, 0);
  const verdict =
    total >= 7
      ? { t: "Reassuring", tone: "success" as const }
      : total >= 4
      ? { t: "Moderately depressed — needs intervention", tone: "warning" as const }
      : { t: "Severely depressed — full resuscitation", tone: "danger" as const };
  return (
    <div className="space-y-2.5 pt-1">
      <p className="text-[11px] font-bold text-primary uppercase tracking-wider">{label}</p>
      {apgarFields.map((f) => (
        <div key={f.key}>
          <Label className="text-xs">{f.label}</Label>
          <div className="flex gap-1 mt-1" role="radiogroup" aria-label={`${label} — ${f.label}`}>
            {f.opts.map((o, i) => {
              const selected = value[f.key] === i;
              return (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange({ ...value, [f.key]: i })}
                  className={`flex-1 px-1 py-1.5 rounded-md text-[9px] font-semibold border transition leading-tight ${
                    selected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border/50 text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  {o} <div className="opacity-60">({i})</div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <ResultBox label={`${label} total`} value={`${total} / 10`} hint={verdict.t} tone={verdict.tone} />
    </div>
  );
}

export function ApgarCalculator() {
  const init: ApgarSet = { appearance: 2, pulse: 2, grimace: 2, activity: 2, respiration: 2 };
  const [oneMin, setOneMin] = useState<ApgarSet>(init);
  const [fiveMin, setFiveMin] = useState<ApgarSet>(init);
  return (
    <CalcShell icon={Heart} title="APGAR Score" subtitle="Score newborn at 1 & 5 minutes">
      <ApgarBlock label="1 minute" value={oneMin} onChange={setOneMin} />
      <ApgarBlock label="5 minutes" value={fiveMin} onChange={setFiveMin} />
    </CalcShell>
  );
}

/* ---------- MgSO4 ---------- */

export function MgSO4Calculator() {
  const [weight, setWeight] = useState("70");
  const [renal, setRenal] = useState(false);
  const w = clampNum(weight, 30, 200);
  const wErr = weight !== "" && w === null ? "Enter 30–200 kg" : null;
  const recurrent = w !== null && w >= 70 ? 4 : 2;
  const maintenance = renal ? "0.5 g/h IV (renal impairment)" : "1 g/h IV infusion (or 5 g IM q4h)";
  const tone: Tone = renal ? "warning" : "info";

  return (
    <CalcShell icon={Droplet} title="MgSO₄ Protocol" subtitle="Eclampsia / severe preeclampsia">
      <div>
        <Label htmlFor="mg-w" className="text-xs">Maternal weight (kg)</Label>
        <Input
          id="mg-w"
          type="number"
          inputMode="decimal"
          min={30}
          max={200}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="h-9 mt-1"
        />
        <FieldError msg={wErr} />
      </div>
      <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
        <input
          type="checkbox"
          checked={renal}
          onChange={(e) => setRenal(e.target.checked)}
          className="w-3.5 h-3.5 accent-warning"
        />
        Renal impairment / oliguria
      </label>
      <ResultBox label="Loading dose" value="4 g IV over 5–10 min" hint="Dilute in 100 mL saline. Pritchard: + 10 g IM (5 g each buttock)." tone="info" />
      <ResultBox label="Maintenance" value={maintenance} hint="Continue 24 h post-delivery / last seizure." tone={tone} />
      <ResultBox label="Recurrent seizure" value={`${recurrent} g IV over 5 min`} hint="Antidote: Calcium gluconate 1 g IV slow." tone="warning" />
      <div className="text-[10px] text-muted-foreground p-2 rounded-lg bg-muted/40 leading-relaxed">
        <strong>Monitor:</strong> patellar reflexes, RR &gt;12, urine &gt;25 mL/h, SpO₂.
        Toxic level &gt;3.5 mmol/L. Stop infusion if reflexes lost.
      </div>
    </CalcShell>
  );
}

/* ---------- BMI ---------- */

export function BMICalculator() {
  const [w, setW] = useState("70");
  const [h, setH] = useState("165");
  const [twin, setTwin] = useState(false);

  const W = clampNum(w, 30, 250);
  const H = clampNum(h, 120, 220);
  const wErr = w !== "" && W === null ? "30–250 kg" : null;
  const hErr = h !== "" && H === null ? "120–220 cm" : null;

  const bmi = useMemo(() => (W && H ? W / ((H / 100) ** 2) : null), [W, H]);
  const cat = bmi
    ? bmi < 18.5
      ? { t: "Underweight", tone: "warning" as const }
      : bmi < 25
      ? { t: "Normal", tone: "success" as const }
      : bmi < 30
      ? { t: "Overweight", tone: "warning" as const }
      : bmi < 35
      ? { t: "Obese I", tone: "danger" as const }
      : bmi < 40
      ? { t: "Obese II", tone: "danger" as const }
      : { t: "Obese III", tone: "danger" as const }
    : null;

  const gain = bmi
    ? twin
      ? bmi < 18.5
        ? "—"
        : bmi < 25
        ? "16.8–24.5 kg"
        : bmi < 30
        ? "14.1–22.7 kg"
        : "11.3–19.1 kg"
      : bmi < 18.5
      ? "12.5–18 kg"
      : bmi < 25
      ? "11.5–16 kg"
      : bmi < 30
      ? "7–11.5 kg"
      : "5–9 kg"
    : "";

  return (
    <CalcShell icon={Scale} title="Pre-pregnancy BMI" subtitle="IOM 2009 weight-gain targets">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="bmi-w" className="text-xs">Weight (kg)</Label>
          <Input id="bmi-w" type="number" inputMode="decimal" min={30} max={250} value={w} onChange={(e) => setW(e.target.value)} className="h-9 mt-1" />
          <FieldError msg={wErr} />
        </div>
        <div>
          <Label htmlFor="bmi-h" className="text-xs">Height (cm)</Label>
          <Input id="bmi-h" type="number" inputMode="decimal" min={120} max={220} value={h} onChange={(e) => setH(e.target.value)} className="h-9 mt-1" />
          <FieldError msg={hErr} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
        <input type="checkbox" checked={twin} onChange={(e) => setTwin(e.target.checked)} className="w-3.5 h-3.5 accent-primary" />
        Twin pregnancy
      </label>
      {bmi && cat && (
        <>
          <ResultBox label="BMI" value={`${bmi.toFixed(1)} kg/m² — ${cat.t}`} tone={cat.tone} />
          <ResultBox label="Recommended gestational gain" value={gain} hint={`IOM 2009 — ${twin ? "twin" : "singleton"} pregnancy.`} />
        </>
      )}
    </CalcShell>
  );
}

/* ---------- Ovulation ---------- */

export function OvulationCalculator() {
  const [lmp, setLmp] = useState("");
  const [cycle, setCycle] = useState("28");
  const c = clampNum(cycle, 21, 45);
  const cErr = cycle !== "" && c === null ? "Enter 21–45 days" : null;

  const result = useMemo(() => {
    if (!lmp || c === null) return null;
    const d = new Date(lmp);
    if (Number.isNaN(d.getTime())) return null;
    const ov = new Date(d.getTime() + (c - 14) * 86400000);
    const start = new Date(ov.getTime() - 5 * 86400000);
    const end = new Date(ov.getTime() + 1 * 86400000);
    const nextLmp = new Date(d.getTime() + c * 86400000);
    return { ov: fmtDate(ov), window: `${fmtDate(start)} → ${fmtDate(end)}`, nextLmp: fmtDate(nextLmp) };
  }, [lmp, c]);

  return (
    <CalcShell icon={Calculator} title="Ovulation & Fertile Window" subtitle="Calendar method (regular cycles)">
      <div className="space-y-2">
        <div>
          <Label htmlFor="ov-lmp" className="text-xs">First day of last period</Label>
          <Input
            id="ov-lmp"
            type="date"
            value={lmp}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => setLmp(e.target.value)}
            className="h-9 mt-1"
          />
        </div>
        <div>
          <Label htmlFor="ov-c" className="text-xs">Cycle length (days)</Label>
          <Input id="ov-c" type="number" inputMode="numeric" min={21} max={45} value={cycle} onChange={(e) => setCycle(e.target.value)} className="h-9 mt-1" />
          <FieldError msg={cErr} />
        </div>
      </div>
      {result && (
        <>
          <ResultBox label="Estimated ovulation" value={result.ov} tone="success" />
          <ResultBox label="Fertile window" value={result.window} hint="Highest conception probability — intercourse every 1–2 d." />
          <ResultBox label="Next expected period" value={result.nextLmp} tone="info" />
        </>
      )}
    </CalcShell>
  );
}

/* ---------- Gonadotropin / IVF ---------- */

export function GonadotropinCalculator() {
  const [amh, setAmh] = useState("2.5");
  const [age, setAge] = useState("32");
  const [bmi, setBmi] = useState("24");

  const a = clampNum(amh, 0, 20);
  const y = clampNum(age, 18, 50);
  const b = clampNum(bmi, 15, 50);

  const errs = {
    amh: amh !== "" && a === null ? "0–20 ng/mL" : null,
    age: age !== "" && y === null ? "18–50 yr" : null,
    bmi: bmi !== "" && b === null ? "15–50" : null,
  };

  const dose = useMemo(() => {
    if (a === null || y === null || b === null) return null;
    let d = 150;
    if (a < 1) d = 300;
    else if (a < 2) d = 225;
    else if (a < 4) d = 187;
    else if (a < 7) d = 150;
    else d = 112;
    if (y >= 38) d += 25;
    if (b >= 30) d += 25;
    return Math.min(d, 450);
  }, [a, y, b]);

  const risk =
    a !== null && a > 5
      ? { t: "High OHSS risk — antagonist + agonist trigger", tone: "warning" as const }
      : a !== null && a < 1
      ? { t: "Poor responder — consider DuoStim / dual trigger", tone: "danger" as const }
      : { t: "Normal responder", tone: "success" as const };

  return (
    <CalcShell icon={Calculator} title="FSH Starting Dose" subtitle="IVF stimulation — La Marca / Nelson nomogram">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label htmlFor="g-amh" className="text-xs">AMH</Label>
          <Input id="g-amh" type="number" inputMode="decimal" step="0.1" min={0} max={20} value={amh} onChange={(e) => setAmh(e.target.value)} className="h-9 mt-1" />
          <FieldError msg={errs.amh} />
        </div>
        <div>
          <Label htmlFor="g-age" className="text-xs">Age</Label>
          <Input id="g-age" type="number" inputMode="numeric" min={18} max={50} value={age} onChange={(e) => setAge(e.target.value)} className="h-9 mt-1" />
          <FieldError msg={errs.age} />
        </div>
        <div>
          <Label htmlFor="g-bmi" className="text-xs">BMI</Label>
          <Input id="g-bmi" type="number" inputMode="decimal" min={15} max={50} value={bmi} onChange={(e) => setBmi(e.target.value)} className="h-9 mt-1" />
          <FieldError msg={errs.bmi} />
        </div>
      </div>
      {dose !== null && (
        <>
          <ResultBox label="Suggested starting FSH" value={`${dose} IU/day`} hint="Adjust per follicle response on day 5–6." tone="info" />
          <ResultBox label="Protocol consideration" value={risk.t} tone={risk.tone} />
        </>
      )}
      <div className="text-[10px] text-muted-foreground p-2 rounded-lg bg-muted/40 leading-relaxed">
        Educational nomogram — adjust per AFC, prior response, and local protocol.
      </div>
    </CalcShell>
  );
}
