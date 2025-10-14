/**
 * Day 1 Data Fetch Background Job
 * 
 * This job is triggered when a store installs the app to fetch historical data.
 * It runs in the background to avoid blocking the installation process.
 */

import Day1DataFetcher from '../utils/Day1DataFetcher.js';
import StoreManager from '../utils/storeManager.js';

const storeManager = new StoreManager();

/**
 * Execute Day 1 data fetch for a shop
 * @param {string} shop - Shop domain
 * @param {Object} options - Additional options
 */
export async function executeDay1DataFetch(shop, options = {}) {
  console.log(`🚀 [DAY1-JOB] Starting Day 1 data fetch job for shop: ${shop}`);
  
  const startTime = Date.now();
  
  try {
    // Verify shop has valid access token
    const accessToken = await storeManager.getAccessToken(shop);
    if (!accessToken) {
      throw new Error(`No access token found for shop: ${shop}`);
    }
    
    console.log(`✅ [DAY1-JOB] Access token verified for ${shop}`);
    
    // Create and execute data fetcher
    const fetcher = new Day1DataFetcher(shop);
    const stats = await fetcher.fetchAllHistoricalData();
    
    const duration = Date.now() - startTime;
    const durationMinutes = Math.round(duration / 1000 / 60);
    
    console.log(`🎉 [DAY1-JOB] Day 1 data fetch completed for ${shop} in ${durationMinutes} minutes`);
    console.log(`📊 [DAY1-JOB] Final stats:`, {
      ...stats,
      duration: `${durationMinutes} minutes`,
      shop
    });
    
    // Update store record with sync status
    await storeManager.updateStore(shop, {
      day1DataSynced: true,
      day1DataSyncedAt: new Date(),
      day1DataStats: stats
    });
    
    // TODO: Trigger metrics computation jobs
    await scheduleMetricsComputation(shop, stats);
    
    return {
      success: true,
      stats,
      duration: durationMinutes
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const durationMinutes = Math.round(duration / 1000 / 60);
    
    console.error(`❌ [DAY1-JOB] Day 1 data fetch failed for ${shop} after ${durationMinutes} minutes:`, error);
    
    // Update store record with error status
    await storeManager.updateStore(shop, {
      day1DataSynced: false,
      day1DataSyncError: error.message,
      day1DataSyncedAt: new Date()
    });
    
    return {
      success: false,
      error: error.message,
      duration: durationMinutes
    };
  }
}

/**
 * Schedule metrics computation jobs after data fetch
 * @param {string} shop - Shop domain
 * @param {Object} stats - Data fetch statistics
 */
async function scheduleMetricsComputation(shop, stats) {
  console.log(`🔄 [DAY1-JOB] Scheduling metrics computation for ${shop}...`);
  
  try {
    // Import job scheduler
    const { jobScheduler } = await import('../jobs/index.js');
    
    // Schedule profit metrics computation
    if (stats.orders > 0) {
      await jobScheduler.scheduleJob('profit-metrics-computation', {
        shop,
        priority: 'high',
        delay: 5000 // 5 seconds delay
      });
      console.log(`✅ [DAY1-JOB] Scheduled profit metrics computation for ${shop}`);
    }
    
    // Schedule customer LTV computation
    if (stats.customers > 0) {
      await jobScheduler.scheduleJob('customer-ltv-computation', {
        shop,
        priority: 'medium',
        delay: 10000 // 10 seconds delay
      });
      console.log(`✅ [DAY1-JOB] Scheduled customer LTV computation for ${shop}`);
    }
    
    // Schedule product performance analysis
    if (stats.products > 0) {
      await jobScheduler.scheduleJob('product-performance-analysis', {
        shop,
        priority: 'medium',
        delay: 15000 // 15 seconds delay
      });
      console.log(`✅ [DAY1-JOB] Scheduled product performance analysis for ${shop}`);
    }
    
  } catch (error) {
    console.error(`❌ [DAY1-JOB] Failed to schedule metrics computation for ${shop}:`, error);
  }
}

/**
 * Job definition for the job scheduler
 */
export const day1DataFetchJobDefinition = {
  name: 'day1-data-fetch',
  description: 'Fetch historical data when store installs the app',
  handler: executeDay1DataFetch,
  options: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60000 // 1 minute
    },
    removeOnComplete: 10,
    removeOnFail: 5
  }
};

export default day1DataFetchJobDefinition;
