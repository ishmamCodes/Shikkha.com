import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    fileType: { type: String, default: "" },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" }
  },
  { timestamps: true }
);

const Material = mongoose.models.Material || mongoose.model("Material", materialSchema);
export default Material;


