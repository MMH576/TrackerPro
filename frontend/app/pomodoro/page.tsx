import { PomodoroTimer } from '@/components/pomodoro-timer';
import { PomodoroProvider } from '@/contexts/pomodoro-context';

export const metadata = {
  title: 'Pomodoro Timer | TrackerPro',
  description: 'Focus on your tasks with the Pomodoro technique',
};

export default function PomodoroPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Pomodoro Timer</h1>
      <p className="text-muted-foreground mb-8">
        Stay focused and productive with the Pomodoro technique. 
        Work for 25 minutes, then take a 5-minute break.
      </p>
      <PomodoroProvider>
        <PomodoroTimer />
      </PomodoroProvider>
    </div>
  );
} 