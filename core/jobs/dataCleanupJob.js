/**
 * Data Cleanup Job
 * 
 * Background job triggered when app is uninstalled to clean up all store data.
 * Ensures data privacy and compliance.
 */

import DataCleanupManager from '../utils/DataCleanupManager.js';

/**
 * Execute data cleanup for a shop
 * @param {string} shop - Shop domain
 * @param {Object} options - Additional options
 */
export async function executeDataCleanup(shop, options = {}) {
  console.log(`🗑️ [CLEANUP-JOB] Starting data cleanup job for shop: ${shop}`);
  console.log(`🔍 [CLEANUP-JOB] Options:`, options);
  
  const startTime = Date.now();
  
  try {
    // Create cleanup manager
    const cleanupManager = new DataCleanupManager(shop);
    
    // Execute complete cleanup
    const result = await cleanupManager.executeCompleteCleanup();
    
    // Verify cleanup was successful
    const verified = await cleanupManager.verifyCleanup();
    
    const duration = Date.now() - startTime;
    const durationMinutes = Math.round(duration / 1000 / 60);
    
    if (result.success && verified) {
      console.log(`🎉 [CLEANUP-JOB] Data cleanup completed successfully for ${shop} in ${durationMinutes} minutes`);
      console.log(`📊 [CLEANUP-JOB] Final cleanup stats:`, {
        ...result.stats,
        duration: `${durationMinutes} minutes`,
        shop,
        verified: true
      });
      
      return {
        success: true,
        stats: result.stats,
        duration: durationMinutes,
        verified: true
      };
      
    } else {
      console.error(`❌ [CLEANUP-JOB] Data cleanup failed or incomplete for ${shop}`);
      
      return {
        success: false,
        error: result.error || 'Cleanup verification failed',
        stats: result.stats,
        duration: durationMinutes,
        verified: false
      };
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const durationMinutes = Math.round(duration / 1000 / 60);
    
    console.error(`❌ [CLEANUP-JOB] Data cleanup job failed for ${shop} after ${durationMinutes} minutes:`, error);
    console.error(`❌ [CLEANUP-JOB] Error stack:`, error.stack);
    
    return {
      success: false,
      error: error.message,
      duration: durationMinutes
    };
  }
}

/**
 * Job definition for the job scheduler
 */
export const dataCleanupJobDefinition = {
  name: 'data-cleanup',
  description: 'Clean up all store data when app is uninstalled',
  handler: executeDataCleanup,
  options: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 30000 // 30 seconds
    },
    removeOnComplete: 10,
    removeOnFail: 5
  }
};

export default dataCleanupJobDefinition;
