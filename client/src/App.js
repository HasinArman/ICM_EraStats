import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import * as d3 from "d3";
import io from "socket.io-client"; // Import socket.io-client for WebSocket

const PatientDashboard = () => {
  const [patientIds, setPatientIds] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingPatientIds, setLoadingPatientIds] = useState(true); // New loading state

  const chartRef = useRef(null); // Reference to the chart container

  // WebSocket setup: connect to the backend server
  const socket = useRef(null); // Socket reference

  const patientListEndpoint =
    "https://cuddly-tribble-v944gvg6rxghx9v6-5000.app.github.dev/api/chronicdisease/chronic-disease-patients";
  const patientDataEndpoint =
    "https://cuddly-tribble-v944gvg6rxghx9v6-5000.app.github.dev/api/chronicdisease/getPatientData/";

  // Fetch patient IDs
  useEffect(() => {
    setLoadingPatientIds(true); // Set loading state to true when fetching IDs
    axios
      .get(patientListEndpoint)
      .then((response) => setPatientIds(response.data.patientIds || []))
      .catch((error) => console.error("Error fetching patient IDs:", error))
      .finally(() => setLoadingPatientIds(false)); // Set loading state to false after data is fetched
  }, []);

  // Fetch patient data on ID change
  useEffect(() => {
    if (selectedPatientId) {
      setLoading(true);
      setPatientData(null);
      axios
        .get(`${patientDataEndpoint}${selectedPatientId}`)
        .then((response) => {
          console.log("Fetched patient data:", response.data);
          setPatientData(response.data);
        })
        .catch((error) => console.error("Error fetching patient data:", error))
        .finally(() => setLoading(false));
    }
  }, [selectedPatientId]);

  // D3 chart setup
  useEffect(() => {
    if (patientData && chartRef.current) {
      const { observationsVitalSigns } = patientData;

      if (observationsVitalSigns && observationsVitalSigns.length > 0) {
        // Set dimensions of the chart
        const margin = { top: 20, right: 30, bottom: 40, left: 40 };
        const width = 800 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        // Create an SVG container
        const svg = d3
          .select(chartRef.current)
          .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

        // Set up scales
        const x = d3
          .scaleTime()
          .domain(
            d3.extent(observationsVitalSigns, (d) => new Date(d.date))
          )
          .range([0, width]);

        const y = d3
          .scaleLinear()
          .domain([0, d3.max(observationsVitalSigns, (d) => d.value)])
          .range([height, 0]);

        // Add X axis
        svg
          .append("g")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(x));

        // Add Y axis
        svg.append("g").call(d3.axisLeft(y));

        // Add the line
        svg
          .append("path")
          .data([observationsVitalSigns])
          .attr("fill", "none")
          .attr("stroke", "steelblue")
          .attr("stroke-width", 1.5)
          .attr(
            "d",
            d3
              .line()
              .x((d) => x(new Date(d.date)))
              .y((d) => y(d.value))
          );
      }
    }
  }, [patientData]);

  // WebSocket: Listen for real-time updates
  useEffect(() => {
    // Create the WebSocket connection only once when the component is mounted
    socket.current = io("https://cuddly-tribble-v944gvg6rxghx9v6-3000.app.github.dev");

    // Listen for patient data updates from the backend
    socket.current.on("patientDataUpdate", (updatedPatientData) => {
      if (updatedPatientData.patientId === selectedPatientId) {
        setPatientData(updatedPatientData);
        console.log("Received real-time update for patient data:", updatedPatientData);
      }
    });

    return () => {
      // Clean up the socket connection when the component unmounts
      socket.current.disconnect();
    };
  }, [selectedPatientId]);

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
                <>
                  <li key={index}>
                    <strong>{medication.name}</strong> - Medication: {medication.medication || "N/A"}
                  </li>
                  <li key={index}>
                    <strong>{medication.name}</strong> - Dosage: {medication.dosageInstruction || "N/A"}
                  </li>
                  <li key={index}>
                    <strong>{medication.name}</strong> - status: {medication.status || "N/A"}
                  </li>
                </>
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
