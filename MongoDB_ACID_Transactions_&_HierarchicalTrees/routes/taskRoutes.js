const express = require('express');
const router = express.Router();


const { 
  createTask, 
  getMainTasks, 
  getSubtasks, 
  getAllTasksTree, 
  updateTask 
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

//Routes ke beech mein 'protect' middleware bitha do
router.post('/', protect, createTask);               // Ab bina login ke task nahi banega
router.get('/main', protect, getMainTasks);          // Bina login ke main tasks nahi dikhenge
router.get('/tree', protect, getAllTasksTree);        // Bina login ke poora tree nahi dikhega
router.get('/:parentId/subtasks', protect, getSubtasks); 
router.put('/:taskId', protect, updateTask);         // Bina login ke update nahi hoga

module.exports = router;