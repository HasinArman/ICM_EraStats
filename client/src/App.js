import React, { useState, useEffect } from "react";
import * as d3 from "d3";
import axios from "axios";

const AllergyDashboard = () => {
  const [patientIds, setPatientIds] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [allergyData, setAllergyData] = useState({
    alerts: [],
    extractedAllergies: [],
    extractedMedications: [],
    clinicalStatus: { resolved: 0, inactive: 0, active: 0 },
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPatientIds = async () => {
      try {
        const response = await axios.get(
          "https://fhir-backend.vercel.app/api/allergy/patients-with-allergies"
        );
        const uniqueIds = [...new Set(response.data.patientIds)];
        setPatientIds(uniqueIds);
      } catch (error) {
        console.error("Error fetching patient IDs:", error);
      }
    };
    fetchPatientIds();
  }, []);

  useEffect(() => {
    const fetchAllergyData = async () => {
      if (!selectedPatient) return;

      setLoading(true);
      try {
        const response = await axios.get(
          `https://fhir-backend.vercel.app/api/allergy/${selectedPatient}`
        );

        const uniqueMedications = response.data.extractedMedications?.reduce(
          (unique, medication) => {
            if (!unique.some((item) => item.code === medication.code)) {
              unique.push(medication);
            }
            return unique;
          },
          []
        );

        const uniqueAllergies = response.data.extractedAllergies?.reduce(
          (unique, allergy) => {
            if (!unique.some((item) => item.id === allergy.id)) {
              unique.push(allergy);
            }
            return unique;
          },
          []
        );

        const uniqueAlerts = [...new Set(response.data.alerts || [])];

        setAllergyData({
          ...response.data,
          extractedMedications: uniqueMedications || [],
          extractedAllergies: uniqueAllergies || [],
          alerts: uniqueAlerts,
        });

        renderChart(response.data.clinicalStatus);
      } catch (error) {
        console.error("Error fetching allergy data:", error);
      }
      setLoading(false);
    };

    fetchAllergyData();
  }, [selectedPatient]);

  const renderChart = (clinicalStatus) => {
    d3.select("#chart").selectAll("*").remove();

    const data = [
      { label: "Resolved", value: clinicalStatus.resolved },
      { label: "Inactive", value: clinicalStatus.inactive },
      { label: "Active", value: clinicalStatus.active },
    ];

    const width = 400;
    const height = 400;
    const margin = { top: 20, right: 20, bottom: 50, left: 50 };

    const svg = d3
      .select("#chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([margin.left, width - margin.right])
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x));

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    const tooltip = d3
      .select("#chart")
      .append("div")
      .style("position", "absolute")
      .style("background", "#fff")
      .style("border", "1px solid #ccc")
      .style("padding", "5px")
      .style("display", "none");

    svg
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.label))
      .attr("y", (d) => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", (d) => y(0) - y(d.value))
      .attr("fill", "#4caf50")
      .on("mouseover", (event, d) => {
        tooltip
          .style("display", "block")
          .html(`<strong>${d.label}</strong>: ${d.value}`)
          .style("left", `${event.pageX + 5}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.pageX + 5}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", () => {
        tooltip.style("display", "none");
      });
  };

  return (
    <div className="bg-gray-100 min-h-screen p-5 relative">
      {loading && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="loader border-t-4 border-b-4 border-white w-12 h-12 rounded-full animate-spin"></div>
        </div>
      )}

      <header className="bg-blue-600 text-white p-5 rounded-lg shadow-lg mb-5">
        <h1 className="text-2xl font-bold">Allergy Dashboard</h1>
      </header>

      <div className="flex gap-5">
        <div className="w-2/4 bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold mb-3">Select Patient</h2>
          <select
            className="w-full border border-gray-300 rounded p-2"
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
          >
            <option value="">-- Select a Patient --</option>
            {patientIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>

          {allergyData.alerts.length > 0 && (
            <div className="mt-5">
              <h3 className="text-lg font-semibold">Alerts</h3>
              <ul className="space-y-2">
                {allergyData.alerts.map((alert, index) => (
                  <li
                    key={index}
                    className="p-3 bg-red-500 text-white rounded-lg shadow animate-pulse"
                  >
                    {alert}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {allergyData.extractedAllergies.length > 0 && (
            <div className="mt-5">
              <h3 className="text-lg font-semibold"> Allergies</h3>
              <ul className="space-y-2">
                {allergyData.extractedAllergies.map((allergy) => (
                  <li
                    key={allergy.id}
                    className="p-3 bg-yellow-100 rounded shadow"
                  >
                    <strong>Allergy ID:</strong> {allergy.id}
                    <br />
                    <strong>Code:</strong> {allergy.code.join(", ")}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="w-2/4 bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold mb-3">
            Clinical & Verification Status
          </h2>
          <div id="chart" className="w-full"></div>

          {allergyData.extractedMedications.length > 0 && (
            <div className="mt-5">
              <h3 className="text-lg font-semibold">Medications</h3>
              <ul className="space-y-2">
                {allergyData.extractedMedications.map((medication) => (
                  <li
                    key={medication.id}
                    className="p-3 bg-blue-100 rounded shadow"
                  >
                    <strong>Medication ID:</strong> {medication.id}
                    <br />
                    <strong>Code:</strong> {medication.code}
                    <br />
                    <strong>Status:</strong> {medication.status}
                    <br />
                    <strong>Authored On:</strong> {medication.authoredOn}
                    <br />
                    <strong>Dosage:</strong>
                    <ul className="pl-5 list-disc">
                      {medication.dosageInstruction.map(
                        (instruction, index) => (
                          <li key={index}>
                            <strong>Instruction:</strong> {instruction.text}
                            <br />
                            <strong>Additional Instruction:</strong>{" "}
                            {instruction.additionalInstruction?.join(", ") ||
                              "N/A"}
                            <br />
                            <strong>Route:</strong>{" "}
                            {instruction.route || "N/A"}
                            <br />
                            <strong>Dose Range:</strong>{" "}
                            {instruction.doseAndRate[0]?.doseRange
                              ? `${instruction.doseAndRate[0].doseRange.low.value} ${instruction.doseAndRate[0].doseRange.low.unit} - ${instruction.doseAndRate[0].doseRange.high.value} ${instruction.doseAndRate[0].doseRange.high.unit}`
                              : "N/A"}
                          </li>
                        )
                      )}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AllergyDashboard;
