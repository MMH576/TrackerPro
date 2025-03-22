'use client';

import { Progress } from "@/components/ui/progress";

interface ProgressIndicatorProps {
  value: number;
  label: string;
}

export function ProgressIndicator({ value, label }: ProgressIndicatorProps) {
  return (
    <div className="bg-muted p-3 rounded-lg">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="flex items-center gap-2">
        <div className="text-2xl font-bold">{value}%</div>
        <Progress value={value} className="w-24 h-2" />
      </div>
    </div>
  );
} 