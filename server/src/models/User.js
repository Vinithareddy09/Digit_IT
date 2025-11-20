const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['student','teacher'], required: true },
  teacherId: { type: Schema.Types.ObjectId, ref: 'User' } // required for students at signup time
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
