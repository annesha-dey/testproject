/**
 * Manual Cleanup Script
 * Run this to clean up orphaned data from uninstalled apps
 */

import fetch from 'node-fetch';

const BACKEND_URL = 'https://e43e420e9e45.ngrok-free.app';
const SHOP = 'analyserapp.myshopify.com';

async function runManualCleanup() {
  console.log(`🗑️ Starting manual cleanup for shop: ${SHOP}`);
  
  try {
    // First check current data status
    console.log(`🔍 Checking current data status...`);
    const statusResponse = await fetch(`${BACKEND_URL}/api/profit-analyser/cleanup/cleanup-status?shop=${SHOP}`, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
      }
    });
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log(`📊 Current data counts:`, statusData.counts);
      console.log(`📊 Total records: ${statusData.totalRecords}`);
      
      if (statusData.isClean) {
        console.log(`✅ Database is already clean for ${SHOP}`);
        return;
      }
    } else {
      console.warn(`⚠️ Could not check status: ${statusResponse.status}`);
    }
    
    // Run manual cleanup
    console.log(`🔄 Triggering manual cleanup...`);
    const cleanupResponse = await fetch(`${BACKEND_URL}/api/profit-analyser/cleanup/manual-cleanup?shop=${SHOP}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      }
    });
    
    if (cleanupResponse.ok) {
      const cleanupData = await cleanupResponse.json();
      console.log(`🎉 Cleanup completed successfully!`);
      console.log(`📊 Cleanup stats:`, cleanupData.stats);
      console.log(`⏱️ Duration: ${cleanupData.duration} minutes`);
    } else {
      const errorData = await cleanupResponse.json();
      console.error(`❌ Cleanup failed:`, errorData.error);
    }
    
    // Check status again to verify
    console.log(`🔍 Verifying cleanup...`);
    const verifyResponse = await fetch(`${BACKEND_URL}/api/profit-analyser/cleanup/cleanup-status?shop=${SHOP}`, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
      }
    });
    
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log(`📊 Final data counts:`, verifyData.counts);
      console.log(`📊 Total records remaining: ${verifyData.totalRecords}`);
      
      if (verifyData.isClean) {
        console.log(`🎉 Database is now clean for ${SHOP}!`);
      } else {
        console.warn(`⚠️ Some data still remains. You may need to run cleanup again.`);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error during manual cleanup:`, error);
  }
}

// Run the cleanup
runManualCleanup();
