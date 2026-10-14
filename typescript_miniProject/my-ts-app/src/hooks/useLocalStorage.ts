import { useState } from "react";

export function useLocalStorage<T>(key:string,initialvalue:T){
    const[storedValue,setStoredValue]=useState<T>(()=>{
        if(typeof window==="undefined") return initialvalue;
        const item=window.localStorage.getItem(key);
        return item ? JSON.parse(item):initialvalue;
    });

    const setValue=(value:T)=>{
        setStoredValue(value);
        window.localStorage.setItem(key,JSON.stringify(value));
    };

    return [storedValue, setValue] as const;
}