const mongoose = require('mongoose');
const { Schema } = mongoose;

const taskSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // creator/owner
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date },
  progress: { type: String, enum: ['not-started','in-progress','completed'], default: 'not-started' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', taskSchema);
