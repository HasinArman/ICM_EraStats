import React, { useReducer, createContext, useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaSpinner } from "react-icons/fa"; // Importing a spinner icon
import LineChart from "./components/LineChart";
import BarChart from "./components/BarChart";
import PieChart from "./components/PieChart";

// Create Context
export const ChartContext = createContext();

// Initial state
const initialState = {
  selectedDisease: "",
  activeTab: "AllData",
  chartData: {},
};

// Reducer function
const chartReducer = (state, action) => {
  switch (action.type) {
    case "SET_DISEASE":
      return { ...state, selectedDisease: action.payload };
    case "SET_TAB":
      return { ...state, activeTab: action.payload };
    case "SET_CHART_DATA":
      return { ...state, chartData: action.payload };
    default:
      return state;
  }
};

// Function to calculate age from birth date
const calculateAge = (birthDate) => {
  const birthDateObj = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birthDateObj.getFullYear();
  const monthDifference = today.getMonth() - birthDateObj.getMonth();

  // Adjust age if the birth date has not occurred yet this year
  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDateObj.getDate())
  ) {
    age--;
  }

  return age;
};

const App = () => {
  const [state, dispatch] = useReducer(chartReducer, initialState);
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(false); // Add loading state

  // Load diseases from a public JSON file or API
  const loadDiseases = async () => {
    try {
      const response = await axios.get("/data/ConditionData.json");
      const conditions = response.data.entry;

      const uniqueConditions = Array.from(
        new Set(
          conditions
            .map((entry) => entry?.resource?.code?.coding?.[0]?.display || null)
            .filter(Boolean)
        )
      );

      setDiseases(uniqueConditions);
    } catch (error) {
      console.error("Error loading conditions:", error);
      toast.error("Failed to load conditions.");
    }
  };

  const getChartData = async () => {
    setLoading(true); // Set loading to true
    const searchCondition = state.selectedDisease;
    const patientFilePath = "/data/PatientData.json";
    const conditionFilePath = "/data/ConditionData.json";

    try {
      const patientResponse = await axios.get(patientFilePath);
      const conditionResponse = await axios.get(conditionFilePath);

      const patientData = patientResponse.data.entry || [];
      const conditionData = conditionResponse.data.entry || [];

      // Initialize counters for analysis
      const ageRanges = {
        "0-15": 0,
        "16-31": 0,
        "32-47": 0,
        "48-63": 0,
        "64+": 0,
      };
      const genderCount = { Male: 0, Female: 0 };
      const clinicalStatusCount = { Active: 0, Resolved: 0 };
      const conditionTotalCount = {};
      const conditionAgeDistribution = {
        "0-15": 0,
        "16-31": 0,
        "32-47": 0,
        "48-63": 0,
        "64+": 0,
      };
      const conditionGenderDistribution = { Male: 0, Female: 0 };
      const conditionClinicalStatus = { Active: 0, Resolved: 0 };
      const yearDistribution = {}; // For year analysis

      // Filter conditions based on search term if provided
      const filteredConditions = searchCondition
        ? conditionData.filter((entry) => {
            const conditionDisplay =
              entry?.resource?.code?.coding?.[0]?.display || "";
            return conditionDisplay
              .toLowerCase()
              .includes(searchCondition.toLowerCase());
          })
        : conditionData;

      if (filteredConditions.length === 0) {
        toast.warn("No conditions found matching the search term");
        setLoading(false); // Set loading to false
        return;
      }

      // Process each condition entry
      filteredConditions.forEach((entry) => {
        const condition = entry.resource;
        const clinicalStatus =
          condition.clinicalStatus?.coding?.[0]?.display || "Healthy";
        const patientId = condition.subject?.reference.split("/")[1];

        // Update clinical status counts
        clinicalStatusCount[clinicalStatus] =
          (clinicalStatusCount[clinicalStatus] || 0) + 1;
        conditionClinicalStatus[clinicalStatus]++;

        // Find corresponding patient data
        const patient = patientData.find((p) => p.resource.id === patientId);
        if (patient) {
          const birthDate = patient.resource.birthDate || null;
          const gender = patient.resource.gender || null;
          const year = patient.resource.birthDate
            ? new Date(patient.resource.birthDate).getFullYear()
            : null;

          // Calculate and categorize age range
          if (birthDate) {
            const age = calculateAge(birthDate);
            const ageRange =
              age <= 15
                ? "0-15"
                : age <= 31
                ? "16-31"
                : age <= 47
                ? "32-47"
                : age <= 63
                ? "48-63"
                : "64+";
            ageRanges[ageRange]++;
            conditionAgeDistribution[ageRange]++;
          }

          // Categorize gender
          if (gender) {
            genderCount[gender.charAt(0).toUpperCase() + gender.slice(1)]++;
            conditionGenderDistribution[
              gender.charAt(0).toUpperCase() + gender.slice(1)
            ]++;
          }

          // Track year of birth
          if (year) {
            const rangeStart = Math.floor(year / 5) * 5; // Calculate the start of the range
            const rangeEnd = rangeStart + 4; // Calculate the end of the range
            const rangeLabel = `${rangeStart}-${rangeEnd}`; // Create range label
            yearDistribution[rangeLabel] =
              (yearDistribution[rangeLabel] || 0) + 1; // Update count for the range
          }
        }
      });

      // Prepare data for charts
      const ageChartData = Object.keys(ageRanges).map((label) => ({
        label,
        value: ageRanges[label],
      }));
      const genderChartData = Object.keys(genderCount).map((label) => ({
        label,
        value: genderCount[label],
      }));
      const clinicalStatusChartData = Object.keys(clinicalStatusCount).map(
        (label) => ({ label, value: clinicalStatusCount[label] })
      );

      // Convert yearDistribution to required format
      const yearChartData = Object.entries(yearDistribution)
        .map(([label, value]) => ({ label, value })) // Transform into desired format
        .sort((a, b) => {
          const [startA] = a.label.split("-").map(Number); // Get the start of range A
          const [startB] = b.label.split("-").map(Number); // Get the start of range B
          return startA - startB; // Sort by the start of the range
        });

      // Dispatch data to the state
      dispatch({
        type: "SET_CHART_DATA",
        payload: {
          age: ageChartData,
          gender: genderChartData,
          clinicalStatus: clinicalStatusChartData,
          year: yearChartData, // Include year data in payload
        },
      });

      toast.success("Chart data loaded successfully."); // Notify on successful load
    } catch (error) {
      console.error("Error loading chart data:", error);
      toast.error("Failed to load chart data.");
    } finally {
      setLoading(false); // Always set loading to false after the try/catch
    }
  };

  const renderChart = () => {
    if (!state.selectedDisease) {
      return (
        <div className="flex justify-center items-center h-full">
          <p className="text-lg text-gray-700">
            Please select a disease to get the chart analysis.
          </p>
        </div>
      );
    }

    if (!state.chartData || Object.keys(state.chartData).length === 0) {
      return (
        <div className="flex justify-center items-center h-full">
          <p className="text-lg text-gray-700">
            No data available for this disease.
          </p>
        </div>
      );
    }

    return (
      <div className="flex justify-center items-center h-[60vh] w-full max-w-[95rem]">
        {(() => {
          switch (state.activeTab) {
            case "AllData":
              return (
                <LineChart
                  data={state.chartData.year || []}
                  width={800}
                  height={400}
                />
              );
            case "Age":
              return (
                <BarChart
                  data={state.chartData.age || []}
                  width={800}
                  height={400}
                />
              );
            case "Gender":
              return (
                <PieChart
                  data={state.chartData.gender || []}
                  width={800}
                  height={400}
                />
              );
            case "ClinicalStatus":
              return (
                <PieChart
                  data={state.chartData.clinicalStatus || []}
                  width={800}
                  height={400}
                />
              );

            default:
              return null;
          }
        })()}
      </div>
    );
  };

  useEffect(() => {
    loadDiseases();
  }, []);

  useEffect(() => {
    if (state.selectedDisease) {
      getChartData();
    }
  }, [state.selectedDisease]);

  return (
    <ChartContext.Provider value={{ dispatch }}>
      <div className="min-h-screen flex flex-col items-center bg-gray-100 p-4">
        <ToastContainer />
        <h1 className="text-3xl font-bold mb-8 text-center">EraStats</h1>

        <div className="w-[50rem]">
          <p className="w-full">
            EraStats is an analytical tool designed to help users gain insights
            into the prevalence of various medical conditions over time. Users
            can select specific health conditions, such as depression or
            diabetes, and view statistics broken down by age, gender, and
            clinical status. This data-driven approach provides a comprehensive
            understanding of how different factors influence the incidence of
            diseases. EraStats is ideal for healthcare professionals,
            researchers, and individuals interested in historical and
            demographic trends in healthcare, as it allows them to identify
            patterns and potentially make data-informed decisions or predictions
            for public health initiatives.
          </p>
        </div>
        <div className="mb-4">
          <select
            onChange={(e) =>
              dispatch({ type: "SET_DISEASE", payload: e.target.value })
            }
            className="p-2 border rounded"
          >
            <option value="">Select a Disease</option>
            {diseases.map((disease) => (
              <option key={disease} value={disease}>
                {disease}
              </option>
            ))}
          </select>
        </div>

        {/* Tab Navigation */}
        <div className="mb-4">
          <button
            onClick={() => dispatch({ type: "SET_TAB", payload: "AllData" })}
            className={`p-2 border rounded mx-1 ${
              state.activeTab === "AllData" ? "bg-blue-500 text-white" : ""
            }`}
          >
            All Data
          </button>
          <button
            onClick={() => dispatch({ type: "SET_TAB", payload: "Age" })}
            className={`p-2 border rounded mx-1 ${
              state.activeTab === "Age" ? "bg-blue-500 text-white" : ""
            }`}
          >
            Age
          </button>
          <button
            onClick={() => dispatch({ type: "SET_TAB", payload: "Gender" })}
            className={`p-2 border rounded mx-1 ${
              state.activeTab === "Gender" ? "bg-blue-500 text-white" : ""
            }`}
          >
            Gender
          </button>
          <button
            onClick={() =>
              dispatch({ type: "SET_TAB", payload: "ClinicalStatus" })
            }
            className={`p-2 border rounded mx-1 ${
              state.activeTab === "ClinicalStatus"
                ? "bg-blue-500 text-white"
                : ""
            }`}
          >
            Clinical Status
          </button>
        </div>

        {state.selectedDisease && (
          <h2 className="font-bold text-center text-3xl my-10">
            {" "}
            {state.selectedDisease} analysis
          </h2>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-full">
            <FaSpinner className="animate-spin h-6 w-6 text-blue-600" />
          </div>
        ) : (
          renderChart()
        )}
      </div>
    </ChartContext.Provider>
  );
};

export default App;
