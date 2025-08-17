import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    contentType: { 
      type: String, 
      required: true, 
      enum: ["text", "pdf", "doc", "image", "video", "audio", "presentation"] 
    },
    url: { type: String, required: true },
    fileType: { type: String, default: "" },
    fileSize: { type: Number, default: 0 }, // in bytes
    duration: { type: Number, default: 0 }, // for videos/audio in seconds
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Educator", required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    order: { type: Number, default: 0 }, // for ordering materials in a course
    isPublic: { type: Boolean, default: true }, // whether students can access this material
    tags: [{ type: String }] // for categorization
  },
  { timestamps: true }
);

const Material = mongoose.models.Material || mongoose.model("Material", materialSchema);
export default Material;


