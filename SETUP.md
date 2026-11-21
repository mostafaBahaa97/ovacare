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

## v3: Offline-first PWA
- Data lives in IndexedDB (`localCache` snapshot + `syncQueue`). The service worker (`public/sw.js`) caches ONLY the app shell, never `/api/*`. Logout wipes IndexedDB (asks first if edits are unsynced).
- `POST /api/sync` takes a batch of queued ops and upserts by UUID (idempotent); `GET /api/sync` returns the snapshot. An expired cookie (401) pauses the queue and opens the re-login modal; nothing is deleted.
- `Visits.fetalData` is added to an existing sheet automatically on first request.
- Public API paths in middleware: /api/auth, /api/branding, /api/manifest.webmanifest, /api/icon. No new env vars.
- The service worker registers only in production: test with `npm run build && npm start`, then DevTools > Network > Offline.
- Patient file route changed to `/patients?id=<uuid|new>` so it can be served offline.

## v4: Excel export + A4 report
- Settings: one "تصدير بيانات العيادة (Excel)" button (exceljs, lazy-loaded browser bundle, fully offline). Private notes only if the checkbox is ticked.
- Patient profile (Doctor mode): "تقرير طبي (PDF)" opens an A4 report; use the browser's Print > Save as PDF (works offline, Arabic shaping handled by the browser). Private notes are excluded unless toggled.
