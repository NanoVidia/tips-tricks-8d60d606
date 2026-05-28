import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ChildCardProps = {
  name: string;
  age: number;
  guardianName: string;
};

export function ChildCard({ name, age, guardianName }: ChildCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{name}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <p>العمر: {age}</p>
        <p>ولي الأمر: {guardianName}</p>
      </CardContent>
    </Card>
  );
}
