import mongoose from "mongoose";

const educatorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    bio: { type: String, default: "" },
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


