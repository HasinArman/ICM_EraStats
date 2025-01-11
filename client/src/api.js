// src/api.js
import axios from "axios";

const FHIR_BASE_URL = "https://hapi.fhir.org/baseR4";

// Get allergies for a patient
export const getAllergies = async (patientId) => {
  try {
    const response = await axios.get(
      `${FHIR_BASE_URL}/AllergyIntolerance?patient=${patientId}`
    );
    return response.data.entry || [];
  } catch (error) {
    console.error("Error fetching allergies:", error.message);
    throw new Error("Unable to fetch allergy data");
  }
};

// Get medications for a patient
export const getMedications = async (patientId) => {
  try {
    const response = await axios.get(
      `${FHIR_BASE_URL}/MedicationRequest?patient=${patientId}`
    );
    return response.data.entry || [];
  } catch (error) {
    console.error("Error fetching medications:", error);
    throw new Error("Unable to fetch medication data");
  }
};

// Get all patients with allergies
export const getPatientsWithAllergies = async () => {
  try {
    const response = await axios.get(`${FHIR_BASE_URL}/AllergyIntolerance`);
    return response.data.entry || [];
  } catch (error) {
    console.error("Error fetching patients with allergies:", error.message);
    throw new Error("Unable to fetch patients with allergies");
  }
};
