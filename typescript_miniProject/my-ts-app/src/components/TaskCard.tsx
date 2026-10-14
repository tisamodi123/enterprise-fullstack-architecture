import { Task } from '@/types';

interface TaskCardProps{
    task:Task;
    onDelete:(id:string)=>void //function type
}

export const TaskCard=({task,onDelete}:TaskCardProps)=>{
    const priorityColor = {
        High: 'text-red-500',
        Medium: 'text-yellow-500',
        Low: 'text-green-500'
    };

    return (
         <div className="p-4 border rounded-lg shadow-sm bg-white mb-3">
            <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg">{task.title}</h3>
                <span className={`text-xs font-bold ${priorityColor[task.priority]}`}>
                    {task.priority.toUpperCase()}
                </span>
            </div>
            <p className="text-gray-600 text-sm">{task.description}</p>
            <div className="mt-4 flex justify-between items-center">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {task.status}
                </span>
                <button 
                    onClick={() => onDelete(task.id)}
                    className="text-red-400 hover:text-red-600 text-sm"
                >
                    Delete
                </button>
            </div>
        </div>

);
};
