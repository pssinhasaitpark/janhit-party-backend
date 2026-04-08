import mongoose from "mongoose";

const newsTickerSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },

    public_id: { type: String, required: true },

    mediaType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },

    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    category: {
      type: String,
      required: true,
    },

    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
);

const NewsTicker = mongoose.model("NewsTicker", newsTickerSchema);
export default NewsTicker;
