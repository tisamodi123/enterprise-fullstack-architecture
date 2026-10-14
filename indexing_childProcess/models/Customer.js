import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
    customerId: { type: Number, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    company: { type: String },
    phone: { type: String }
},{timeseries:true,versionKey:false});

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;


