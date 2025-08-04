import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // email or phone
  password: { type: String, required: true },
  birthday: { type: String, required: true },
  role: { type: String, enum: ['student', 'educator', 'admin'], required: true }
}, {
  timestamps: true
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
