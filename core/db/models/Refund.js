/**
 * Refund Model - Stores refund data for profit adjustment calculations
 */

import mongoose from 'mongoose';

const refundLineItemSchema = new mongoose.Schema({
  shopifyLineItemId: String,
  quantity: Number,
  restockType: {
    type: String,
    enum: ['no_restock', 'cancel', 'return', 'legacy_restock'],
    default: 'no_restock'
  },
  subtotal: Number,
  totalTax: Number,
  lineItem: {
    id: String,
    productId: String,
    variantId: String,
    title: String,
    variantTitle: String,
    sku: String,
    price: Number
  }
});

const refundSchema = new mongoose.Schema({
  // Shopify identifiers
  shopifyRefundId: {
    type: String,
    required: true,
    index: true
  },
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
  
  // Refund details
  note: String,
  
  // Financial data
  refundLineItems: [refundLineItemSchema],
  
  // Transactions (for tracking refund payments)
  transactions: [{
    shopifyTransactionId: String,
    amount: Number,
    currency: String,
    kind: {
      type: String,
      enum: ['refund', 'adjustment'],
      default: 'refund'
    },
    gateway: String,
    status: {
      type: String,
      enum: ['pending', 'success', 'failure', 'error'],
      default: 'success'
    },
    processedAt: Date
  }],
  
  // Calculated totals
  totalRefundAmount: {
    type: Number,
    default: 0
  },
  totalTaxRefunded: {
    type: Number,
    default: 0
  },
  
  // Impact on profit
  profitImpact: {
    type: Number,
    default: 0
  },
  costRecovered: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    required: true
  },
  processedAt: Date,
  
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
  collection: 'refunds'
});

// Compound indexes for efficient queries
refundSchema.index({ shop: 1, shopifyRefundId: 1 }, { unique: true });
refundSchema.index({ shop: 1, shopifyOrderId: 1 });
refundSchema.index({ shop: 1, createdAt: -1 });

// Methods
refundSchema.methods.calculateTotals = function() {
  // Calculate total refund amount from transactions
  this.totalRefundAmount = this.transactions.reduce((sum, transaction) => {
    return transaction.status === 'success' ? sum + transaction.amount : sum;
  }, 0);
  
  // Calculate total tax refunded from line items
  this.totalTaxRefunded = this.refundLineItems.reduce((sum, item) => {
    return sum + (item.totalTax || 0);
  }, 0);
  
  return {
    totalRefundAmount: this.totalRefundAmount,
    totalTaxRefunded: this.totalTaxRefunded
  };
};

refundSchema.methods.calculateProfitImpact = function(originalOrderCost = 0) {
  // Calculate the cost that was recovered through restocking
  this.costRecovered = this.refundLineItems.reduce((sum, item) => {
    if (item.restockType === 'return' || item.restockType === 'cancel') {
      // Estimate cost recovered based on quantity and original cost
      const estimatedUnitCost = originalOrderCost / this.refundLineItems.length || 0;
      return sum + (estimatedUnitCost * item.quantity);
    }
    return sum;
  }, 0);
  
  // Profit impact = amount refunded - cost recovered
  this.profitImpact = this.totalRefundAmount - this.costRecovered;
  
  return this.profitImpact;
};

export default mongoose.model('Refund', refundSchema);
