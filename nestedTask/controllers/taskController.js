const mongoose = require('mongoose');
const Task = require('../models/taskModel');
const ActivityLog = require('../models/activityLogModel');

// CREATE TASK / SUBTASK CONTROLLER 
const createTask = async (req, res) => {
  try {
    const { title, description, parentTaskId } = req.body;

    const newTask = new Task({
      title,
      description,
      parentTaskId: parentTaskId || null,
      createdBy: req.user.id, // Logged-in user ki id gayi
      updatedBy: req.user.id,  // Pehli baar bana hai toh updatedBy bhi wahi hoga
      userIp: req.ip
    });

    const savedTask = await newTask.save();

    // Save hote hi Activity Log mein entry daal do
    await ActivityLog.create({
      taskId: savedTask._id,
      userId: req.user.id,
      action: 'CREATE',
      details: `Task "${title}" was created.`,
      userIp: req.ip
    });


    res.status(201).json({ success: true, data: savedTask });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// GET ALL MAIN TASKS 
const getMainTasks = async (req, res) => {
  try {
    const mainTasks = await Task.find({ parentTaskId: null });
    res.status(200).json({ success: true, count: mainTasks.length, data: mainTasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

//GET IMMEDIATE SUBTASKS OF A SPECIFIC TASK 
const getSubtasks = async (req, res) => {
  try {
    const { parentId } = req.params;
    const subtasks = await Task.find({ parentTaskId: parentId });
    res.status(200).json({ success: true, count: subtasks.length, data: subtasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

//update task
// const updateTask = async (req, res) => {
//   try {
//     const { taskId } = req.params;
//     const { title, description, status } = req.body;

//     // Pehle purana task dhoondo taaki purani history pata chale
//     const oldTask = await Task.findById(taskId);
//     if (!oldTask) return res.status(404).json({ success: false, error: "Task not found" });

//     // 2. Task ko update karo aur updatedBy mein naye logged-in user ki ID daal do
//     oldTask.title = title || oldTask.title;
//     oldTask.description = description || oldTask.description;

//     let detailsMessage = "Task details updated.";
//     if (status && status !== oldTask.status) {
//       detailsMessage = `Status changed from ${oldTask.status} to ${status}`;
//       oldTask.status = status;
//     }

//     oldTask.updatedBy = req.user.id; // Kisne update kiya uski ID update ho gayi!
//     const updatedTask = await oldTask.save();

//     //  Activity Log mein entry daal do
//     await ActivityLog.create({
//       taskId: updatedTask._id,
//       userId: req.user.id,
//       action: 'UPDATE',
//       details: detailsMessage,
//       userIp: req.ip
//     });

//     res.status(200).json({ success: true, data: updatedTask });
//   } catch (error) {
//     res.status(400).json({ success: false, error: error.message });
//   }
// };

//update task with transaction 
const updateTask = async (req, res) => {
  // 1. Database ka ek naya session shuru karo
  const session = await mongoose.startSession();

  try {
    // 2. Transaction ko start karo
    session.startTransaction();

    const { taskId } = req.params;
    const { title, description, status } = req.body;

    // 3. ⚠️ IMPORTANT: Saari queries mein { session } pass karna mandatory hai
    const currentTask = await Task.findById(taskId).session(session);
    if (!currentTask) {
      return res.status(404).json({ success: false, error: "Task nahi mila!" });
    }

    let logDetails = "Task ke details update kiye gaye.";
    if (status && status !== currentTask.status) {
      logDetails = `Status badla gaya: "${currentTask.status}" se "${status}" kiya gaya.`;
      currentTask.status = status;
    }

    currentTask.title = title || currentTask.title;
    currentTask.description = description || currentTask.description;
    currentTask.updatedBy = req.user._id;

    // Task save karo is session ke andar
    const updatedTask = await currentTask.save({ session });

    let ipAddress = req.ip === '::1' ? '127.0.0.1' : req.ip;

    // 4. Activity Log save karo isi session ke andar
    await ActivityLog.create([{
      taskId: updatedTask._id,
      userId: req.user._id,
      action: 'UPDATE_TASK',
      details: logDetails,
      userIp: ipAddress
    }], { session });

    // 5. Commit transaction permanently
    await session.commitTransaction();

    // Session band karo
    session.endSession();

    res.status(200).json({ success: true, data: updatedTask });

  } catch (error) {
    // 6. 🚨 AGAR KOI BHI EK KAAM FAIL HUA: Toh sab kuch mita do (Rollback)
    try {
      await session.abortTransaction();
    } catch (abortError) {
      console.log("Abort Error (Ignored):", abortError.message);
    }
    session.endSession(); // Session band karo

    res.status(400).json({ success: false, error: "Transaction fail ho gaya: " + error.message });
  }
};


// Aggregation Framework ($graphLookup)
// Yeh pure database mein se saare levels ek baar mein nikaal dega bina kisi loop ke
const getAllTasksTree = async (req, res) => {
  try {
    const tree = await Task.aggregate([
      // Step 1: Sabse pehle sirf Main Tasks ko filter karo (parentTaskId: null)
      {
        $match: { parentTaskId: null }
      },
      // Step 2: $graphLookup se saare nested subtasks ek baar mein jodo (Recursive Search)
      {
        $graphLookup: {
          from: 'tasks',                    // Kis collection mein dhoondna hai (apne hi collection mein)
          startWith: '$_id',                // Kahan se shuru karna hai (Main Task ki _id se)
          connectFromField: '_id',          // Parent ka kaunsa field match karna hai
          connectToField: 'parentTaskId',   // Child ke kis field se match karna hai
          as: 'allSubtasks'                // Naya array jismein saare nested subtasks milenge
        }
      }
    ]);

    // Step 3: MongoDB ne saare subtasks ko ek flat array 'allSubtasks' mein de diya hai.
    // Frontend par tree structure dikhane ke liye hum ise ek simple format mein helper se set kar dete hain.
    const formattedTree = tree.map(mainTask => {
      const formatChildren = (parentId) => {
        return mainTask.allSubtasks
          .filter(sub => String(sub.parentTaskId) === String(parentId))
          .map(sub => ({
            ...sub,
            subtasks: formatChildren(sub._id) // Memory ke andar hi nesting ho rahi hai, DB call ZERO hai!
          }));
      };

      return {
        _id: mainTask._id,
        title: mainTask.title,
        description: mainTask.description,
        status: mainTask.status,
        parentTaskId: mainTask.parentTaskId,
        createdAt: mainTask.createdAt,
        updatedAt: mainTask.updatedAt,
        subtasks: formatChildren(mainTask._id)
      };
    });

    res.status(200).json({
      success: true,
      count: formattedTree.length,
      data: formattedTree
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// SARE CONTROLLERS EK SAATH EXPORT
module.exports = {
  createTask,
  getMainTasks,
  getSubtasks,
  getAllTasksTree,
  updateTask,
};