import mongoose from 'mongoose';

const twinSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  skills: [{
    type: String,
  }],
  expertise: [{
    area: { type: String, required: true },
    score: { type: Number, required: true, default: 50 },
  }],
  preferences: [{
    type: String,
  }],
  relationships: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, default: 'Teammate' }, // e.g. "Collaborator", "Manager", "Peer"
  }],
  expertiseScore: {
    type: Number,
    default: 50,
  },
  summary: {
    type: String,
    default: '',
  },
});

const Twin = mongoose.model('Twin', twinSchema);
export default Twin;
