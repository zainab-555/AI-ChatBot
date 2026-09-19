const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      index: true,
    },
    sessionTitle: {
      type: String,
      default: 'New Conversation',
    },
    prompt: {
      type: String,
      required: [true, 'User prompt is required'],
      trim: true,
    },
    response: {
      type: String,
      required: [true, 'Bot response is required'],
    },
    attachment: {
      fileName: String,
      fileType: String,
      fileSize: Number,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Chat', chatSchema);
