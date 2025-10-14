/**
 * App Installation Webhook Handler
 * 
 * Handles app/uninstalled webhook to trigger Day 1 data fetch
 * when a store installs the app for the first time.
 */

import { executeDay1DataFetch } from '../jobs/day1DataFetchJob.js';
import { storeManager } from '../auth/index.js';

/**
 * Handle app installation webhook
 * This is called when the app is installed (not when uninstalled)
 */
export async function handleAppInstallation(shop, webhookData) {
  console.log(`🔔 [APP-INSTALL] App installation detected for shop: ${shop}`);
  console.log(`📋 [APP-INSTALL] Webhook data:`, webhookData);
  
  try {
    // Check if this is a fresh installation or reinstallation
    const storeData = await storeManager.getStore(shop);
    
    if (!storeData) {
      console.log(`❌ [APP-INSTALL] No store data found for ${shop}`);
      return;
    }
    
    const isFirstInstall = !storeData.day1DataSynced;
    
    if (isFirstInstall) {
      console.log(`🎉 [APP-INSTALL] First-time installation detected for ${shop}. Triggering Day 1 data fetch...`);
      
      // Schedule Day 1 data fetch job with a delay to ensure installation is complete
      setTimeout(async () => {
        try {
          await executeDay1DataFetch(shop, {
            trigger: 'app_installation',
            webhookData
          });
        } catch (error) {
          console.error(`❌ [APP-INSTALL] Failed to execute Day 1 data fetch for ${shop}:`, error);
        }
      }, 30000); // 30 second delay
      
      console.log(`✅ [APP-INSTALL] Day 1 data fetch scheduled for ${shop}`);
      
    } else {
      console.log(`ℹ️ [APP-INSTALL] Reinstallation detected for ${shop}. Day 1 data already synced.`);
      
      // For reinstallations, we might want to do incremental sync
      // or just update the installation timestamp
      await storeManager.updateStore(shop, {
        lastInstalledAt: new Date(),
        reinstallCount: (storeData.reinstallCount || 0) + 1
      });
    }
    
  } catch (error) {
    console.error(`❌ [APP-INSTALL] Error handling app installation for ${shop}:`, error);
  }
}

/**
 * Handle app uninstallation webhook
 */
export async function handleAppUninstallation(shop, webhookData) {
  console.log(`🔔 [APP-UNINSTALL] App uninstallation detected for shop: ${shop}`);
  
  try {
    // Update store status but don't delete data (for potential reinstalls)
    await storeManager.updateStore(shop, {
      isActive: false,
      uninstalledAt: new Date(),
      uninstallReason: webhookData?.reason || 'unknown'
    });
    
    console.log(`✅ [APP-UNINSTALL] Store status updated for ${shop}`);
    
    // TODO: Optionally clean up scheduled jobs for this shop
    // TODO: Send uninstall analytics/notifications
    
  } catch (error) {
    console.error(`❌ [APP-UNINSTALL] Error handling app uninstallation for ${shop}:`, error);
  }
}

/**
 * Webhook handler mapping
 */
export const appWebhookHandlers = {
  'app/uninstalled': handleAppUninstallation,
  // Note: Shopify doesn't have an 'app/installed' webhook
  // We trigger Day 1 fetch from the OAuth completion instead
};

export default appWebhookHandlers;
