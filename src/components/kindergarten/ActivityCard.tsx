import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ActivityCardProps = {
  title: string;
  category: string;
  startsAt: string;
};

export function ActivityCard({ title, category, startsAt }: ActivityCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <p>الفئة: {category}</p>
        <p>الوقت: {startsAt}</p>
      </CardContent>
    </Card>
  );
}
