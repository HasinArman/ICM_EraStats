// routes/allergyRoutes.js
const express = require("express");
const {
  getPatientInfo,
  getPatientsWithAllergiesInfo,

} = require("../controllers/allergyController");

const router = express.Router();

// Endpoint to get allergy and medication details for a patient by ID
router.get("/patient/:patientId", getPatientInfo);

// Endpoint to get patient IDs with allergies
router.get("/patients-with-allergies", getPatientsWithAllergiesInfo);

// router.post("/patient_getall", processPatientsData);

module.exports = router;
