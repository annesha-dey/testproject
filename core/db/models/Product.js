/**
 * Product Model - Enhanced for profit analysis with cost tracking
 */

import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  shopifyVariantId: {
    type: String,
    required: true,
    index: true
  },
  title: String,
  price: {
    type: Number,
    required: true
  },
  compareAtPrice: Number,
  sku: String,
  
  // Cost tracking for profit calculation
  unitCost: {
    type: Number,
    default: 0
  },
  
  // Inventory tracking
  inventoryQuantity: {
    type: Number,
    default: 0
  },
  inventoryPolicy: {
    type: String,
    enum: ['deny', 'continue'],
    default: 'deny'
  },
  inventoryManagement: String,
  
  // Physical attributes
  weight: Number,
  weightUnit: {
    type: String,
    default: 'kg'
  },
  
  // Fulfillment
  requiresShipping: {
    type: Boolean,
    default: true
  },
  taxable: {
    type: Boolean,
    default: true
  },
  
  // Profit metrics (calculated)
  grossMargin: {
    type: Number,
    default: 0
  },
  profitPerUnit: {
    type: Number,
    default: 0
  }
});

const productSchema = new mongoose.Schema({
  // Shopify identifiers
  shopifyProductId: {
    type: String,
    required: true,
    index: true
  },
  shop: {
    type: String,
    required: true,
    index: true
  },
  
  // Product details
  title: {
    type: String,
    required: true
  },
  handle: String,
  description: String,
  vendor: String,
  productType: String,
  tags: [String],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'archived', 'draft'],
    default: 'active'
  },
  
  // Media
  images: [{
    src: String,
    alt: String,
    position: Number
  }],
  
  // Variants with cost tracking
  variants: [variantSchema],
  
  // SEO
  seoTitle: String,
  seoDescription: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    required: true
  },
  updatedAt: Date,
  publishedAt: Date,
  
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
  collection: 'products'
});

// Compound indexes for efficient queries
productSchema.index({ shop: 1, shopifyProductId: 1 }, { unique: true });
productSchema.index({ shop: 1, status: 1 });
productSchema.index({ shop: 1, vendor: 1 });
productSchema.index({ shop: 1, productType: 1 });

// Methods
productSchema.methods.calculateVariantProfits = function() {
  this.variants.forEach(variant => {
    if (variant.unitCost > 0) {
      variant.profitPerUnit = variant.price - variant.unitCost;
      variant.grossMargin = variant.price > 0 ? (variant.profitPerUnit / variant.price) * 100 : 0;
    }
  });
};

productSchema.methods.getAverageMargin = function() {
  const variants = this.variants.filter(v => v.grossMargin > 0);
  if (variants.length === 0) return 0;
  
  const totalMargin = variants.reduce((sum, v) => sum + v.grossMargin, 0);
  return totalMargin / variants.length;
};

export default mongoose.model('Product', productSchema);
