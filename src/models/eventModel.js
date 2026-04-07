import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Event name is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    theme: {
      type: String,
      trim: true,
    },

    date: {
      type: Date,
      required: [true, "Event date is required"],
    },
    time: {
      type: String,
      required: [true, "Event time is required"],
    },

    media: [
      {
        url: { type: String, required: true },
        type: {
          type: String,
          enum: ["image", "video"],
          required: true,
        },
      },
    ],

    status: {
      type: String,
      enum: ["upcoming", "past"],
      default: "upcoming",
    },
  },
  { timestamps: true, versionKey: false },
);

// 🔥 AUTO UPDATE STATUS BASED ON DATE
eventSchema.pre("save", function () {
  const today = new Date();

  if (this.date < today) {
    this.status = "past";
  } else {
    this.status = "upcoming";
  }
});

// 🔥 STATIC METHOD TO UPDATE ALL EVENTS (cron job use)
eventSchema.statics.updateEventStatus = async function () {
  const today = new Date();

  await this.updateMany(
    { date: { $lt: today }, status: "upcoming" },
    { $set: { status: "past" } },
  );
};

const Event = mongoose.model("Event", eventSchema);

export default Event;
