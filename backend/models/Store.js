import mongoose from "mongoose";

const storeSchema = new mongoose.Schema({
  shop: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  shopifyDomain: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    required: true
  },
  scope: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  installedAt: {
    type: Date,
    default: Date.now
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  appMetadata: {
    plan: {
      type: String,
      default: 'basic'
    },
    features: [{
      type: String
    }],
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
storeSchema.index({ shop: 1, isActive: 1 });

// Update lastAccessedAt on each access
storeSchema.methods.updateLastAccessed = function() {
  this.lastAccessedAt = new Date();
  return this.save();
};

// Get store with decrypted access token
storeSchema.methods.getAccessToken = function() {
  return this.accessToken;
};

const Store = mongoose.model("Store", storeSchema);

export default Store;
