import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
    default: '',
  },
  extractedSkills: [{
    type: String,
  }],
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const Document = mongoose.model('Document', documentSchema);
export default Document;
