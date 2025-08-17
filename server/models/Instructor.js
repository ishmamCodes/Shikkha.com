import mongoose from 'mongoose';

const instructorSchema = new mongoose.Schema(
  {
    educatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Educator', required: true },
    name: { type: String, required: true },
    expertise: { type: String, default: '' },
    image: { type: String, default: '' },
    achievements: { type: String, default: '' },
    contact: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

instructorSchema.index({ educatorId: 1 }, { unique: true, sparse: true });

const Instructor = mongoose.models.Instructor || mongoose.model('Instructor', instructorSchema);
export default Instructor;
