import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator, Baby, Heart, Droplet, Activity, Scale } from "lucide-react";

function ResultBox({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="mt-3 p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
      <p className="text-[10px] uppercase tracking-wider font-bold text-primary/70">{label}</p>
      <p className="text-base font-black text-foreground mt-0.5">{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{hint}</p>}
    </div>
  );
}

function CalcShell({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <Card className="p-4 space-y-3 border-border/50">
      <div className="flex items-center gap-2 pb-2 border-b border-border/40">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-primary/70">
          <Icon className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>
      {children}
    </Card>
  );
}

export function EDDCalculator() {
  const [lmp, setLmp] = useState("");
  const [cycle, setCycle] = useState("28");
  const result = useMemo(() => {
    if (!lmp) return null;
    const d = new Date(lmp);
    if (isNaN(d.getTime())) return null;
    const adj = parseInt(cycle) - 28;
    const edd = new Date(d.getTime() + (280 + adj) * 86400000);
    const today = new Date();
    const ga = Math.floor((today.getTime() - d.getTime()) / 86400000);
    const wk = Math.floor(ga / 7);
    const day = ga % 7;
    return { edd: edd.toDateString(), ga: `${wk}+${day} weeks` };
  }, [lmp, cycle]);

  return (
    <CalcShell icon={Baby} title="EDD & Gestational Age (Naegele)">
      <div className="space-y-2">
        <div>
          <Label className="text-xs">LMP (first day)</Label>
          <Input type="date" value={lmp} onChange={(e) => setLmp(e.target.value)} className="h-9 mt-1" />
        </div>
        <div>
          <Label className="text-xs">Cycle length (days)</Label>
          <Input type="number" value={cycle} onChange={(e) => setCycle(e.target.value)} className="h-9 mt-1" />
        </div>
      </div>
      {result && (
        <>
          <ResultBox label="Estimated Due Date" value={result.edd} />
          <ResultBox label="Current GA" value={result.ga} hint="Confirm with first-trimester US (CRL) for accuracy" />
        </>
      )}
    </CalcShell>
  );
}

export function BishopCalculator() {
  const [scores, setScores] = useState({ dilation: 0, effacement: 0, station: 0, consistency: 0, position: 0 });
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const verdict = total >= 8 ? "Favorable — IOL likely successful" : total >= 6 ? "Intermediate — consider ripening" : "Unfavorable — cervical ripening needed";
  const fields: { key: keyof typeof scores; label: string; opts: { v: number; l: string }[] }[] = [
    { key: "dilation", label: "Dilation (cm)", opts: [{ v: 0, l: "Closed" }, { v: 1, l: "1–2" }, { v: 2, l: "3–4" }, { v: 3, l: "≥5" }] },
    { key: "effacement", label: "Effacement (%)", opts: [{ v: 0, l: "0–30" }, { v: 1, l: "40–50" }, { v: 2, l: "60–70" }, { v: 3, l: "≥80" }] },
    { key: "station", label: "Station", opts: [{ v: 0, l: "−3" }, { v: 1, l: "−2" }, { v: 2, l: "−1/0" }, { v: 3, l: "+1/+2" }] },
    { key: "consistency", label: "Consistency", opts: [{ v: 0, l: "Firm" }, { v: 1, l: "Medium" }, { v: 2, l: "Soft" }] },
    { key: "position", label: "Position", opts: [{ v: 0, l: "Posterior" }, { v: 1, l: "Mid" }, { v: 2, l: "Anterior" }] },
  ];
  return (
    <CalcShell icon={Activity} title="Bishop Score (Cervical Favorability)">
      <div className="space-y-2.5">
        {fields.map((f) => (
          <div key={f.key}>
            <Label className="text-xs">{f.label}</Label>
            <div className="flex gap-1 mt-1 flex-wrap">
              {f.opts.map((o) => (
                <button
                  key={o.v}
                  onClick={() => setScores({ ...scores, [f.key]: o.v })}
                  className={`px-2 py-1 rounded-md text-[10px] font-semibold border transition ${scores[f.key] === o.v ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/50 text-muted-foreground"}`}
                >
                  {o.l} <span className="opacity-60">({o.v})</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <ResultBox label="Total Score" value={`${total} / 13`} hint={verdict} />
    </CalcShell>
  );
}

export function ApgarCalculator() {
  const [s, setS] = useState({ appearance: 2, pulse: 2, grimace: 2, activity: 2, respiration: 2 });
  const total = Object.values(s).reduce((a, b) => a + b, 0);
  const verdict = total >= 7 ? "Reassuring" : total >= 4 ? "Moderately depressed — needs intervention" : "Severely depressed — resuscitation";
  const fields: { key: keyof typeof s; label: string; opts: string[] }[] = [
    { key: "appearance", label: "Appearance (color)", opts: ["Blue/pale", "Body pink, extremities blue", "All pink"] },
    { key: "pulse", label: "Pulse", opts: ["Absent", "<100", "≥100"] },
    { key: "grimace", label: "Grimace (reflex)", opts: ["No response", "Grimace", "Cry/cough"] },
    { key: "activity", label: "Activity (tone)", opts: ["Limp", "Some flexion", "Active motion"] },
    { key: "respiration", label: "Respiration", opts: ["Absent", "Slow/irregular", "Strong cry"] },
  ];
  return (
    <CalcShell icon={Heart} title="APGAR Score (1 & 5 min)">
      <div className="space-y-2.5">
        {fields.map((f) => (
          <div key={f.key}>
            <Label className="text-xs">{f.label}</Label>
            <div className="flex gap-1 mt-1">
              {f.opts.map((o, i) => (
                <button
                  key={i}
                  onClick={() => setS({ ...s, [f.key]: i })}
                  className={`flex-1 px-1 py-1.5 rounded-md text-[9px] font-semibold border transition leading-tight ${s[f.key] === i ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/50 text-muted-foreground"}`}
                >
                  {o} <div className="opacity-60">({i})</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <ResultBox label="Total APGAR" value={`${total} / 10`} hint={verdict} />
    </CalcShell>
  );
}

export function MgSO4Calculator() {
  const [weight, setWeight] = useState("70");
  const w = parseFloat(weight) || 0;
  return (
    <CalcShell icon={Droplet} title="MgSO4 (Eclampsia/Severe PET)">
      <div>
        <Label className="text-xs">Maternal weight (kg)</Label>
        <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="h-9 mt-1" />
      </div>
      <ResultBox label="Loading dose" value="4 g IV over 5–10 min" hint="Dilute in 100 mL saline. Pritchard regimen: + 10 g IM (5 g each buttock)." />
      <ResultBox label="Maintenance" value="1 g/h IV infusion (or 5 g IM q4h)" hint="Continue 24 h post-delivery / last seizure" />
      <ResultBox label="Recurrent seizure" value={`${(w >= 70 ? 4 : 2)} g IV over 5 min`} hint="Toxicity antidote: Calcium gluconate 1 g IV slow" />
      <div className="text-[10px] text-muted-foreground p-2 rounded-lg bg-muted/40">
        <strong>Monitor:</strong> reflexes, RR &gt;12, urine &gt;25 mL/h, SpO2. Reduce dose if oliguria or renal impairment.
      </div>
    </CalcShell>
  );
}

export function BMICalculator() {
  const [w, setW] = useState("70");
  const [h, setH] = useState("165");
  const bmi = useMemo(() => {
    const W = parseFloat(w);
    const H = parseFloat(h) / 100;
    if (!W || !H) return null;
    return W / (H * H);
  }, [w, h]);
  const cat = bmi ? (bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : bmi < 35 ? "Obese I" : bmi < 40 ? "Obese II" : "Obese III") : "";
  const gain = bmi ? (bmi < 18.5 ? "12.5–18 kg" : bmi < 25 ? "11.5–16 kg" : bmi < 30 ? "7–11.5 kg" : "5–9 kg") : "";
  return (
    <CalcShell icon={Scale} title="Pre-pregnancy BMI & Weight Gain (IOM)">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Weight (kg)</Label>
          <Input type="number" value={w} onChange={(e) => setW(e.target.value)} className="h-9 mt-1" />
        </div>
        <div>
          <Label className="text-xs">Height (cm)</Label>
          <Input type="number" value={h} onChange={(e) => setH(e.target.value)} className="h-9 mt-1" />
        </div>
      </div>
      {bmi && (
        <>
          <ResultBox label="BMI" value={`${bmi.toFixed(1)} kg/m² — ${cat}`} />
          <ResultBox label="Recommended gestational gain" value={gain} hint="IOM 2009 — singleton pregnancy" />
        </>
      )}
    </CalcShell>
  );
}

export function OvulationCalculator() {
  const [lmp, setLmp] = useState("");
  const [cycle, setCycle] = useState("28");
  const result = useMemo(() => {
    if (!lmp) return null;
    const d = new Date(lmp);
    if (isNaN(d.getTime())) return null;
    const c = parseInt(cycle);
    const ov = new Date(d.getTime() + (c - 14) * 86400000);
    const start = new Date(ov.getTime() - 5 * 86400000);
    const end = new Date(ov.getTime() + 1 * 86400000);
    return { ov: ov.toDateString(), window: `${start.toDateString()} → ${end.toDateString()}` };
  }, [lmp, cycle]);
  return (
    <CalcShell icon={Calculator} title="Ovulation & Fertile Window">
      <div className="space-y-2">
        <div>
          <Label className="text-xs">First day of last period</Label>
          <Input type="date" value={lmp} onChange={(e) => setLmp(e.target.value)} className="h-9 mt-1" />
        </div>
        <div>
          <Label className="text-xs">Cycle length (days)</Label>
          <Input type="number" value={cycle} onChange={(e) => setCycle(e.target.value)} className="h-9 mt-1" />
        </div>
      </div>
      {result && (
        <>
          <ResultBox label="Estimated ovulation" value={result.ov} />
          <ResultBox label="Fertile window" value={result.window} hint="Highest conception probability" />
        </>
      )}
    </CalcShell>
  );
}

export function GonadotropinCalculator() {
  const [amh, setAmh] = useState("2.5");
  const [age, setAge] = useState("32");
  const [bmi, setBmi] = useState("24");
  const dose = useMemo(() => {
    const a = parseFloat(amh), y = parseFloat(age), b = parseFloat(bmi);
    if (!a || !y || !b) return null;
    // Simplified La Marca / Nelson nomogram approximation
    let d = 150;
    if (a < 1) d = 300;
    else if (a < 2) d = 225;
    else if (a < 4) d = 187;
    else if (a < 7) d = 150;
    else d = 112;
    if (y >= 38) d += 25;
    if (b >= 30) d += 25;
    return Math.min(d, 450);
  }, [amh, age, bmi]);
  const risk = parseFloat(amh) > 5 ? "High OHSS risk — antagonist + agonist trigger" : parseFloat(amh) < 1 ? "Poor responder — consider DuoStim / dual trigger" : "Normal responder";
  return (
    <CalcShell icon={Calculator} title="FSH Starting Dose (IVF Stimulation)">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs">AMH</Label>
          <Input type="number" step="0.1" value={amh} onChange={(e) => setAmh(e.target.value)} className="h-9 mt-1" />
        </div>
        <div>
          <Label className="text-xs">Age</Label>
          <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="h-9 mt-1" />
        </div>
        <div>
          <Label className="text-xs">BMI</Label>
          <Input type="number" value={bmi} onChange={(e) => setBmi(e.target.value)} className="h-9 mt-1" />
        </div>
      </div>
      {dose && (
        <>
          <ResultBox label="Suggested starting FSH" value={`${dose} IU/day`} hint="Adjust per follicle response on day 5–6" />
          <ResultBox label="Protocol consideration" value={risk} />
        </>
      )}
      <div className="text-[10px] text-muted-foreground p-2 rounded-lg bg-muted/40">
        Educational nomogram only — adjust per AFC, prior response, and local protocol.
      </div>
    </CalcShell>
  );
}
