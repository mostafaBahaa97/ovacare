export const HEAD = {
  Settings: ['key', 'value'],
  Patients: ['id','name','phone','age','chronicDiseases','familyHistory','drugAllergies','regularMedications','isFirstPregnancy','gravida','para','abortus','previousDeliveryType','fetalAnomaliesHistory','lmpDate','privateNotes','createdAt','updatedAt'],
  Visits: ['visitId','patientId','visitDate','weight','bloodPressureSys','bloodPressureDia','gestationalAgeAtVisit','diagnosisNotes','prescribedMedications','nextVisitRequests','privateVisitNote','fetalData'],
} as const;
