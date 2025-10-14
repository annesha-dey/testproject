/**
 * LineItem Model - Stores order line items for detailed profit analysis
 */

import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema({
  // Shopify identifiers
  shopifyLineItemId: {
    type: String,
    required: true,
    index: true
  },
  shopifyOrderId: {
    type: String,
    required: true,
    index: true
  },
  shopifyProductId: String,
  shopifyVariantId: String,
  shop: {
    type: String,
    required: true,
    index: true
  },
  
  // Product details
  title: String,
  variantTitle: String,
  sku: String,
  vendor: String,
  productType: String,
  
  // Quantity and pricing
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  totalDiscount: {
    type: Number,
    default: 0
  },
  
  // Cost and profit tracking
  unitCost: {
    type: Number,
    default: 0
  },
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
  
  // Product attributes
  weight: Number,
  weightUnit: String,
  requiresShipping: {
    type: Boolean,
    default: true
  },
  taxable: {
    type: Boolean,
    default: true
  },
  
  // Fulfillment tracking
  fulfillmentStatus: {
    type: String,
    enum: ['fulfilled', 'partial', 'unfulfilled'],
    default: 'unfulfilled'
  },
  fulfillmentService: String,
  
  // Metadata
  properties: [{
    name: String,
    value: String
  }],
  
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
  collection: 'line_items'
});

// Compound indexes for efficient queries
lineItemSchema.index({ shop: 1, shopifyOrderId: 1 });
lineItemSchema.index({ shop: 1, shopifyProductId: 1 });
lineItemSchema.index({ shop: 1, sku: 1 });

// Methods
lineItemSchema.methods.calculateProfit = function() {
  this.totalCost = this.unitCost * this.quantity;
  const revenue = (this.price * this.quantity) - this.totalDiscount;
  this.grossProfit = revenue - this.totalCost;
  this.profitMargin = revenue > 0 ? (this.grossProfit / revenue) * 100 : 0;
  return this.grossProfit;
};

export default mongoose.model('LineItem', lineItemSchema);
