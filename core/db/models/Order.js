/**
 * Order Model - Stores historical order data for profit analysis
 */

import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  // Shopify identifiers
  shopifyOrderId: {
    type: String,
    required: true,
    index: true
  },
  shop: {
    type: String,
    required: true,
    index: true
  },
  
  // Order details
  orderNumber: String,
  name: String, // Order name (e.g., "#1001")
  email: String,
  
  // Financial data
  totalPrice: {
    type: Number,
    required: true
  },
  subtotalPrice: Number,
  totalTax: Number,
  totalDiscounts: Number,
  totalShipping: Number,
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Status tracking
  financialStatus: {
    type: String,
    enum: ['pending', 'authorized', 'partially_paid', 'paid', 'partially_refunded', 'refunded', 'voided'],
    default: 'pending'
  },
  fulfillmentStatus: {
    type: String,
    enum: ['fulfilled', 'null', 'partial', 'restocked'],
    default: null
  },
  
  // Customer reference
  customerId: String,
  customerEmail: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    required: true
  },
  updatedAt: Date,
  processedAt: Date,
  
  // Profit calculation fields
  totalCost: {
    type: Number,
    default: 0
  },
  grossProfit: {
    type: Number,
    default: 0
  },
  profitMargin: {
    type: Number,
    default: 0
  },
  
  // Metadata
  tags: [String],
  note: String,
  sourceUrl: String,
  
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
  collection: 'orders'
});

// Compound indexes for efficient queries
orderSchema.index({ shop: 1, createdAt: -1 });
orderSchema.index({ shop: 1, financialStatus: 1 });
orderSchema.index({ shop: 1, customerId: 1 });

// Methods
orderSchema.methods.calculateProfit = function() {
  this.grossProfit = this.totalPrice - this.totalCost;
  this.profitMargin = this.totalPrice > 0 ? (this.grossProfit / this.totalPrice) * 100 : 0;
  return this.grossProfit;
};

export default mongoose.model('Order', orderSchema);
