export type TaskStatus='Todo' | 'In-Progress' | 'Completed';
export type Priority='Low' | 'Medium' | 'High';

export interface Task{
    id:string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: Priority;
    createdAt: Date;
}

export interface DataResponse<T>{
    data:T;
    loading:boolean;
    error:String | null;
}