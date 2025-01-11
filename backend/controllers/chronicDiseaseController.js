const axios = require('axios');

// Base URL for FHIR server
const FHIR_BASE_URL = 'http://hapi.fhir.org/baseR4';

// Get all information (Allergies and Medications) for a patient by ID
exports.getPatientInfo = async (req, res) => {
    const { patientId } = req.params;

    if (!patientId) {
        return res.status(400).json({ message: 'Patient ID is required' });
    }

    try {
        // Fetch allergies for the patient
        const allergiesResponse = await axios.get(`${FHIR_BASE_URL}/AllergyIntolerance?patient=${patientId}`);
        console.log('Allergies Response:', allergiesResponse.data);  // Log raw response
        const allergies = allergiesResponse.data.entry
            ? allergiesResponse.data.entry.map((entry) => ({
                  id: entry.resource.id,
                  substance: entry.resource.code?.text || 'Unknown Substance',
                  severity: entry.resource.reaction?.[0]?.severity || 'Unknown Severity',
                  manifestation: entry.resource.reaction?.[0]?.manifestation?.map((m) => m.text).join(', ') || 'Unknown',
              }))
            : [];

        // Fetch medications for the patient
        const medicationsResponse = await axios.get(`${FHIR_BASE_URL}/MedicationRequest?patient=${patientId}`);
        console.log('Medications Response:', medicationsResponse.data);  // Log raw response
        const medications = medicationsResponse.data.entry
            ? medicationsResponse.data.entry.map((entry) => ({
                  id: entry.resource.id,
                  medication: entry.resource.medicationCodeableConcept?.text || 'Unknown Medication',
                  status: entry.resource.status || 'Unknown Status',
              }))
            : [];

        // Return relevant data
        res.status(200).json({
            patientId,
            allergies: allergies.length > 0 ? allergies : 'No allergies recorded for this patient.',
            medications: medications.length > 0 ? medications : 'No medications recorded for this patient.',
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error fetching patient information', error: error.message });
    }
};


// Get all patient IDs with allergies
exports.getPatientsWithAllergies = async (req, res) => {
    try {
        // Fetch all AllergyIntolerance resources
        const response = await axios.get(`${FHIR_BASE_URL}/AllergyIntolerance`);
        const allergyData = response.data;

        // Check if `entry` exists and extract patient IDs safely
        const patientIds = allergyData.entry
            ? [...new Set(
                  allergyData.entry
                      .map((entry) => entry.resource?.patient?.reference?.split('/')[1])
                      .filter(Boolean) // Remove undefined or null values
              )]
            : [];

        res.status(200).json({ patientIds });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error fetching patients with allergies', error: error.message });
    }
};

