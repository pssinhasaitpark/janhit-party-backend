import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    url: { type: String, required: true },
    fileType: { type: String, default: "pdf" },
  },
  { timestamps: true, versionKey: false },
);

const Document = mongoose.model("Document", documentSchema);
export default Document;
