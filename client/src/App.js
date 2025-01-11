import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Function to generate alerts based on allergies and medications
const generateAlerts = (allergies = [], medications = []) => {
  const alerts = [];
  allergies.forEach((allergy) => {
    const substance =
      allergy.code?.coding?.[0]?.display ||
      allergy.code?.text ||
      "Unknown substance";

    const clinicalStatus =
      allergy.clinicalStatus?.coding?.[0]?.code || "unknown";

    if (clinicalStatus === "active") {
      alerts.push(`Alert: Active allergy detected - ${substance}`);
    }

    medications.forEach((medication) => {
      const medicationName =
        medication.resource?.contained?.[0]?.code?.coding?.[0]?.display ||
        medication.resource?.medicationCodeableConcept?.text ||
        "Unknown medication";
       

        console.log("subs", clinicalStatus);
      if (substance.toLowerCase() === medicationName.toLowerCase()) {
        alerts.push(
          `Warning: Potential interaction between medication (${medicationName}) and allergy (${substance})`
        );
      }
    });

  });
  console.log("Aa", alerts)
  return alerts;
};

// Function to fetch allergies from the local file
const getAllergies = async (patientId) => {
  try {
    const response = await fetch(`/data/all_allergies.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch allergies: ${response.statusText}`);
    }

    const data = await response.json();
    if (Array.isArray(data.entry)) {
      const allergies = data.entry
        .filter((entry) => entry.resource.patient?.reference === patientId)
        .map((entry) => ({
          id: entry.resource.id,
          clinicalStatus: entry.resource.clinicalStatus,
          verificationStatus: entry.resource.verificationStatus,
          code: entry.resource.code,
          patient: entry.resource.patient?.reference || null,
          onset: entry.resource.onsetDateTime || null,
        }));

      return allergies;
    }

    return [];
  } catch (error) {
    console.error("Error fetching allergies:", error.message);
    throw new Error("Unable to fetch allergy data");
  }
};

// Function to fetch medications from the local file
const getMedications = async (patientId) => {
  try {
    const response = await fetch(`/data/all_medications.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch medications: ${response.statusText}`);
    }

    const data = await response.json();
    if (Array.isArray(data.entry)) {
      return data.entry.filter(
        (entry) => entry.resource.subject?.reference === patientId
      );
    } else {
      console.warn("No valid 'entry' field found in medications data.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching medications:", error.message);
    throw new Error("Unable to fetch medication data");
  }
};


const App = () => {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [allergies, setAllergies] = useState([]);
  const [medications, setMedications] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch(`/data/all_allergies.json`);
        console.log(response)
        if (!response.ok) {
          throw new Error(`Failed to fetch patients: ${response.statusText}`);
        }

        const data = await response.json();
        if (Array.isArray(data.entry)) {
          const patientIds = data.entry
            .map((entry) => entry.resource.patient?.reference)
            .filter(Boolean);
          setPatients(patientIds);
        } else {
          throw new Error("No valid 'entry' field found in the response");
        }
      } catch (error) {
        console.error("Error fetching patients:", error.message);
        setError("Unable to fetch patients");
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      const fetchAllergiesAndMedications = async () => {
        try {
          const allergiesData = await getAllergies(selectedPatient);
          setAllergies(allergiesData);

          const medicationsData = await getMedications(selectedPatient);
          setMedications(medicationsData);

       

          const extractedAllergies = allergiesData.map(allergy => ({
            id: allergy.id,
            code: allergy.code.coding.map(coding => coding.display),
             clinicalStatus: allergy.clinicalStatus?.coding?.[0]?.code || "unknown"
        }));
        
        // console.log(extractedAllergies)
    
        const extractedMedications = medicationsData.map(medication => ({
            id: medication.resource.id,
            code: medication.resource.contained[0].code.coding[0].display,
            status: medication.resource.status,
            subject: medication.resource.subject.display,
            authoredOn: medication.resource.authoredOn,
            dosageInstruction: medication.resource.dosageInstruction.map(inst => ({
              text: inst.text,
              additionalInstruction: inst.additionalInstruction.map(instr => instr.text),
              timing: inst.timing.repeat,
              asNeededCodeableConcept: inst.asNeededCodeableConcept.coding[0].display,
              route: inst.route.coding[0].display,
              doseAndRate: inst.doseAndRate.map(rate => ({
                doseRange: {
                  low: rate.doseRange.low,
                  high: rate.doseRange.high
                },
                type: rate.type.coding[0].display
              }))
            })),
            intent: medication.resource.intent
          }));

          console.log("extractedAllergies",extractedAllergies);
          console.log(" extractedMedications", extractedMedications);

          const alerts = generateAlerts(allergiesData, medicationsData);
          console.log(alert);
          alerts.forEach((alert) => toast.warn(alert));
        } catch (error) {
          console.error(error.message);
          setError("Unable to fetch allergies or medications");
        }
      };

      fetchAllergiesAndMedications();
    }
  }, [selectedPatient]);

  const handleSelectChange = (event) => {
    setSelectedPatient(event.target.value);
  };

  return (
    <div>
      <h1>Select Patient</h1>
      {loading ? (
        <p>Loading patients...</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : (
        <>
          <select value={selectedPatient} onChange={handleSelectChange}>
            <option value="">Select a Patient</option>
            {patients.map((patientId, index) => (
              <option key={index} value={patientId}>
                {patientId}
              </option>
            ))}
          </select>

          {selectedPatient && (
            <>
              <p>Selected Patient ID: {selectedPatient}</p>
              <div>
                <h2>Allergies:</h2>
                {allergies.length > 0 ? (
                  <ul>
                    {allergies.map((allergy, index) => (
                      <li key={index}>
                        <strong>Allergy ID:</strong> {allergy.id},{" "}
                        <strong>Clinical Status:</strong>{" "}
                        {allergy.clinicalStatus?.coding?.[0]?.code || "Unknown"}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No allergies found.</p>
                )}
              </div>

              <div>
                <h2>Medications:</h2>
                {medications.length > 0 ? (
                  <ul>
                    {medications.map((medication, index) => (
                      <li key={index}>
                        <strong>Medication ID:</strong>{" "}
                        {medication.resource?.id || "Unknown"},{" "}
                        <strong>Name:</strong>{" "}
                        {medication.resource?.medicationCodeableConcept?.text ||
                          "Unknown"}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No medications found.</p>
                )}
              </div>
            </>
          )}
        </>
      )}
      <ToastContainer />
    </div>
  );
};

export default App;
