'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useTaskContext, Task } from '@/contexts/task-context';
import {
  PlusCircle, X, Check, Trash2,
  CheckSquare, ListChecks, ClipboardList, Clock
} from 'lucide-react';

export function TaskManager() {
  const {
    tasks,
    addTask,
    toggleTaskCompletion,
    deleteTask,
    clearCompletedTasks
  } = useTaskContext();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate task stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const activeTasks = totalTasks - completedTasks;

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();

    if (newTaskTitle.trim()) {
      addTask(newTaskTitle);
      setNewTaskTitle('');

      // Focus back on input after adding
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  // Animation variants for list items
  const taskItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -10 }
  };

  return (
    <div className="w-full">
      {/* Task input form */}
      <form onSubmit={handleAddTask} className="flex gap-3 mb-6">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Add a new task..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className="flex-1 h-12"
        />
        <Button
          type="submit"
          size="default"
          disabled={!newTaskTitle.trim()}
          className="h-12 px-5"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Add
        </Button>
      </form>

      {/* Task stats */}
      <div className="flex justify-between text-sm mb-4">
        <div className="flex items-center bg-muted/40 rounded-md px-3 py-1.5">
          <div className="flex items-center mr-3">
            <ListChecks className="h-4 w-4 mr-1.5 text-primary" />
            <span className="font-medium">{activeTasks}</span> active
          </div>
          <div className="flex items-center">
            <CheckSquare className="h-4 w-4 mr-1.5 text-muted-foreground" />
            <span className="font-medium">{completedTasks}</span> completed
          </div>
        </div>
        {completedTasks > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearCompletedTasks}
            className="h-8"
          >
            <X className="h-4 w-4 mr-1.5" />
            Clear completed
          </Button>
        )}
      </div>

      {/* Task list */}
      <div className="rounded-lg border bg-card">
        <div className="p-1">
          <div className="space-y-2 max-h-[360px] overflow-y-auto p-2">
            {tasks.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <ListChecks className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-lg font-medium mb-1">No tasks yet</p>
                <p className="text-sm">Add one to get started!</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={() => toggleTaskCompletion(task.id)}
                    onDelete={() => deleteTask(task.id)}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        <Separator />

        <div className="p-3 flex justify-between items-center text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CheckSquare className="h-4 w-4" />
            <span>{totalTasks} total task{totalTasks !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1.5" />
            <span>Focus on one task per Pomodoro session</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TaskItemProps {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}

function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  // Animation variants for task items
  const taskItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -10 }
  };

  return (
    <motion.div
      variants={taskItemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      className={`flex items-center gap-3 p-3 rounded-md border transition-colors ${task.completed ? 'bg-muted/30 border-muted' : 'bg-background border-input hover:border-accent'
        }`}
    >
      <div className="flex-shrink-0">
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggle()}
          className={task.completed ? 'data-[state=checked]:bg-green-500 h-5 w-5' : 'h-5 w-5'}
        />
      </div>

      <div
        className={`flex-1 ${task.completed ? 'text-muted-foreground line-through' : ''
          }`}
      >
        {task.title}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="h-8 w-8 p-0 rounded-full opacity-60 hover:opacity-100 hover:bg-red-500/10 transition-colors"
      >
        <Trash2 className="h-4 w-4 text-red-500/70" />
      </Button>
    </motion.div>
  );
} 