import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const progressData = [
  { month: "Jan", score: 70 },
  { month: "Feb", score: 74 },
  { month: "Mar", score: 80 },
  { month: "Apr", score: 85 },
];

export function ReportChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>تطور الأداء الشهري</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={progressData}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="score" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
