import mongoose from "mongoose";

const timelineSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    date: { type: Date, required: true },
    media: [
      {
        url: { type: String, required: false },
        type: { type: String, enum: ["image", "video"], required: false },
      },
    ],
    status: { type: String, enum: ["upcoming", "past"], default: "upcoming" },
  },
  { timestamps: true, versionKey: false },
);

timelineSchema.pre("save", function () {
  if (this.date < new Date()) this.status = "past";
  else this.status = "upcoming";
});

const Timeline = mongoose.model("Timeline", timelineSchema);
export default Timeline;
