import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    memberId: { type: String, unique: true, required: true },

    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    mobile: { type: String, required: true },

    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },

    address: { type: String, trim: true },

    age: {
      type: Number,
      min: [1, "Age must be greater than 0"],
      max: [120, "Age must be realistic"],
    },

    gender: { type: String, trim: true, enum: ["male", "female", "other"] },

    occupation: { type: String, trim: true },

    agreedToPolicy: { type: Boolean, default: true },

    approved: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

memberSchema.pre("validate", function () {
  if (!this.memberId) {
    const random = Math.floor(100 + Math.random() * 900);
    this.memberId = `JP-${Date.now()}-${random}`;
  }
});

const Member = mongoose.model("Member", memberSchema);
export default Member;
