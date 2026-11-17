# OvaCare setup
1. Google Cloud: enable Sheets API, create a Service Account, download JSON key.
2. Create a Google Sheet, Share it (Editor) with GOOGLE_CLIENT_EMAIL. Copy the ID from its URL.
3. Tabs are auto-created on first request with these headers (row 1):
Settings: key | value
Patients: id,name,phone,age,chronicDiseases,familyHistory,drugAllergies,regularMedications,isFirstPregnancy,gravida,para,abortus,previousDeliveryType,fetalAnomaliesHistory,lmpDate,privateNotes,createdAt,updatedAt
Visits: visitId,patientId,visitDate,weight,bloodPressureSys,bloodPressureDia,gestationalAgeAtVisit,diagnosisNotes,prescribedMedications,nextVisitRequests,privateVisitNote
4. cp .env.example .env.local, fill it, `npm i && npm run dev`. On Vercel add the 3 env vars.
Structure: lib/{googleSheets,medical}.ts context/AppContext.tsx components/{OvaCareLogo,Footer,PrescriptionModal}.tsx
app/{layout,page,globals.css} app/patients/[id]/page.tsx app/settings/page.tsx app/api/{[entity],auth}/route.ts
5. Set SESSION_SECRET (openssl rand -base64 48) locally and on Vercel. Without it every /api call except login fails.
Security: sessions are HMAC-signed HTTP-only cookies (7 days). middleware.ts returns 401 for every /api route except /api/auth and /api/branding.
Logo: uploaded images are resized/compressed in the browser to fit one Sheets cell (<45k chars).
