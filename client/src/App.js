import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as d3 from 'd3';

const PatientDashboard = () => {
  const [patientIds, setPatientIds] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingPatientIds, setLoadingPatientIds] = useState(true);

  const chartRef = React.createRef();

  const FHIR_BASE_URL = 'https://hapi.fhir.org/baseR4';

  const fetchFHIRResource = async (url) => {
    try {
      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/fhir+json',
          'Accept': 'application/fhir+json',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${url}:`, error.message);
      return null;
    }
  };

  useEffect(() => {
    setLoadingPatientIds(true);
    fetchFHIRResource(`${FHIR_BASE_URL}/Condition?clinical-status=active`)
      .then((response) => {
        const patientIds = response.entry.map((entry) => entry.resource.subject.reference.split('/')[1]);
        setPatientIds(patientIds);
      })
      .catch((error) => console.error('Error fetching patient IDs:', error))
      .finally(() => setLoadingPatientIds(false));
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      setLoading(true);
      setPatientData(null);
      fetchFHIRResource(`${FHIR_BASE_URL}/Patient/${selectedPatientId}`)
        .then((response) => {
          const patientData = response;
          fetchFHIRResource(`${FHIR_BASE_URL}/Condition?patient=${selectedPatientId}&clinical-status=active`)
            .then((response) => {
              patientData.chronicConditions = response.entry.map((entry) => ({
                conditionCode: entry.resource.code.text,
                conditionStatus: entry.resource.clinicalStatus.text,
                onsetDate: entry.resource.onsetDateTime,
              }));
              fetchFHIRResource(`${FHIR_BASE_URL}/MedicationRequest?patient=${selectedPatientId}&status=active`)
                .then((response) => {
                  patientData.medications = response.entry.map((entry) => ({
                    medication: entry.resource.medicationCodeableConcept.text,
                    dosageInstruction: entry.resource.dosageInstruction[0].text,
                    status: entry.resource.status,
                  }));
                  fetchFHIRResource(`${FHIR_BASE_URL}/Observation?patient=${selectedPatientId}&category=vital-signs`)
                    .then((response) => {
                      patientData.observationsVitalSigns = response.entry.map((entry) => ({
                        observationCode: entry.resource.code.text,
                        value: entry.resource.valueQuantity.value,
                        unit: entry.resource.valueQuantity.unit,
                        date: entry.resource.effectiveDateTime,
                      }));
                      setPatientData(patientData);
                    })
                    .catch((error) => console.error('Error fetching vital signs:', error))
                    .finally(() => setLoading(false));
                })
                .catch((error) => console.error('Error fetching medications:', error));
            })
            .catch((error) => console.error('Error fetching chronic conditions:', error));
        })
        .catch((error) => console.error('Error fetching patient data:', error))
        .finally(() => setLoading(false));
    }
  }, [selectedPatientId]);

  useEffect(() => {
    if (patientData && chartRef.current) {
      const { observationsVitalSigns } = patientData;

      if (observationsVitalSigns && observationsVitalSigns.length > 0) {
        const margin = { top: 20, right: 30, bottom: 40, left: 40 };
        const width = 800 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const svg = d3
          .select(chartRef.current)
          .append('svg')
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
          .append('g')
          .attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3
          .scaleTime()
          .domain(d3.extent(observationsVitalSigns, (d) => new Date(d.date)))
          .range([0, width]);

        const y = d3
          .scaleLinear()
          .domain([0, d3.max(observationsVitalSigns, (d) => d.value)])
          .range([height, 0]);

        svg
          .append('g')
          .attr('transform', `translate(0,${height})`)
          .call(d3.axisBottom(x));

        svg
          .append('g')
          .call(d3.axisLeft(y));

        svg
          .selectAll('.line')
          .data([observationsVitalSigns])
          .enter()
          .append('path')
          .attr('fill', 'none')
          .attr('stroke', 'steelblue')
          .attr('stroke-width', 2)
          .attr(
            'd',
            d3
              .line()
              .x((d) => x(new Date(d.date)))
              .y((d) => y(d.value))
          );
      }
    }
  }, [patientData]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Chronic Disease Patient Dashboard
      </h1>

      {/* Select Patient */}
      <div className="flex justify-center mb-6">
        <select
          className="border border-gray-300 rounded p-2"
          onChange={(e) => setSelectedPatientId(e.target.value)}
        >
          <option value="">Select a Patient</option>
          {loadingPatientIds ? (
            <option>Loading...</option> // Show loading message while fetching IDs
          ) : (
            patientIds.map((id) => (
              <option key={id} value={id}>
                Patient ID: {id}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Loading Spinner for Patient Data */}
      {loading ? (
        <div className="flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-solid rounded-full animate-spin border-t-transparent"></div>
        </div>
      ) : patientData ? (
        <div className="bg-white shadow rounded-lg p-6">
          {/* Patient Info */}
          <h2 className="text-xl font-bold mb-4">Patient Information</h2>
          <p><strong>Name:</strong> {patientData.patientInfo?.name || "N/A"}</p>
          <p><strong>Gender:</strong> {patientData.patientInfo?.gender || "N/A"}</p>
          <p><strong>Birth Date:</strong> {patientData.patientInfo?.birthDate || "N/A"}</p>
          <p><strong>Address:</strong> {patientData.patientInfo?.address || "N/A"}</p>

          {/* Vital Signs Chart */}
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">Vital Signs Over Time</h2>
            <div ref={chartRef}></div>
          </div>

          {/* Chronic Conditions */}
          <h2 className="text-xl font-bold mt-6 mb-4">Chronic Conditions</h2>
          {patientData.chronicConditions?.length > 0 ? (
            <ul>
              {patientData.chronicConditions.map((condition, index) => (
                <li key={index}>
                  <strong>{condition.conditionCode}</strong> - Onset:{" "}
                  {condition.onsetDate} (Status: {condition.conditionStatus})
                </li>
              ))}
            </ul>
          ) : (
            <p>No chronic conditions found.</p>
          )}

          {/* Medications */}
          <h2 className="text-xl font-bold mt-6 mb-4">Medications</h2>
          {patientData.medications?.length > 0 ? (
            <ul>
              {patientData.medications.map((medication, index) => (
                <div key={index}>
                  <p><strong>{medication.name}</strong> - Medication: {medication.medication || "N/A"}</p>
                  <p><strong>{medication.name}</strong> - Dosage: {medication.dosageInstruction || "N/A"}</p>
                  <p><strong>{medication.name}</strong> - Status: {medication.status || "N/A"}</p>
                </div>
              ))}
            </ul>
          ) : (
            <p>No medications found.</p>
          )}

          {/* Lab Results */}
          <h2 className="text-xl font-bold mt-6 mb-4">Lab Results</h2>
          <ul>
            {patientData.labResults?.map((result, index) => (
              <li key={index}>
                <strong>{result.testCode}</strong>: {result.result} {result.unit}{" "}
                (Date: {result.date})
              </li>
            ))}
          </ul>

          {/* Allergies */}
          <h2 className="text-xl font-bold mt-6 mb-4">Allergies</h2>
          <ul>
            {patientData.allergies?.map((allergy, index) => (
              <li key={index}>
                <strong>{allergy.substance}</strong>: {allergy.reaction}
              </li>
            ))}
          </ul>

          {/* Care Plans */}
          <h2 className="text-xl font-bold mt-6 mb-4">Care Plans</h2>
          {patientData.carePlans?.length > 0 ? (
            <ul>
              {patientData.carePlans.map((plan, index) => (
                <li key={index}>{plan.planName || "Plan"} - Goal: {plan.goal || "N/A"}</li>
              ))}
            </ul>
          ) : (
            <p>No care plans found.</p>
          )}

          {/* Encounters */}
          <h2 className="text-xl font-bold mt-6 mb-4">Encounters</h2>
          <ul>
            {patientData.encounters?.map((encounter, index) => (
              <li key={index}>
                <strong>{encounter.encounterType}</strong> - Status:{" "}
                {encounter.status} (Date: {encounter.date})
              </li>
            ))}
          </ul>

          {/* Observations */}
          <h2 className="text-xl font-bold mt-6 mb-4">Vital Sign Observations</h2>
          <ul>
            {patientData.observationsVitalSigns?.map((observation, index) => (
              <li key={index}>
                <strong>{observation.observationCode}</strong>: {observation.value}{" "}
                {observation.unit} (Date: {observation.date})
              </li>
            ))}
          </ul>

          {/* Appointments */}
          <h2 className="text-xl font-bold mt-6 mb-4">Appointments</h2>
          <ul>
            {patientData.appointments?.map((appointment, index) => (
              <li key={index}>
                <strong>{appointment.appointmentType}</strong>: {appointment.status}{" "}
                (Date: {appointment.date})
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-center text-gray-500">Select a patient to view details.</p>
      )}
    </div>
  );
};

export default PatientDashboard;
