/**
 * Test Data Cleanup Script
 * Run this to manually test the data cleanup functionality
 */

import { executeDataCleanup } from './core/jobs/dataCleanupJob.js';

const SHOP = 'analyserapp.myshopify.com';

console.log(`🗑️ [TEST] Starting manual data cleanup test for ${SHOP}...`);
console.log(`⚠️ [TEST] WARNING: This will DELETE ALL DATA for the shop!`);

try {
  const result = await executeDataCleanup(SHOP, {
    trigger: 'manual_test',
    timestamp: new Date(),
    testMode: true
  });
  
  if (result.success) {
    console.log(`✅ [TEST] Manual data cleanup completed successfully:`, result);
  } else {
    console.error(`❌ [TEST] Manual data cleanup failed:`, result);
  }
  
  process.exit(0);
  
} catch (error) {
  console.error(`❌ [TEST] Manual data cleanup test failed:`, error);
  console.error(`❌ [TEST] Error stack:`, error.stack);
  process.exit(1);
}
