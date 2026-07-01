# DFIT — Open-Source Digital Forensics Toolkit

A web-based toolkit for analysing digital evidence, built for final-year academic
submission and structured to be extended by future contributors on GitHub.

DFIT lets an investigator open a case, upload evidence files (images, documents,
archives, disk artefacts, etc.), and automatically:

- Computes **MD5, SHA-1, and SHA-256 hashes** for integrity verification
- Detects the file's **true type from its magic bytes** and flags a mismatch
  against its declared extension (a common anti-forensics/disguise trick)
- Extracts **filesystem metadata** (created/modified/accessed/changed timestamps)
- Extracts **EXIF metadata** from image evidence (camera info, GPS, timestamps)
- Records every action to an immutable **chain of custody log**, so you can
  show exactly who touched a piece of evidence, when, and what they did
- Lets you **re-verify integrity** at any point by recomputing the hash and
  comparing it to the original — instantly surfacing tampering

## Tech stack

| Layer      | Technology                              |
|------------|------------------------------------------|
| Frontend   | React + Vite, React Router, Axios        |
| Backend    | Node.js + Express                        |
| Database   | PostgreSQL                               |
| Auth       | JWT + bcrypt                             |
| File handling | Multer, `file-type` (signature detection), `exifr` (EXIF parsing) |

## Project structure

```
dfit/
├── backend/
│   ├── src/
│   │   ├── config/db.js          # PostgreSQL connection pool
│   │   ├── controllers/          # request handlers
│   │   ├── routes/                # Express routers
│   │   ├── services/
│   │   │   ├── hashService.js     # MD5 / SHA-1 / SHA-256 streaming hashing
│   │   │   ├── metadataService.js # signature detection + metadata extraction
│   │   │   └── custodyService.js  # chain of custody logging
│   │   ├── middleware/            # auth (JWT) + upload (multer)
│   │   └── server.js
│   └── uploads/                   # evidence storage (gitignored)
├── database/
│   └── schema.sql                 # full PostgreSQL schema
├── frontend/
│   └── src/
│       ├── pages/                 # Login, Register, Dashboard, CaseDetail, EvidenceDetail
│       ├── components/            # Navbar
│       └── api/client.js          # Axios client
└── LICENSE (MIT)
```

## Local setup

### 1. Database

Create a PostgreSQL database and run the schema:

```bash
createdb dfit
psql -d dfit -f database/schema.sql
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env with your DB credentials and a JWT_SECRET
npm run dev
```

The API runs on `http://localhost:5000` by default. Health check: `GET /api/health`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs on `http://localhost:5173`. If your backend isn't on `localhost:5000`,
set `VITE_API_URL` in a `frontend/.env` file.

## Deployment

This project deploys the same way as a typical PERN app:

- **Backend** → Render or Railway (set the `.env` variables as environment
  variables in the dashboard; use the `DATABASE_URL` connection string form
  if your host provides one)
- **Database** → the managed PostgreSQL instance from Render/Railway/Supabase
- **Frontend** → Netlify or Vercel (set `VITE_API_URL` to your deployed
  backend URL as a build environment variable)

Remember to set `FRONTEND_URL` in the backend's environment to your deployed
frontend origin so CORS allows it.

## How the forensic logic works

**Hashing** (`hashService.js`) streams the file through MD5, SHA-1, and
SHA-256 simultaneously rather than loading it fully into memory, so it scales
to large evidence files (disk images, archives).

**Signature detection** (`metadataService.js`) reads the file's magic bytes
via the `file-type` library and compares the detected MIME type against what
the file's extension claims. A `.jpg` that's actually a renamed `.exe` gets
flagged immediately — this is one of the most common things a first
forensic pass checks for.

**Chain of custody** (`custodyService.js`) writes an append-only log entry
for every meaningful action: upload, hash, view, flag, and re-verify. This
mirrors real forensic practice, where showing an unbroken, timestamped
custody trail is what makes evidence admissible.

## Extending this project

Natural next modules if you want to go further for the final defense:

- **File carving** — recover deleted files from raw disk images by scanning
  for file signatures in unallocated space
- **Timeline reconstruction** — merge MAC times across all evidence in a
  case into a single visual timeline
- **Log file parsing** — ingest browser history / system logs and flag
  suspicious patterns
- **PDF report export** — generate a signed forensic report per case for
  submission as a project deliverable

## License

MIT — see [LICENSE](./LICENSE). Feel free to swap for GPL-3.0 or Apache-2.0
if your department requires a specific license; the codebase has no
license-specific dependencies.
