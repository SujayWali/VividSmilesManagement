# Dental Management MVP (Next.js + Firebase)

## Quick start
```bash
npm i
cp .env.example .env.local   # fill Firebase values
npm run dev
# open http://localhost:3000
```
1. Visit `/seed-admin` once to assign your account the **admin** role. Delete that file afterwards.
2. Login at `/login`.
3. Add patients, visits. Managers can add/view; Admin can edit/delete and manage users.

## Firestore structure
- users/{uid} -> { email, role }
- patients/{patientId}
- patients/{patientId}/visits/{visitId}

## WhatsApp (optional)
Add Twilio creds to `.env.local`. Use the "Send WhatsApp" button from patient details.
