const express = require("express");
const router = express.Router();
const {
  getPatientInfo,
  getPatientsWithAllergies,
} = require("../controllers/chronicDiseaseController");

router.get("/chronic-disease-patients", getPatientsWithAllergies);
router.get("/getPatientData/:patientId", getPatientInfo);

module.exports = router;
