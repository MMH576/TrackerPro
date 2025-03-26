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
  CheckSquare, ListChecks, ClipboardList 
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
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Task Manager
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pb-1">
        {/* Task input form */}
        <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Add a new task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={!newTaskTitle.trim()}>
            <PlusCircle className="h-4 w-4 mr-1" />
            Add
          </Button>
        </form>
        
        {/* Task stats */}
        <div className="flex justify-between text-sm text-muted-foreground mb-3">
          <div>
            {activeTasks} active / {completedTasks} completed
          </div>
          {completedTasks > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearCompletedTasks} 
              className="h-auto py-0 px-1 text-xs"
            >
              Clear completed
            </Button>
          )}
        </div>
        
        {/* Task list */}
        <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
          {tasks.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <ListChecks className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p>No tasks yet. Add one to get started!</p>
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
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="w-full">
          <Separator className="my-2" />
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckSquare className="h-4 w-4" />
              {totalTasks} total task{totalTasks !== 1 ? 's' : ''}
            </div>
            <div>
              Focus on one task during each Pomodoro session
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
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
      className={`flex items-center gap-2 p-2 rounded-md border transition-colors ${
        task.completed ? 'bg-muted/30 border-muted' : 'bg-background border-input hover:border-accent'
      }`}
    >
      <div className="flex-shrink-0">
        <Checkbox 
          checked={task.completed} 
          onCheckedChange={() => onToggle()}
          className={task.completed ? 'data-[state=checked]:bg-green-500' : ''}
        />
      </div>
      
      <div 
        className={`flex-1 text-sm ${
          task.completed ? 'text-muted-foreground line-through' : ''
        }`}
      >
        {task.title}
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="h-7 w-7 p-0 rounded-full opacity-60 hover:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </motion.div>
  );
} 