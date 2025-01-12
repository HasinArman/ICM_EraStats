const axios = require("axios");
const fs = require("fs");
const path = require("path");

const FHIR_BASE_URL = "https://hapi.fhir.org/baseR4";

// Utility function to save JSON data to a file for debugging
const saveToFile = (data, filename) => {
  const filePath = path.join(__dirname, `../data/${filename}`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
};

// Function to fetch allergy data for a patient
const getAllergies = async (patientId) => {
  try {
    const response = await axios.get(
      `${FHIR_BASE_URL}/AllergyIntolerance?patient=${patientId}`
    );

    if (response.data && Array.isArray(response.data.entry)) {
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

            // Fetch encounter details if reference exists
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

    if (response.data && Array.isArray(response.data.entry)) {
      console.log("Medication entries:", response.data.entry);

      // Extract medication data safely
      const medications = response.data.entry.map((entry) => {
        console.log(entry);
        if (entry.resource) {
          return {
            id: entry.resource?.id,
            code:
              entry.resource?.contained?.[0]?.code?.coding?.[0]?.display ||
              "N/A",
            status: entry.resource?.status,
            subject: entry.resource?.subject?.display || "N/A",
            authoredOn: entry.resource?.authoredOn || "N/A",
            dosageInstruction:
              entry.resource?.dosageInstruction?.map((inst) => ({
                text: inst.text || "N/A",
                additionalInstruction:
                  inst.additionalInstruction?.map((instr) => instr.text) || [],
                timing: inst.timing?.repeat || {},
                asNeededCodeableConcept:
                  inst.asNeededCodeableConcept?.coding?.[0]?.display || "N/A",
                route: inst.route?.coding?.[0]?.display || "N/A",
                doseAndRate:
                  inst.doseAndRate?.map((rate) => ({
                    doseRange: {
                      low: rate.doseRange?.low || {},
                      high: rate.doseRange?.high || {},
                    },
                    type: rate.type?.coding?.[0]?.display || "N/A",
                  })) || [],
              })) || [],
            intent: entry.resource?.intent || "N/A",
          };
        }
        console.warn("Invalid medication entry:", entry);
        return null; // Skip invalid entries
      });

      // Remove null entries from the results
      return medications.filter(Boolean);
    } else {
      console.error("No valid 'entry' field in response or it is not an array");
      return []; // Return an empty array if no valid entries exist
    }
  } catch (error) {
    console.error("Error fetching medications:", error.message);
    throw new Error("Unable to fetch medication data");
  }
};

// Function to get all patients with allergies
const getPatientsWithAllergies = async () => {
  try {
    const response = await axios.get(`${FHIR_BASE_URL}/AllergyIntolerance`);

    // Log the full response for debugging
    console.log(
      "FHIR Response for Allergies:",
      JSON.stringify(response.data, null, 2)
    );

    if (response.data && Array.isArray(response.data.entry)) {
      return response.data.entry
        .map((entry) => {
          if (entry.resource?.patient?.reference) {
            return entry.resource.patient.reference;
          } else {
            console.warn("Missing reference in entry:", entry);
            return null; // Skip entries without valid references
          }
        })
        .filter(Boolean); // Remove null values
    } else {
      console.error("No valid 'entry' field in response or it is not an array");
      return []; // Return an empty array
    }
  } catch (error) {
    console.error("Error fetching patients with allergies:", error.message);
    throw new Error("Unable to fetch patients with allergies");
  }
};

module.exports = { getAllergies, getMedications, getPatientsWithAllergies };
