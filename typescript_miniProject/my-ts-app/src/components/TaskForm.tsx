'use client';
import { useState, FormEvent } from 'react';
import { Task, TaskStatus, Priority } from '@/types';

interface TaskFormProps {
    onAddTask: (task: Task) => void;
}

export const TaskForm = ({ onAddTask }: TaskFormProps) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<Priority>('Medium');

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!title.trim()) return alert("Title zaroori hai!");

        const newTask: Task = {
            id: Date.now().toString(), // Simple unique ID
            title,
            description,
            status: 'Todo', // Naya task hamesha 'Todo' hoga
            priority,
            createdAt: new Date()
        };

        onAddTask(newTask);

        // Form reset karne ke liye
        setTitle('');
        setDescription('');
        setPriority('Medium');
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded-lg bg-gray-50 mb-6 grid gap-3">
            <h3 className="font-bold text-lg">Add New Task</h3>
            
            <input 
                type="text" 
                placeholder="Task Title..." 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="p-2 border rounded w-full text-black"
            />

            <textarea 
                placeholder="Description..." 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="p-2 border rounded w-full text-black"
            />

            <div className="flex gap-4 items-center">
                <label className="text-sm font-medium text-black">Priority:</label>
                <select 
                    value={priority} 
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="p-2 border rounded text-black"
                >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                </select>

                <button type="submit" className="ml-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Add Task
                </button>
            </div>
        </form>
    );
};