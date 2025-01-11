const generateAlerts = (allergies = [], medications = []) => {
    
    const alerts = [];
  
    allergies.forEach((allergy) => {
      const substance =
        allergy.code?.coding?.[0]?.display || allergy.code?.text || "Unknown substance";
  
      const clinicalStatus = allergy.clinicalStatus?.coding?.[0]?.code || "unknown";
  
      if (clinicalStatus === "active") {
        alerts.push(`Alert: Active allergy detected - ${substance}`);
      }
  
      medications.forEach((medication) => {
        const medicationName =
          medication.resource?.contained?.[0]?.code?.coding?.[0]?.display ||
          medication.resource?.medicationCodeableConcept?.text ||
          "Unknown medication";
  
        if (substance.toLowerCase() === medicationName.toLowerCase()) {
          alerts.push(
            `Warning: Potential interaction between medication (${medicationName}) and allergy (${substance})`
          );
        }
      });
    });
  
    return alerts;
  };
  
  
  module.exports = { generateAlerts };
  