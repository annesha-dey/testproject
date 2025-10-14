import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  shop: {
    type: String,
    required: true,
    index: true
  },
  shopifyChargeId: {
    type: String,
    required: true,
    unique: true
  },
  planId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'CANCELLED', 'FROZEN', 'EXPIRED'],
    default: 'PENDING'
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  interval: {
    type: String,
    enum: ['EVERY_30_DAYS', 'ANNUAL'],
    required: true
  },
  trialDays: {
    type: Number,
    default: 0
  },
  trialEndsOn: {
    type: Date
  },
  activatedOn: {
    type: Date
  },
  billingOn: {
    type: Date
  },
  cancelledOn: {
    type: Date
  },
  confirmationUrl: {
    type: String
  },
  returnUrl: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
subscriptionSchema.index({ shop: 1, status: 1 });

export default mongoose.model("Subscription", subscriptionSchema);
