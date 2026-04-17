import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { EXAMS } from "@/data/examsData";

export default function ExamsCompare() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/exams" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Exam Hub
          </Link>
          <Badge variant="secondary">Side-by-side comparison</Badge>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground">Compare All Gulf OB/GYN Exams</h1>
          <p className="text-muted-foreground text-sm">
            Authority · Platform · Format · Fees · Validity — at a glance.
          </p>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr className="text-left">
                  <th className="p-3 font-semibold text-foreground sticky left-0 bg-muted/50 z-10">Exam</th>
                  <th className="p-3 font-semibold text-foreground">Country</th>
                  <th className="p-3 font-semibold text-foreground">Platform</th>
                  <th className="p-3 font-semibold text-foreground">Questions</th>
                  <th className="p-3 font-semibold text-foreground">Duration</th>
                  <th className="p-3 font-semibold text-foreground">Pass Mark</th>
                  <th className="p-3 font-semibold text-foreground">Fee (USD)</th>
                  <th className="p-3 font-semibold text-foreground">Validity</th>
                  <th className="p-3 font-semibold text-foreground">Register</th>
                </tr>
              </thead>
              <tbody>
                {EXAMS.map((e, i) => (
                  <tr
                    key={e.id}
                    className={`border-b border-border hover:bg-accent/5 transition-colors ${
                      i % 2 === 0 ? "bg-background" : "bg-muted/20"
                    }`}
                  >
                    <td className="p-3 sticky left-0 bg-inherit">
                      <div className="font-semibold text-foreground text-xs leading-tight">
                        {e.examName}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{e.authority}</div>
                    </td>
                    <td className="p-3">
                      <span className="text-base mr-1">{e.flag}</span>
                      <span className="text-xs">{e.country}</span>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant="outline"
                        className={
                          e.platform === "Pearson VUE"
                            ? "border-primary text-primary text-[10px]"
                            : "border-accent text-accent text-[10px]"
                        }
                      >
                        {e.platform}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono text-xs">{e.questions}</td>
                    <td className="p-3 text-xs">{e.duration}</td>
                    <td className="p-3 text-xs">{e.passMark}</td>
                    <td className="p-3 font-mono text-xs">{e.feeUSD}</td>
                    <td className="p-3 text-xs">
                      {e.validityYears === "lifetime" ? "Lifetime" : `${e.validityYears} yrs`}
                    </td>
                    <td className="p-3">
                      <Button asChild size="sm" variant="ghost">
                        <a href={e.registerUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5 bg-info-soft border-info/30">
          <h3 className="font-serif text-lg text-foreground mb-2">Key insights</h3>
          <ul className="text-sm space-y-1.5 text-foreground/80 list-disc pl-5">
            <li><strong>Pearson VUE</strong> hosts: SCFHS (Saudi), DOH (Abu Dhabi), MRCOG (1/2), ABOG.</li>
            <li><strong>Prometric</strong> hosts: DHA, MOHAP, DHCC, QCHP, KMLE, NHRA.</li>
            <li><strong>OMSB</strong> (Oman) is the only one with lifetime validity for the licence assessment.</li>
            <li><strong>MRCOG Part 3</strong> (OSCE) is the only practical/in-person exam in the list.</li>
            <li>Most Gulf exams use the same syllabus core (RCOG/ACOG/Williams) — practice transfers across.</li>
          </ul>
        </Card>

        <div className="flex justify-center">
          <Button asChild size="lg">
            <Link to="/exams">Pick an exam to simulate →</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
