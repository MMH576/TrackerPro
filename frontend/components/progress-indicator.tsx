'use client';

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  className?: string;
  value: number;
  label: string;
}

export function ProgressIndicator({ className, value, label }: ProgressIndicatorProps) {
  return (
    <div className={cn("rounded-lg bg-card p-4 shadow-sm border", className)}>
      <h2 className="text-lg font-semibold text-muted-foreground mb-1">{label}</h2>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-4xl font-bold">{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
} 