import mongoose from 'mongoose';

const aicooLogSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['A2A Negotiation', 'Routing', 'Context Sync', 'Pulse Activity'],
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  message: {
    type: String,
    required: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const AicooLog = mongoose.model('AicooLog', aicooLogSchema);
export default AicooLog;
