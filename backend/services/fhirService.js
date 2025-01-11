// services/fhirService.js
const axios = require("axios");

const FHIR_BASE_URL = "https://hapi.fhir.org/baseR4";

const fs = require('fs');
const path = require('path');




const saveToFile = (data, filename) => {
    const filePath = path.join(__dirname, `../data/${filename}`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  };


const getAllergies = async (patientId) => {
    try {
      const response = await axios.get(
        `${FHIR_BASE_URL}/AllergyIntolerance?patient=${patientId}`
      );
  
      if (response.data && Array.isArray(response.data.entry)) {
        // Process each allergy entry
        const allergies = await Promise.all(
          response.data.entry.map(async (entry) => {
            if (entry.resource) {
              const allergyData = {
                id: entry.resource.id,
                clinicalStatus: entry.resource.clinicalStatus,
                verificationStatus: entry.resource.verificationStatus,
                code: entry.resource.code,
                patient: entry.resource.patient?.reference || null,
                onset: entry.resource.onsetDateTime || null,
              };
  
              // Fetch Encounter details if reference exists
              if (entry.resource.encounter?.reference) {
                try {
                  const encounterResponse = await axios.get(
                    `${FHIR_BASE_URL}/${entry.resource.encounter.reference}`
                  );
                  allergyData.encounterDetails = encounterResponse.data || null;
                } catch (error) {
                  console.error(
                    `Error fetching encounter details for reference ${entry.resource.encounter.reference}:`,
                    error.message
                  );
                  allergyData.encounterDetails = null; // Default to null if fetch fails
                }
              } else {
                allergyData.encounterDetails = null; // No encounter reference
              }
  
              return allergyData;
            }
            return null; // Skip invalid entries
          })
        );
  
        // Remove null entries from the result
        return allergies.filter(Boolean);
      }
  
      return [];
    } catch (error) {
      console.error("Error fetching allergies:", error.message);
      throw new Error("Unable to fetch allergy data");
    }
  };
  
  

// Function to fetch medication data for a patient
const getMedications = async (patientId) => {
  try {
    const response = await axios.get(
      `${FHIR_BASE_URL}/MedicationRequest?patient=${patientId}`
    );
    
    console.log(response.data.entry.map((entry) => {
        return entry.resource.id
    }))
    let data = {
        id: "",
    };
    return response.data;
  } catch (error) {
    console.error("Error fetching medications:", error);
    throw new Error("Unable to fetch medication data");
  }
};

// Function to get all patients with allergies
const getPatientsWithAllergies = async () => {
  try {
    const response = await axios.get(`${FHIR_BASE_URL}/AllergyIntolerance`);

    // saveToFile(getPatientsWithAllergies, `getPatientsWithAllergies.json`);
    
    // Log the full response for debugging
    console.log("FHIR Response for Allergies:", JSON.stringify(response.data, null, 2));

    // Check if 'entry' exists and is an array
    if (response.data && response.data.entry && Array.isArray(response.data.entry)) {
      // Safely map over the entries and extract patient references
      return response.data.entry
        .map((entry) => {
          // Ensure 'patient' and 'reference' exist in each entry
          if (entry.resource && entry.resource.patient && entry.resource.patient.reference) {
            return entry.resource.patient.reference;
          } else {
            console.warn("Missing reference in entry:", entry);
            return null; // Skip entries without valid references
          }
        })
        .filter((reference) => reference !== null); // Remove null values from the result
    } else {
      console.error("No valid 'entry' field in response or it is not an array");
      return []; // Return an empty array if no entries are found or the structure is incorrect
    }
  } catch (error) {
    console.error("Error fetching patients with allergies:", error.message);
    throw new Error("Unable to fetch patients with allergies");
  }
};

module.exports = { getAllergies, getMedications, getPatientsWithAllergies };
