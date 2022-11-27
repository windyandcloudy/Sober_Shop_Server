const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OrderSchema = new Schema(
  {
    address: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      match: /^[0][0-9]{9}$/,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "users",
    },
    status: {
      type: String,
      default: "1",
    },
    payment_method: {
      type: String,
      default: "onDelivery",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

OrderSchema.virtual("orderDetails", {
  ref: "orderDetails",
  localField: "_id",
  foreignField: "order",
  justOne: false,
});

module.exports = mongoose.model("orders", OrderSchema);
