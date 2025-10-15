/**
 * Manual Day 1 Data Fetch Test Script
 * Run this to manually trigger Day 1 data fetch for debugging
 */

import { executeDay1DataFetch } from './core/jobs/day1DataFetchJob.js';

const SHOP = 'analyserapp.myshopify.com';

console.log(`🚀 [TEST] Starting manual Day 1 data fetch for ${SHOP}...`);

try {
  const result = await executeDay1DataFetch(SHOP, {
    trigger: 'manual_test',
    timestamp: new Date()
  });
  
  console.log(`✅ [TEST] Manual Day 1 data fetch completed:`, result);
  process.exit(0);
  
} catch (error) {
  console.error(`❌ [TEST] Manual Day 1 data fetch failed:`, error);
  console.error(`❌ [TEST] Error stack:`, error.stack);
  process.exit(1);
}
