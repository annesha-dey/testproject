import mongoose from "mongoose";

const billingPlanSchema = new mongoose.Schema({
  planId: {
    type: String,
    required: true,
    unique: true
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
    default: 'EVERY_30_DAYS'
  },
  trialDays: {
    type: Number,
    default: 7
  },
  features: [{
    type: String
  }],
  limits: {
    products: {
      type: Number,
      default: -1 // -1 means unlimited
    },
    orders: {
      type: Number,
      default: -1
    },
    apiCalls: {
      type: Number,
      default: -1
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model("BillingPlan", billingPlanSchema);
