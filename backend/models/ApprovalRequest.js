import mongoose from 'mongoose';

const approvalRequestSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Assign Reviewer', 'Create Decision', 'Route Request'],
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ApprovalRequest = mongoose.model('ApprovalRequest', approvalRequestSchema);
export default ApprovalRequest;
