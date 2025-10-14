/**
 * Customer Model - Stores customer data for LTV and cohort analysis
 */

import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  // Shopify identifiers
  shopifyCustomerId: {
    type: String,
    required: true,
    index: true
  },
  shop: {
    type: String,
    required: true,
    index: true
  },
  
  // Customer details
  email: {
    type: String,
    required: true,
    index: true
  },
  firstName: String,
  lastName: String,
  phone: String,
  
  // Address information
  defaultAddress: {
    address1: String,
    address2: String,
    city: String,
    province: String,
    country: String,
    zip: String,
    countryCode: String,
    provinceCode: String
  },
  
  // Customer status
  state: {
    type: String,
    enum: ['disabled', 'invited', 'enabled', 'declined'],
    default: 'enabled'
  },
  acceptsMarketing: {
    type: Boolean,
    default: false
  },
  acceptsMarketingUpdatedAt: Date,
  
  // Customer metrics
  ordersCount: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  averageOrderValue: {
    type: Number,
    default: 0
  },
  
  // LTV calculations
  lifetimeValue: {
    type: Number,
    default: 0
  },
  predictedLTV: {
    type: Number,
    default: 0
  },
  
  // Cohort analysis
  firstOrderDate: Date,
  lastOrderDate: Date,
  daysSinceFirstOrder: {
    type: Number,
    default: 0
  },
  daysSinceLastOrder: {
    type: Number,
    default: 0
  },
  
  // Customer segments
  segment: {
    type: String,
    enum: ['new', 'active', 'at_risk', 'lost', 'vip'],
    default: 'new'
  },
  
  // Tags and notes
  tags: [String],
  note: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    required: true
  },
  updatedAt: Date,
  
  // Data sync tracking
  lastSyncedAt: {
    type: Date,
    default: Date.now
  },
  syncStatus: {
    type: String,
    enum: ['pending', 'synced', 'error'],
    default: 'synced'
  }
}, {
  timestamps: true,
  collection: 'customers'
});

// Compound indexes for efficient queries
customerSchema.index({ shop: 1, shopifyCustomerId: 1 }, { unique: true });
customerSchema.index({ shop: 1, email: 1 });
customerSchema.index({ shop: 1, segment: 1 });
customerSchema.index({ shop: 1, totalSpent: -1 });
customerSchema.index({ shop: 1, firstOrderDate: 1 });

// Methods
customerSchema.methods.calculateLTV = function() {
  if (this.ordersCount > 0) {
    this.averageOrderValue = this.totalSpent / this.ordersCount;
    // Simple LTV calculation - can be enhanced with more sophisticated models
    this.lifetimeValue = this.totalSpent;
    this.predictedLTV = this.averageOrderValue * Math.max(this.ordersCount * 2, 5);
  }
  return this.lifetimeValue;
};

customerSchema.methods.updateSegment = function() {
  const now = new Date();
  const daysSinceLastOrder = this.lastOrderDate ? 
    Math.floor((now - this.lastOrderDate) / (1000 * 60 * 60 * 24)) : 999;
  
  this.daysSinceLastOrder = daysSinceLastOrder;
  
  if (this.ordersCount === 0) {
    this.segment = 'new';
  } else if (this.totalSpent > 1000) {
    this.segment = 'vip';
  } else if (daysSinceLastOrder <= 30) {
    this.segment = 'active';
  } else if (daysSinceLastOrder <= 90) {
    this.segment = 'at_risk';
  } else {
    this.segment = 'lost';
  }
  
  return this.segment;
};

export default mongoose.model('Customer', customerSchema);
