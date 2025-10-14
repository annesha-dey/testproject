import mongoose from 'mongoose';

const billingSubscriptionSchema = new mongoose.Schema({
  shop: {
    type: String,
    required: true,
    index: true
  },
  planId: {
    type: String,
    required: true,
    ref: 'BillingPlan'
  },
  chargeId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'CANCELLED', 'EXPIRED', 'FROZEN'],
    default: 'PENDING',
    index: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  trialEndsOn: {
    type: Date
  },
  activatedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  isMock: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
billingSubscriptionSchema.index({ shop: 1, status: 1 });
billingSubscriptionSchema.index({ chargeId: 1 });
billingSubscriptionSchema.index({ planId: 1 });

// Instance methods
billingSubscriptionSchema.methods.isActive = function() {
  return this.status === 'ACTIVE';
};

billingSubscriptionSchema.methods.isInTrial = function() {
  return this.trialEndsOn && new Date() < this.trialEndsOn;
};

billingSubscriptionSchema.methods.cancel = async function() {
  this.status = 'CANCELLED';
  this.cancelledAt = new Date();
  return this.save();
};

export default mongoose.model('BillingSubscription', billingSubscriptionSchema);
