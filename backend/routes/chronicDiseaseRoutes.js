const express = require("express");
const router = express.Router();
const {
  chronic_disease_patients,
  getPatientData,
} = require("../controllers/chronicDiseaseController");

router.get("/chronic-disease-patients", chronic_disease_patients);
router.get("/getPatientData/:id", getPatientData);

module.exports = router;
