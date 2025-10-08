import SessionModel from "../models/SessionModel.js";
import Cryptr from "cryptr";

/**
 * Utility to verify and inspect MongoDB session storage
 */
class SessionVerifier {
  constructor() {
    this.cryption = new Cryptr(process.env.ENCRYPTION_STRING);
  }

  /**
   * Get all sessions from MongoDB
   */
  async getAllSessions() {
    try {
      const sessions = await SessionModel.find({});
      console.log(`📊 Total sessions in database: ${sessions.length}`);
      return sessions;
    } catch (error) {
      console.error("❌ Error fetching sessions:", error);
      return [];
    }
  }

  /**
   * Get sessions for a specific shop
   */
  async getSessionsByShop(shop) {
    try {
      const sessions = await SessionModel.find({ shop });
      console.log(`🏪 Sessions for shop ${shop}: ${sessions.length}`);
      return sessions;
    } catch (error) {
      console.error(`❌ Error fetching sessions for shop ${shop}:`, error);
      return [];
    }
  }

  /**
   * Decrypt and display session content
   */
  async inspectSession(sessionId) {
    try {
      const session = await SessionModel.findOne({ id: sessionId });
      if (!session) {
        console.log(`❌ No session found with ID: ${sessionId}`);
        return null;
      }

      console.log(`\n📋 Session Details:`);
      console.log(`   ID: ${session.id}`);
      console.log(`   Shop: ${session.shop}`);
      console.log(`   MongoDB _id: ${session._id}`);
      
      // Decrypt content
      const decryptedContent = JSON.parse(this.cryption.decrypt(session.content));
      console.log(`   Decrypted Content:`, {
        shop: decryptedContent.shop,
        accessToken: decryptedContent.accessToken ? '[PRESENT]' : '[MISSING]',
        scope: decryptedContent.scope,
        expires: decryptedContent.expires,
        isOnline: decryptedContent.isOnline
      });

      return session;
    } catch (error) {
      console.error(`❌ Error inspecting session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Count sessions by shop
   */
  async getSessionStats() {
    try {
      const stats = await SessionModel.aggregate([
        {
          $group: {
            _id: "$shop",
            count: { $sum: 1 }
          }
        }
      ]);

      console.log(`\n📈 Session Statistics:`);
      stats.forEach(stat => {
        console.log(`   ${stat._id}: ${stat.count} session(s)`);
      });

      return stats;
    } catch (error) {
      console.error("❌ Error getting session stats:", error);
      return [];
    }
  }
}

export default SessionVerifier;
