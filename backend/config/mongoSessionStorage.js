import sessionHandler from "../utils/sessionHandler.js";

/**
 * MongoDB Session Storage implementation for Shopify API
 * This replaces the SQLite session storage with MongoDB
 */
class MongoSessionStorage {
  constructor() {
    this.ready = Promise.resolve();
  }

  async storeSession(session) {
    return await sessionHandler.storeSession(session);
  }

  async loadSession(id) {
    return await sessionHandler.loadSession(id);
  }

  async deleteSession(id) {
    return await sessionHandler.deleteSession(id);
  }

  async deleteSessions(ids) {
    const deletePromises = ids.map(id => sessionHandler.deleteSession(id));
    await Promise.all(deletePromises);
    return true;
  }

  async findSessionsByShop(shop) {
    const SessionModel = (await import("../models/SessionModel.js")).default;
    const sessions = await SessionModel.find({ shop });
    
    if (!sessions || sessions.length === 0) {
      return [];
    }

    const loadPromises = sessions.map(session => sessionHandler.loadSession(session.id));
    const loadedSessions = await Promise.all(loadPromises);
    
    return loadedSessions.filter(session => session !== undefined);
  }
}

export { MongoSessionStorage };
