import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["photo", "video", "newspaper"],
      required: true,
    },
    title: { type: String, trim: true },
    newspaperName: { type: String, trim: true },
    url: { type: String, required: true },
    publicId: { type: String, trim: true },
    resourceType: { type: String, trim: true },
  },
  { timestamps: true, versionKey: false },
);

const Media = mongoose.model("Media", mediaSchema);
export default Media;
