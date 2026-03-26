# GDPR Compliance — MiniMe

## Data Controller
**MiniMe Technologies**
Email: privacy@tryminime.com
Website: https://tryminime.com

---

## Data Categories Collected

| Category | Examples | Legal Basis | Retention |
|---|---|---|---|
| Account data | Email, name, password hash | Contract | Until account deletion |
| Activity logs | App names, window titles, timestamps | Legitimate interest | 12 months (Free), Unlimited (Pro) |
| Content items | Extracted webpage text, keyphrases | Legitimate interest | Until manual delete |
| Usage metrics | Feature usage counts | Legitimate interest | 12 months |
| Billing data | Subscription tier, Stripe customer ID | Contract | 7 years (legal obligation) |
| Preferences | Theme, notification settings | Legitimate interest | Until account deletion |

> **Privacy by Design**: Raw activity data (e.g., window titles, URLs) is processed locally on the user's device. Only aggregated, anonymized insights are optionally synced to MiniMe servers.

---

## Data Subject Rights

All rights are exercisable by authenticated users via the API or dashboard:

| Right | Article | Implementation |
|---|---|---|
| Right to Access | Art. 15 | `GET /api/v1/account/export` — returns full data as JSON |
| Right to Erasure | Art. 17 | `DELETE /api/v1/account` — hard-deletes all records |
| Right to Portability | Art. 20 | `GET /api/v1/account/export` — machine-readable JSON |
| Right to Rectification | Art. 16 | `PATCH /api/v1/users/me` — update profile data |
| Right to Object | Art. 21 | Contact privacy@tryminime.com |
| Right to Restrict | Art. 18 | Contact privacy@tryminime.com |

**Response time**: 30 days maximum (GDPR Art. 12)

---

## Data Breach Procedure

1. **Detect** — monitoring alerts on anomalous DB access
2. **Assess** — classify: personal data involved? High risk?
3. **Notify supervisory authority** — within 72 hours of detection (Art. 33)
4. **Notify affected users** — without undue delay if high risk (Art. 34)
5. **Document** — log all breaches in internal breach register
6. **Remediate** — patch, rotate credentials, apply lessons-learned

Contact for reporting: security@tryminime.com

---

## Sub-Processors (Art. 28)

| Processor | Purpose | DPA |
|---|---|---|
| Stripe | Payment processing | [Stripe DPA](https://stripe.com/legal/dpa) |
| Vercel | Website hosting | [Vercel DPA](https://vercel.com/legal/dpa) |
| AWS | Backend infrastructure | [AWS DPA](https://aws.amazon.com/agreement/) |
| Google (OAuth only) | Authentication | [Google DPA](https://cloud.google.com/terms/data-processing-addendum) |

---

## International Transfers

Data is primarily processed within the **EU/EEA**. Any transfers outside the EEA use:
- Standard Contractual Clauses (SCCs) — per EU Commission 2021 decision
- Adequacy decisions where applicable (e.g., UK GDPR)

---

## Data Retention Schedule

| Data Type | Free Tier | Pro Tier | Enterprise | Delete on Request |
|---|---|---|---|---|
| Activity logs | 12 months | Unlimited | Unlimited | ✅ Immediate |
| Content items | 25 item limit | 500 items | Unlimited | ✅ Immediate |
| Account data | Until deletion | Until deletion | Until deletion | ✅ Immediate |
| Billing records | 7 years | 7 years | 7 years | Legal hold — cannot delete early |
| Analytics aggregates | 24 months | 24 months | 24 months | ✅ 30 days |

---

## Technical Controls

- **Encryption at rest**: AES-256 (database, local SQLite)
- **Encryption in transit**: TLS 1.3 minimum
- **Cloud sync encryption**: AES-256-GCM end-to-end (key stored locally)
- **Password hashing**: Argon2id
- **Access control**: JWT Bearer tokens with 24h expiry + refresh tokens
- **Audit logging**: All data access/deletion events logged with structlog

---

## Cookie Policy Summary

| Cookie | Type | Purpose | Consent Required |
|---|---|---|---|
| `access_token` | Essential | Authentication | No |
| `refresh_token` | Essential | Session persistence | No |
| `theme` | Functional | UI preference | No |
| `_vercel_analytics` | Analytics | Performance monitoring | Yes |

Consent is collected via the cookie banner on first visit (stored in `localStorage`).
