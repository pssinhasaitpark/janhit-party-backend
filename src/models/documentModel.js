import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String },
    url: { type: String, required: true },
    public_id: { type: String, required: true },
  },
  { timestamps: true, versionKey: false },
);

export default mongoose.model("Document", documentSchema);
