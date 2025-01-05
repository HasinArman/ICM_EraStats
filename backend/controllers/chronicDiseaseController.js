const axios = require("axios");
const FHIR_BASE_URL = "https://hapi.fhir.org/baseR4";

const fetchFHIRResource = async (url, retries = 3, delay = 1000) => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 429 && retries > 0) {
      console.log(`Rate limit exceeded. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay)); // wait for 'delay' ms
      return fetchFHIRResource(url, retries - 1, delay * 2); // Exponentially increase delay for retries
    } else {
      console.error(`Error fetching ${url}:`, error.message);
      return null;
    }
  }
};

exports.chronic_disease_patients = async (req, res) => {
    console.log("api in");
  try {
    const url = `${FHIR_BASE_URL}/Condition?clinical-status=active`;
    const response = await fetchFHIRResource(url);

    if (!response || !response.entry) {
      return res
        .status(404)
        .json({ message: "No active chronic diseases found." });
    }

    const patientIds = [
      ...new Set(
        response.entry
          .map((entry) => {
            const patientRef = entry.resource.subject?.reference;
            return patientRef ? patientRef.split("/")[1] : null;
          })
          .filter((id) => id)
      ),
    ];

    console.log(patientIds);

    // Fetch data for each patient and filter out those without most of the essential data
    const validPatientIds = [];

    for (const patientId of patientIds) {
      const patientData = await fetchFHIRResource(
        `${FHIR_BASE_URL}/Patient/${patientId}`
      );

      // Check if the patient has most essential data (e.g., name, gender, and either birthDate or address)
    //   if (patientData) {
    //     const hasEssentialData = patientData.name?.[0]?.text;

    //     if (hasEssentialData) {
    //       validPatientIds.push(patientId);
    //     }
    //   }
    }

    if (patientIds.length === 0) {
      return res
        .status(404)
        .json({ message: "No patients with essential data found." });
    }

    res.json({ patientIds: patientIds });
  } catch (error) {
    console.error("Error fetching chronic disease patients:", error.message);
    res
      .status(500)
      .json({ error: "Failed to retrieve chronic disease patients" });
  }
};

exports.getPatientData = async (req, res) => {
  const { id } = req.params;

  try {
    // FHIR endpoints
    const endpoints = {
      patientInfo: `${FHIR_BASE_URL}/Patient/${id}`,
      chronicConditions: `${FHIR_BASE_URL}/Condition?patient=${id}&clinical-status=active`,
      medications: `${FHIR_BASE_URL}/MedicationRequest?patient=${id}&status=active`,
      labResults: `${FHIR_BASE_URL}/Observation?patient=${id}&_sort=-date`,
      allergies: `${FHIR_BASE_URL}/AllergyIntolerance?patient=${id}`,
      carePlans: `${FHIR_BASE_URL}/CarePlan?patient=${id}`,
      encounters: `${FHIR_BASE_URL}/Encounter?patient=${id}`,
      observationsVitalSigns: `${FHIR_BASE_URL}/Observation?patient=${id}&category=vital-signs`,
      appointments: `${FHIR_BASE_URL}/Appointment?patient=${id}&status=booked`,
    };

    // Fetch data in parallel
    const [
      patientInfo,
      chronicConditions,
      medications,
      labResults,
      allergies,
      carePlans,
      encounters,
      observationsVitalSigns,
      appointments,
    ] = await Promise.all([
      fetchFHIRResource(endpoints.patientInfo),
      fetchFHIRResource(endpoints.chronicConditions),
      fetchFHIRResource(endpoints.medications),
      fetchFHIRResource(endpoints.labResults),
      fetchFHIRResource(endpoints.allergies),
      fetchFHIRResource(endpoints.carePlans),
      fetchFHIRResource(endpoints.encounters),
      fetchFHIRResource(endpoints.observationsVitalSigns),
      fetchFHIRResource(endpoints.appointments),
    ]);

    // Extract relevant data
    const response = {
      patientInfo: {
        name: patientInfo?.name?.[0]?.text || "Unknown",
        gender: patientInfo?.gender || "Unknown",
        birthDate: patientInfo?.birthDate || "Unknown",
        address: patientInfo?.address?.[0]
          ? `${patientInfo.address[0].line.join(", ")} ${
              patientInfo.address[0].city
            }`
          : "Unknown",
      },
      chronicConditions:
        chronicConditions?.entry?.map((entry) => ({
          conditionCode: entry.resource.code?.text || "Unknown",
          conditionStatus: entry.resource.clinicalStatus?.text || "Unknown",
          onsetDate: entry.resource.onsetDateTime || "Unknown",
        })) || [],
      medications:
        medications?.entry?.map((entry) => ({
          medication:
            entry.resource.medicationCodeableConcept?.text || "Unknown",
          dosageInstruction:
            entry.resource.dosageInstruction?.[0]?.text || "Unknown",
          status: entry.resource.status || "Unknown",
        })) || [],
      labResults:
        labResults?.entry?.map((entry) => ({
          testCode: entry.resource.code?.text || "Unknown",
          result: entry.resource.valueQuantity?.value || "Unknown",
          unit: entry.resource.valueQuantity?.unit || "Unknown",
          date: entry.resource.effectiveDateTime || "Unknown",
        })) || [],
      allergies:
        allergies?.entry?.map((entry) => ({
          substance: entry.resource.substance?.text || "Unknown",
          reaction:
            entry.resource.reaction?.[0]?.manifestation?.[0]?.text || "Unknown",
        })) || [],
      carePlans:
        carePlans?.entry?.map((entry) => ({
          carePlanTitle: entry.resource.title || "Unknown",
          status: entry.resource.status || "Unknown",
        })) || [],
      encounters:
        encounters?.entry?.map((entry) => ({
          encounterType: entry.resource.type?.[0]?.text || "Unknown",
          status: entry.resource.status || "Unknown",
          date: entry.resource.period?.start || "Unknown",
        })) || [],
      observationsVitalSigns:
        observationsVitalSigns?.entry?.map((entry) => ({
          observationCode: entry.resource.code?.text || "Unknown",
          value: entry.resource.valueQuantity?.value || "Unknown",
          unit: entry.resource.valueQuantity?.unit || "Unknown",
          date: entry.resource.effectiveDateTime || "Unknown",
        })) || [],
      appointments:
        appointments?.entry?.map((entry) => ({
          appointmentType: entry.resource.type?.[0]?.text || "Unknown",
          status: entry.resource.status || "Unknown",
          date: entry.resource.start || "Unknown",
        })) || [],
      chartData:
        observationsVitalSigns?.entry
          ?.map((entry) => ({
            observation: entry.resource.code?.text || "Unknown",
            value: entry.resource.valueQuantity?.value || null,
            unit: entry.resource.valueQuantity?.unit || "",
            date: entry.resource.effectiveDateTime || null,
          }))
          .filter((data) => data.value !== null && data.date) || [],
    };

    // Return the cleaned and extracted data
    res.json(response);
  } catch (error) {
    console.error("Error processing patient data:", error.message);
    res.status(500).json({ error: "Failed to fetch patient data" });
  }
};
