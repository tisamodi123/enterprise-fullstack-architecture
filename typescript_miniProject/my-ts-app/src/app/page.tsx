
"use client";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Task, TaskStatus } from "@/types";
import { useState } from "react";
import { TaskForm } from '@/components/TaskForm';
import { TaskCard } from '@/components/TaskCard';

export default function Dashboard(){
  const[tasks,setTasks]=useLocalStorage<Task[]>('my-tasks',[]);
  const[filter,setFilter]=useState<TaskStatus | 'All'>('All');

  const deleteTask=(id:string)=>{
    setTasks(tasks.filter(t=>t.id !==id));
  };

  const addTask=(newTask:Task)=>{
    setTasks([...tasks,newTask]);
  }
  const filteredTasks=filter==='All' ? tasks : tasks.filter(t=>t.status===filter);

    return (
        <div className="max-w-4xl mx-auto p-6">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-extrabold">TaskMaster TS</h1>
                
                {/* Filter Union Practice */}
                <select 
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="border p-2 rounded"
                >
                    <option value="All">All Tasks</option>
                    <option value="Todo">Todo</option>
                    <option value="In-Progress">In-Progress</option>
                    <option value="Completed">Completed</option>
                </select>
            </header>

            <TaskForm onAddTask={addTask} />

             {filter !== 'All' && filteredTasks.length === 0 && (
                <p className="text-amber-600 mb-4 bg-amber-50 p-2 rounded text-sm">
                    Note: Is waqt aapne filter '{filter}' lagaya hua hai. Naye tasks hamesha 'Todo' mein add hote hain!
                </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTasks.length > 0 ? (
                    filteredTasks.map(task => (
                        <TaskCard key={task.id} task={task} onDelete={deleteTask} />
                    ))
                ) : (
                    <p className="text-gray-500">No tasks found. Add some!</p>
                )}
            </div>
        </div>
    );
}