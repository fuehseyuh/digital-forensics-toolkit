-- Open-Source Digital Forensics Toolkit
-- PostgreSQL Schema

DROP TABLE IF EXISTS custody_log CASCADE;
DROP TABLE IF EXISTS evidence_hashes CASCADE;
DROP TABLE IF EXISTS evidence_metadata CASCADE;
DROP TABLE IF EXISTS evidence CASCADE;
DROP TABLE IF EXISTS cases CASCADE;
DROP TABLE IF EXISTS investigators CASCADE;

-- Investigators / users who can act on a case
CREATE TABLE investigators (
    investigator_id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'analyst', -- analyst | lead | admin
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- A forensic case / investigation
CREATE TABLE cases (
    case_id SERIAL PRIMARY KEY,
    case_reference VARCHAR(50) UNIQUE NOT NULL, -- e.g. DFIT-2026-0001
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'open', -- open | closed | archived
    created_by INTEGER REFERENCES investigators(investigator_id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- A piece of digital evidence (a file/image uploaded to a case)
CREATE TABLE evidence (
    evidence_id SERIAL PRIMARY KEY,
    case_id INTEGER NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL, -- name on disk (uuid based)
    file_size_bytes BIGINT NOT NULL,
    mime_type_declared VARCHAR(150),        -- what the extension claims
    mime_type_detected VARCHAR(150),        -- what the magic bytes say
    signature_mismatch BOOLEAN DEFAULT FALSE,
    uploaded_by INTEGER REFERENCES investigators(investigator_id),
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    notes TEXT
);

-- Cryptographic hashes for integrity verification
CREATE TABLE evidence_hashes (
    hash_id SERIAL PRIMARY KEY,
    evidence_id INTEGER NOT NULL REFERENCES evidence(evidence_id) ON DELETE CASCADE,
    md5 VARCHAR(32) NOT NULL,
    sha1 VARCHAR(40) NOT NULL,
    sha256 VARCHAR(64) NOT NULL,
    computed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Extracted metadata (EXIF, file system timestamps, etc.) stored flexibly as JSON
CREATE TABLE evidence_metadata (
    metadata_id SERIAL PRIMARY KEY,
    evidence_id INTEGER NOT NULL REFERENCES evidence(evidence_id) ON DELETE CASCADE,
    metadata_type VARCHAR(50) NOT NULL, -- 'exif' | 'filesystem' | 'document'
    metadata_json JSONB NOT NULL,
    extracted_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Chain of custody: every action taken on a piece of evidence
CREATE TABLE custody_log (
    log_id SERIAL PRIMARY KEY,
    evidence_id INTEGER NOT NULL REFERENCES evidence(evidence_id) ON DELETE CASCADE,
    investigator_id INTEGER REFERENCES investigators(investigator_id),
    action VARCHAR(50) NOT NULL, -- 'uploaded' | 'hashed' | 'analyzed' | 'downloaded' | 'viewed'
    action_details TEXT,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_evidence_case ON evidence(case_id);
CREATE INDEX idx_hashes_evidence ON evidence_hashes(evidence_id);
CREATE INDEX idx_metadata_evidence ON evidence_metadata(evidence_id);
CREATE INDEX idx_custody_evidence ON custody_log(evidence_id);
CREATE INDEX idx_custody_timestamp ON custody_log(timestamp);
