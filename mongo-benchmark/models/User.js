const mongoose = require('mongoose');

const userSchema=new mongoose.Schema({
    userId: { 
        type: Number, 
        required: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, // UNIQUE INDEX (Automatic duplicate entry block)
        sparse: true  // SPARSE INDEX (Null values not showing into index)
    },
    city: { 
        type: String, 
        required: true 
    },
    age: { 
        type: Number, 
        required: true 
    },
    tags: { 
        type: String, // we use text format  "tech,coding"
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now,
        expires: 3600 // TTL INDEX (after 1h data delete automaticlly)
    }
});

//advanced indexing

//COMPOUND INDEX 
userSchema.index({city:1,age:1});

//text index
userSchema.index({tags:"text"});

//partial index
userSchema.index({age:1},{
    partialFilterExpression:{age:{$gt:30}},
    name:"age_partial_index"
});

const User = mongoose.model('User', userSchema);
module.exports = User;