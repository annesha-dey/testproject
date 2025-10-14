/**
 * Report Routes for Profit Analyser
 */

import express from "express";
import { validateSession } from "../../../../core/auth/index.js";
import ReportController from "../controllers/ReportController.js";

const router = express.Router();
const reportController = new ReportController();

// Generate profit report
router.post("/generate", validateSession, async (req, res) => {
  try {
    const { shop } = req.query;
    const reportConfig = req.body;
    
    const report = await reportController.generateProfitReport(shop, reportConfig);
    res.json({ success: true, report });
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get available reports
router.get("/", validateSession, async (req, res) => {
  try {
    const { shop } = req.query;
    const reports = await reportController.getAvailableReports(shop);
    res.json({ success: true, reports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Download report
router.get("/:reportId/download", validateSession, async (req, res) => {
  try {
    const { shop } = req.query;
    const { reportId } = req.params;
    
    const reportData = await reportController.downloadReport(shop, reportId);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="profit-report-${reportId}.json"`);
    res.json(reportData);
  } catch (error) {
    console.error("Error downloading report:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
