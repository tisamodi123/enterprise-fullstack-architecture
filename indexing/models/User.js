import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    // userId: {
    //     type: Number,
    //     required: true,
    //     unique: true 
    // },
    name: {
        type: String,
        required: true,
       
    },
    email: {
        type: String,
        required: true,
        unique: true ,
        index:true
    },
    city: {
        type: String
    },
    age: {
        type: Number
    }
},{timestamps:true,versionKey:false});



const User = mongoose.model('User', userSchema);

export default User; 

