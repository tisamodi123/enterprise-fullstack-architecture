const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: [true, 'Task title is required'], 
      trim: true 
    },
    description: { 
      type: String, 
      trim: true 
    },
    status: { 
      type: String, 
      enum: ['Pending', 'In Progress', 'Completed'], 
      default: 'Pending' 
    },
    // Agar null hai toh Main Task, agar ID hai toh kisi ka Subtask
    parentTaskId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Task', 
      default: null 
    },
    // LOGGED-IN USER KI ID YAHAN JUDEGI
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // User model se rishta
      required: true
    },
    // JISNE LAST TIME UPDATE KIYA USKI ID
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }, 
  { timestamps: true }
);

module.exports = mongoose.model('Task', TaskSchema);