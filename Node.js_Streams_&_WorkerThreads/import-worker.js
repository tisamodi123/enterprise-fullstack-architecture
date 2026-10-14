import mongoose from "mongoose";
import { workerData ,parentPort} from "worker_threads";
import fs from 'fs/promises';
import User from "./models/User.js";


async function startWorker() {
    const{filePath}=workerData;
    try {
        if(mongoose.connection.readyState===0){
            await mongoose.connect('mongodb://localhost:27017/indexingPerform');
        }

        const fileData=await fs.readFile(filePath,'utf-8');
        const usersArray=JSON.parse(fileData);

        const chunkSize=10000;
        const databasePromises=[];

        for(let i=0;i<usersArray.length;i+=chunkSize){
            const chunk=usersArray.slice(i,i+chunkSize);

            const chunkOps=chunk.map(user=>({
                updateOne:{
                    filter:{email:user.email},
                    update:{$set:user},
                    upsert:true
                }
            }));

            databasePromises.push(User.collection.bulkWrite(chunkOps));
        }

        await Promise.allSettled(databasePromises);

        // File Cleanup
                await fs.unlink(filePath);
                
                // Database disconnect aur Main Thread ko success message bhejna
                await mongoose.disconnect();
                parentPort.postMessage({ success: true, count: usersArray.length });
    } catch (error) {
        // Kisi bhi error ke case mein cleanup aur Main thread ko fail message bhejna
                try { await mongoose.disconnect(); } catch (e) {}
                parentPort.postMessage({ success: false, error: error.message });
    }
}
// Worker ko turant start karne ke liye call kiya
startWorker();

