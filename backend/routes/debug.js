import express from "express";
import SessionVerifier from "../utils/sessionVerifier.js";

const router = express.Router();

// Initialize session verifier
const sessionVerifier = new SessionVerifier();

/**
 * Debug endpoint to view all sessions
 */
router.get("/sessions", async (req, res) => {
  try {
    const sessions = await sessionVerifier.getAllSessions();
    const stats = await sessionVerifier.getSessionStats();
    
    res.json({
      success: true,
      totalSessions: sessions.length,
      sessions: sessions.map(session => ({
        id: session.id,
        shop: session.shop,
        mongoId: session._id,
        hasContent: !!session.content
      })),
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Debug endpoint to view sessions for a specific shop
 */
router.get("/sessions/shop/:shop", async (req, res) => {
  try {
    const { shop } = req.params;
    const sessions = await sessionVerifier.getSessionsByShop(shop);
    
    res.json({
      success: true,
      shop,
      sessionCount: sessions.length,
      sessions: sessions.map(session => ({
        id: session.id,
        shop: session.shop,
        mongoId: session._id,
        hasContent: !!session.content
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Debug endpoint to inspect a specific session
 */
router.get("/sessions/inspect/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await sessionVerifier.inspectSession(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }
    
    res.json({
      success: true,
      session: {
        id: session.id,
        shop: session.shop,
        mongoId: session._id,
        hasContent: !!session.content
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
