const fs = require("fs");
const path = require("path");

// Controller function to get unique conditions
const getUniqueConditions = (req, res) => {
  try {
    // Read the ConditionData.json file from the 'data' folder
    const filePath = path.join(__dirname, "..", "data", "ConditionData.json");
    const data = fs.readFileSync(filePath, "utf8");

    // Parse the JSON data
    const conditions = JSON.parse(data).entry;

    // Extract unique disease names
    const uniqueConditions = Array.from(
      new Set(
        conditions
          .map((entry) => entry?.resource?.code?.coding?.[0]?.display || null)
          .filter(Boolean)
      )
    );

    // Send the unique diseases as a response
    res.json(uniqueConditions);
  } catch (error) {
    console.error("Error loading conditions:", error);
    res.status(500).json({ error: "Failed to load conditions." });
  }
};

const calculateAge = (birthDate) => {
  const today = new Date();
  const birthDateObj = new Date(birthDate);
  let age = today.getFullYear() - birthDateObj.getFullYear();
  const month = today.getMonth() - birthDateObj.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birthDateObj.getDate())) {
    age--;
  }
  return age;
};

const getChartData = (req, res) => {
  const searchCondition = req.body.searchCondition || ""; // Get search condition from body instead of query
  const patientFilePath = path.join(
    __dirname,
    "..",
    "data",
    "PatientData.json"
  );
  const conditionFilePath = path.join(
    __dirname,
    "..",
    "data",
    "ConditionData.json"
  );

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

  try {
    // Read PatientData and ConditionData from JSON files
    const patientData =
      JSON.parse(fs.readFileSync(patientFilePath, "utf-8")).entry || [];
    const conditionData =
      JSON.parse(fs.readFileSync(conditionFilePath, "utf-8")).entry || [];

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
      return res
        .status(404)
        .json({ message: "No conditions found matching the search term" });
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
      (label) => ({
        label,
        value: clinicalStatusCount[label],
      })
    );

    // Convert yearDistribution to required format
    const yearChartData = Object.entries(yearDistribution)
      .map(([label, value]) => ({ label, value })) // Transform into desired format
      .sort((a, b) => {
        const [startA] = a.label.split("-").map(Number); // Get the start of range A
        const [startB] = b.label.split("-").map(Number); // Get the start of range B
        return startA - startB; // Sort by the start of the range
      });

    // Send the chart data as a response
    return res.status(200).json({
      age: ageChartData,
      gender: genderChartData,
      clinicalStatus: clinicalStatusChartData,
      year: yearChartData, // Include year data in the response
    });
  } catch (error) {
    console.error("Error loading chart data:", error);
    return res.status(500).json({ message: "Failed to load chart data" });
  }
};

// Helper function to get clinical status or condition
const getCondition = (condition) => {
  return condition?.code?.coding?.[0]?.display || "Unknown";
};

// Controller function for fetching insights
const getAnalysisInsights = (req, res) => {
    const { category, condition, value } = req.body; // Extract input parameters
  
    // File paths
    const patientFilePath = path.join(
      __dirname,
      "..",
      "data",
      "PatientData.json"
    );
    const conditionFilePath = path.join(
      __dirname,
      "..",
      "data",
      "ConditionData.json"
    );
  
    try {
      // Read data files
      const patientData =
        JSON.parse(fs.readFileSync(patientFilePath, "utf-8")).entry || [];
      const conditionData =
        JSON.parse(fs.readFileSync(conditionFilePath, "utf-8")).entry || [];
  
      // Initialize insights object
      const insights = {
        totalCount: 0,
        genderCount: { Male: 0, Female: 0 },
        clinicalStatusCount: { Active: 0, Resolved: 0, Unknown: 0 },
        ageDistribution: { "0-15": 0, "16-31": 0, "32-47": 0, "48-63": 0, "64+": 0 },
        patients: [],
        label: category,
        valueInsight: value || condition,
      };
  
      // Helper to categorize age
      const categorizeAge = (birthDate) => {
        const age = calculateAge(birthDate);
        return age <= 15
          ? "0-15"
          : age <= 31
          ? "16-31"
          : age <= 47
          ? "32-47"
          : age <= 63
          ? "48-63"
          : "64+";
      };
  
      // Process based on category
      if (category === "gender") {
        // Filter patients by gender and condition
        patientData.forEach((patient) => {
          if (patient.resource.gender === value) {
            const patientConditions = conditionData.filter(
              (entry) =>
                entry.resource.subject?.reference.split("/")[1] ===
                patient.resource.id
            );
  
            // Check if condition matches
            if (
              patientConditions.some(
                (entry) => getCondition(entry.resource) === condition
              )
            ) {
              insights.totalCount += 1;
              insights.genderCount[value] += 1;
  
              const ageRange = categorizeAge(patient.resource.birthDate);
              insights.ageDistribution[ageRange]++;
  
              insights.patients.push({
                id: patient.resource.id,
                gender: patient.resource.gender,
                birthDate: patient.resource.birthDate,
                conditions: patientConditions.map((entry) =>
                  getCondition(entry.resource)
                ),
              });
            }
          }
        });
      } else if (category === "clinicalStatus") {
        // Filter patients by clinical status and condition
        conditionData.forEach((entry) => {
          const clinicalStatus = getCondition(entry.resource);
  
          if (clinicalStatus === value) {
            const patient = patientData.find(
              (p) =>
                p.resource.id === entry.resource.subject.reference.split("/")[1]
            );
  
            if (patient) {
              insights.totalCount += 1;
              insights.clinicalStatusCount[value] += 1;
  
              const ageRange = categorizeAge(patient.resource.birthDate);
              insights.ageDistribution[ageRange]++;
  
              insights.patients.push({
                id: patient.resource.id,
                gender: patient.resource.gender,
                birthDate: patient.resource.birthDate,
                clinicalStatus: clinicalStatus,
              });
            }
          }
        });
      } else if (category === "year") {
        // Filter patients by birth year range and condition
        const [startYear, endYear] = value.split("-").map(Number);
  
        patientData.forEach((patient) => {
          const birthYear = new Date(patient.resource.birthDate).getFullYear();
  
          if (birthYear >= startYear && birthYear <= endYear) {
            const patientConditions = conditionData.filter(
              (entry) =>
                entry.resource.subject?.reference.split("/")[1] ===
                patient.resource.id
            );
  
            if (
              patientConditions.some(
                (entry) => getCondition(entry.resource) === condition
              )
            ) {
              insights.totalCount += 1;
  
              const ageRange = categorizeAge(patient.resource.birthDate);
              insights.ageDistribution[ageRange]++;
  
              insights.patients.push({
                id: patient.resource.id,
                gender: patient.resource.gender,
                birthDate: patient.resource.birthDate,
                conditions: patientConditions.map((entry) =>
                  getCondition(entry.resource)
                ),
              });
            }
          }
        });
      } else {
        return res.status(400).json({ message: "Invalid category provided" });
      }
  
      // Return the insights
      return res.json(insights);
    } catch (error) {
      console.error("Error fetching analysis insights:", error.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
  

module.exports = { getUniqueConditions, getChartData, getAnalysisInsights };
