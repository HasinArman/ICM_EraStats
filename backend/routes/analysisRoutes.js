const express = require("express");
const router = express.Router();
const {
  getUniqueConditions,
  getChartData,
  getAnalysisInsights,
} = require("../controllers/analysisController");

// Route to get unique conditions
router.get("/get_conditions", getUniqueConditions);
router.post("/getChartData", getChartData);
router.post("/getChartData", getChartData);
router.post("/getAnalysisInsights", getAnalysisInsights);

module.exports = router;
