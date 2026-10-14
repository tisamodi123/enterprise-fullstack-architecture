const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  taskId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Task', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  userIp: { type: String, required: true },
  action: { 
    type: String, 
    required: true // e.g., "CREATED_TASK", "UPDATED_STATUS", "UPDATED_DESCRIPTION" 
  },
  details: { 
    type: String // e.g., "Status changed from Pending to In Progress" 
  }
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);