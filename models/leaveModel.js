const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    from: {
      type: Date,
      required: true,
    },
    to: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value >= this.from;
        },
        message: "'to' date must be after 'from' date",
      },
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true },
);

leaveSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("Leave", leaveSchema);
