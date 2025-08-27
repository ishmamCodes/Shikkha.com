import mongoose from "mongoose";

const educatorSchema = new mongoose.Schema(
  {
    // Auth credentials
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    dateOfBirth: { type: Date, required: true },
    role: { type: String, enum: ["educator"], default: "educator" },

    // Basic info
    fullName: { type: String, required: true },
    phone: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    bio: { type: String, default: "" },
    // Admin moderation status
    status: { type: String, enum: ["active", "suspended", "pending"], default: "active", index: true },
    experienceYears: { type: Number, default: 0 },
    experienceDescription: { type: String, default: "" },
    educationBackground: [
      {
        degree: String,
        institution: String,
        year: String,
      },
    ],
    achievements: [{ type: String }],
    certifications: [
      {
        title: String,
        organization: String,
        date: String,
      },
    ],
    socialLinks: {
      linkedin: { type: String, default: "" },
      twitter: { type: String, default: "" },
      website: { type: String, default: "" },
    },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }]
  },
  { timestamps: true }
);

const Educator = mongoose.models.Educator || mongoose.model("Educator", educatorSchema);
export default Educator;


