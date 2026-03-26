# MiniMe Privacy & Compliance Documentation

## Overview

This directory contains all privacy and compliance documentation for MiniMe.

| Document | Purpose | Standard |
|---|---|---|
| [GDPR_compliance.md](GDPR_compliance.md) | Technical controls, breach procedure | EU GDPR |
| [CCPA_compliance.md](CCPA_compliance.md) | California privacy rights | CCPA / CPRA |
| [data_retention.md](data_retention.md) | Retention schedule per data type | GDPR Art. 5(1)(e) |
| [third_party_processors.md](third_party_processors.md) | Sub-processor list and DPAs | GDPR Art. 28 |
| [security_controls.md](security_controls.md) | Encryption, access control, incident response | SOC 2 Type II prep |
| [cookie_policy.md](cookie_policy.md) | Cookie categories and consent | GDPR / ePrivacy |

## API Endpoints (GDPR Rights)

| Right | Endpoint | Notes |
|---|---|---|
| Art. 15 — Access | `GET /api/v1/account/export` | Full JSON export |
| Art. 17 — Erasure | `DELETE /api/v1/account` | Hard delete all data |
| Art. 20 — Portability | `GET /api/v1/account/export` | Machine-readable JSON |

## Contact

Privacy inquiries: **privacy@tryminime.com**
Data Protection Officer: **dpo@tryminime.com** (if applicable)
