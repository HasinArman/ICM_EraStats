// controllers/allergyController.js
const {
  getAllergies,
  getMedications,
  getPatientsWithAllergies,
} = require("../services/fhirService");
const { generateAlerts } = require("../utils/alertService");

const fs = require('fs');
const path = require('path');


const saveToFile = (data, filename) => {
    const filePath = path.join(__dirname, `../data/${filename}`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  };

// Controller to get allergy and medication info for a patient by ID
// const getPatientInfo = async (req, res) => {
//     const { patientId } = req.params;
  
//     try {
//       const allergies = await getAllergies(patientId);
//       const medicationsResponse = await getMedications(patientId);

//       saveToFile(medicationsResponse, `medicationsResponsec_${patientId}_info.json`);
//       saveToFile(allergies, `allergiesc_${patientId}_info.json`);

//     console.log(allergies)
  
//       if (!allergies || allergies.length === 0) {
//         return res.status(404).json({ message: "No allergies found for this patient." });
//       }
  
//       const medications = medicationsResponse.entry || [];
//       const alerts = generateAlerts(allergies, medications);
  
//       const clinicalStatusCount = allergies.reduce((acc, allergy) => {
//         const status = allergy.clinicalStatus?.coding?.[0]?.code || "unknown";
//         acc[status] = (acc[status] || 0) + 1;
//         return acc;
//       }, {});
  
//       const verificationStatusCount = allergies.reduce((acc, allergy) => {
//         const status = allergy.verificationStatus?.coding?.[0]?.code || "unknown";
//         acc[status] = (acc[status] || 0) + 1;
//         return acc;
//       }, {});



//       const extractedAllergies = allergies.map(allergy => ({
//         id: allergy.id,
//         code: allergy.code.coding.map(coding => coding.display)
//     }));
    
//     // console.log(extractedAllergies)

//     const extractedMedications = medications.map(medication => ({
//         id: medication.resource.id,
//         code: medication.resource.contained[0].code.coding[0].display,
//         status: medication.resource.status,
//         subject: medication.resource.subject.display,
//         authoredOn: medication.resource.authoredOn,
//         dosageInstruction: medication.resource.dosageInstruction.map(inst => ({
//           text: inst.text,
//           additionalInstruction: inst.additionalInstruction.map(instr => instr.text),
//           timing: inst.timing.repeat,
//           asNeededCodeableConcept: inst.asNeededCodeableConcept.coding[0].display,
//           route: inst.route.coding[0].display,
//           doseAndRate: inst.doseAndRate.map(rate => ({
//             doseRange: {
//               low: rate.doseRange.low,
//               high: rate.doseRange.high
//             },
//             type: rate.type.coding[0].display
//           }))
//         })),
//         intent: medication.resource.intent
//       }));
      
//     //   console.log(extractedMedications);
  
//       res.json({
//         patientId,
//         extractedAllergies,
//         extractedMedications,
   
//         alerts,
//         clinicalStatus: clinicalStatusCount,
//         verificationStatus: verificationStatusCount,
//       });
//     } catch (error) {
//       res.status(500).json({
//         message: "Error fetching patient information",
//         error: error.message,
//       });
//     }
//   };


const getPatientInfo = async (req, res) => {
    const { patientId } = req.params;
  
    try {
      const allergies = await getAllergies(patientId);
      const medicationsResponse = await getMedications(patientId);
  
      // Save raw data for debugging
    //   saveToFile(medicationsResponse, `medicationsResponse_${patientId}_info.json`);
    //   saveToFile(allergies, `allergies_${patientId}_info.json`);
  
      if (!allergies || allergies.length === 0) {
        return res.status(404).json({ message: "No allergies found for this patient." });
      }
  
      const medications = Array.isArray(medicationsResponse.entry) ? medicationsResponse.entry : [];
  
      const extractedAllergies = allergies.map(allergy => ({
        id: allergy.id,
        code: allergy.code?.coding?.map(coding => coding.display) || [],
      }));

      console.log("smoke",medicationsResponse);
  
      const extractedMedications = medications.map(medication => ({
        id: medication.resource?.id,
        code: medication.resource?.contained?.[0]?.code?.coding?.[0]?.display || "N/A",
        status: medication.resource?.status,
        subject: medication.resource?.subject?.display || "N/A",
        authoredOn: medication.resource?.authoredOn || "N/A",
        dosageInstruction: medication.resource?.dosageInstruction?.map(inst => ({
          text: inst.text || "N/A",
          additionalInstruction: inst.additionalInstruction?.map(instr => instr.text) || [],
          timing: inst.timing?.repeat || {},
          asNeededCodeableConcept: inst.asNeededCodeableConcept?.coding?.[0]?.display || "N/A",
          route: inst.route?.coding?.[0]?.display || "N/A",
          doseAndRate: inst.doseAndRate?.map(rate => ({
            doseRange: {
              low: rate.doseRange?.low || {},
              high: rate.doseRange?.high || {}
            },
            type: rate.type?.coding?.[0]?.display || "N/A",
          })) || [],
        })) || [],
        intent: medication.resource?.intent || "N/A",
      }));
  
      const alerts = generateAlerts(allergies, medications);
  
      const clinicalStatusCount = allergies.reduce((acc, allergy) => {
        const status = allergy.clinicalStatus?.coding?.[0]?.code || "unknown";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
  
      const verificationStatusCount = allergies.reduce((acc, allergy) => {
        const status = allergy.verificationStatus?.coding?.[0]?.code || "unknown";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
  
      res.json({
        patientId,
        extractedAllergies,
        extractedMedications:medicationsResponse,
        alerts,
        clinicalStatus: clinicalStatusCount,
        verificationStatus: verificationStatusCount,
      });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching patient information",
        error: error.message || "Unable to fetch data",
      });
    }
  };
  
  
  
  

// Controller to get patient IDs with allergies
const getPatientsWithAllergiesInfo = async (req, res) => {
  try {
    const patientIds = await getPatientsWithAllergies();
    res.json({ patientIds });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching patients with allergies",
      error: error.message,
    });
  }
};

module.exports = { getPatientInfo, getPatientsWithAllergiesInfo };
