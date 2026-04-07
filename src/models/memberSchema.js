import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    mobile: { type: String, required: true },
    city: { type: String, required: true, trim: true },
    agreedToPolicy: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Member = mongoose.model("Member", memberSchema);
export default Member;
