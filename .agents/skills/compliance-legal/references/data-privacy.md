# Data Privacy Law Reference

> Informational guidance only — not legal advice. Consult a qualified lawyer for jurisdiction-specific obligations.

---

## Table of Contents

1. [GDPR (EU/EEA)](#1-gdpr-euea)
2. [CCPA / CPRA (California)](#2-ccpa--cpra-california)
3. [Other Major Privacy Laws](#3-other-major-privacy-laws)
4. [Core Privacy Concepts (Cross-Jurisdictional)](#4-core-privacy-concepts-cross-jurisdictional)
5. [Consent Requirements](#5-consent-requirements)
6. [Data Breach Notification](#6-data-breach-notification)
7. [Cookies & Tracking](#7-cookies--tracking)
8. [Privacy Policy Requirements](#8-privacy-policy-requirements)
9. [Data Transfers Across Borders](#9-data-transfers-across-borders)
10. [Privacy by Design](#10-privacy-by-design)
11. [Quick-Reference Obligations Checklist](#11-quick-reference-obligations-checklist)

---

## 1. GDPR (EU/EEA)

**Full name**: General Data Protection Regulation (EU) 2016/679
**In force**: 25 May 2018
**Enforced by**: National Data Protection Authorities (DPAs); coordinated by the EDPB
**Penalties**: Up to €20 million or 4% of global annual turnover, whichever is higher

### Who It Applies To
- Any organisation that processes personal data of EU/EEA residents — regardless of where the organisation is located.
- Both **controllers** (decide why and how data is processed) and **processors** (process data on a controller's behalf).

### Key Definitions
- **Personal data**: Any information relating to an identified or identifiable natural person (name, email, IP address, cookie ID, location data, etc.).
- **Special category data**: Race/ethnicity, political opinions, religious beliefs, trade union membership, health data, biometric data, sexual orientation — subject to stricter rules.
- **Data subject**: The individual whose data is processed.
- **Lawful basis**: One of six legal grounds that must exist before processing personal data.

### Six Lawful Bases for Processing (Article 6)

| Basis | When It Applies |
|-------|----------------|
| **Consent** | Freely given, specific, informed, unambiguous opt-in |
| **Contract** | Processing necessary to perform a contract with the data subject |
| **Legal obligation** | Processing required by EU/member state law |
| **Vital interests** | Necessary to protect life |
| **Public task** | Necessary for a task in the public interest |
| **Legitimate interests** | Processor's interest is not overridden by the data subject's interests/rights |

Legitimate interests requires a three-part balancing test — it is not a default fallback.

### Data Subject Rights (Articles 12–22)

| Right | Description | Response Deadline |
|-------|-------------|-------------------|
| **Access** (Art. 15) | Obtain confirmation of processing and a copy of their data | 1 month (extendable to 3) |
| **Rectification** (Art. 16) | Correct inaccurate data | 1 month |
| **Erasure / Right to be Forgotten** (Art. 17) | Delete data where no longer needed | 1 month |
| **Restriction** (Art. 18) | Restrict processing in certain circumstances | 1 month |
| **Data Portability** (Art. 20) | Receive data in machine-readable format | 1 month |
| **Object** (Art. 21) | Object to processing based on legitimate interests | Immediately |
| **No automated decisions** (Art. 22) | Not be subject to solely automated decisions with significant effect | — |

### Key Obligations for Software Products
- Maintain a **Record of Processing Activities (ROPA)** — documents what data you process, why, and how.
- Conduct a **Data Protection Impact Assessment (DPIA)** before deploying high-risk processing (e.g. large-scale profiling, special category data, systematic monitoring).
- Appoint a **Data Protection Officer (DPO)** if you are a public authority, conduct large-scale systematic monitoring, or process special category data at scale.
- Use **Data Processing Agreements (DPAs)** with all processors (vendors, cloud providers, etc.).
- Apply **data minimisation** — collect only what you need for the stated purpose.
- Implement **storage limitation** — don't retain data longer than necessary; define and enforce retention periods.
- Implement **technical and organisational measures** — encryption, access controls, pseudonymisation.

---

## 2. CCPA / CPRA (California)

**Full names**: California Consumer Privacy Act (2018) / California Privacy Rights Act (2020 amendment)
**Enforced by**: California Privacy Protection Agency (CPPA)
**Penalties**: Up to $2,500 per unintentional violation; $7,500 per intentional violation; private right of action for data breaches

### Who It Applies To
For-profit businesses that do business in California AND meet one or more thresholds:
- Annual gross revenues > $25 million
- Buy/sell/receive/share personal information of 100,000+ consumers or households per year
- Derive 50%+ of annual revenues from selling consumers' personal information

### Key Consumer Rights

| Right | Description |
|-------|-------------|
| **Know** | Know what personal information is collected and how it's used/shared |
| **Delete** | Request deletion of personal information |
| **Opt-out of sale/sharing** | "Do Not Sell or Share My Personal Information" link required |
| **Correct** | Correct inaccurate personal information (CPRA addition) |
| **Limit use of sensitive PI** | Restrict use/disclosure of sensitive personal information (CPRA addition) |
| **Non-discrimination** | Cannot be penalised for exercising rights |

### Key Distinctions from GDPR
- CCPA covers households, not just individuals.
- "Sale" has a broad definition — includes data sharing for cross-context behavioural advertising.
- Opt-out model (not opt-in) for most processing — you can process by default, but must honour opt-out.
- Service Provider agreements (equivalent of DPAs) are required.

---

## 3. Other Major Privacy Laws

| Law | Jurisdiction | Key Notes |
|-----|-------------|-----------|
| **LGPD** (Lei Geral de Proteção de Dados) | Brazil | GDPR-like structure; applies to processing of Brazilian residents' data; in force 2020 |
| **PIPEDA** | Canada | Applies to private sector organisations; consent-based; GDPR adequacy decision received |
| **PDPA** | Thailand | In force 2022; GDPR-inspired; applies to processing of Thai residents' data |
| **POPIA** | South Africa | In force 2021; data subject rights, lawful processing grounds, data breach notification |
| **APPI** | Japan | Amended 2022; cross-border transfer restrictions; opt-in for sensitive data |
| **UK GDPR** | United Kingdom | Essentially GDPR post-Brexit; enforced by ICO; currently maintains EU adequacy |
| **NDPR** | Nigeria | Applies to organisations processing Nigerian personal data |
| **India DPDPA** | India | Digital Personal Data Protection Act 2023; consent-based; rules still being finalised |

---

## 4. Core Privacy Concepts (Cross-Jurisdictional)

### Personally Identifiable Information (PII) / Personal Data
Broadly: any data that could identify a specific individual, directly or indirectly.

Examples that are almost universally considered PII:
- Name, email, phone number, physical address
- IP addresses, device identifiers, cookie IDs (context-dependent)
- Biometric data, health records
- Government IDs (SSN, passport, national ID)
- Financial account details

### Pseudonymisation vs. Anonymisation
- **Pseudonymisation**: Replace identifying fields with artificial identifiers. Data can still be re-identified with additional information — still considered personal data under GDPR.
- **Anonymisation**: Irreversibly remove all identifying information such that re-identification is not reasonably possible. No longer personal data — most privacy laws do not apply.
- Anonymisation is harder than it looks. Re-identification attacks on "anonymous" datasets are well-documented.

### Data Minimisation
Collect only the personal data that is adequate, relevant, and limited to what is necessary for the specified purpose. Every field you collect is a liability.

### Purpose Limitation
Data collected for one purpose may not be used for a different, incompatible purpose without a new lawful basis or fresh consent.

### Storage Limitation
Define and enforce retention periods. Delete or anonymise data when it is no longer needed for the purpose it was collected.

---

## 5. Consent Requirements

### GDPR-Compliant Consent
Consent must be:
- **Freely given** — not bundled, not a condition of service unless the processing is necessary for the service.
- **Specific** — for a defined purpose.
- **Informed** — the data subject must know who is collecting, what, why, and how long.
- **Unambiguous** — by a clear affirmative action (pre-ticked boxes are not valid).
- **Withdrawable** — as easy to withdraw as to give. Withdrawal must not affect prior processing.

### Common Consent Mistakes
- ❌ Pre-ticked opt-in checkboxes.
- ❌ Consent buried in terms of service.
- ❌ "Continued use of the site constitutes consent."
- ❌ Consent for "marketing" without specifying which channels.
- ❌ Bundling consent for multiple purposes ("I agree to data processing and marketing").

### When Consent Is Not the Right Basis
For processing that is necessary to deliver the service the user signed up for (e.g. creating an account, processing an order), **contract** is the correct lawful basis — not consent. Using consent for necessary processing creates an obligation to offer the service without consent if withdrawn.

---

## 6. Data Breach Notification

### GDPR
- Notify the supervisory authority (DPA) within **72 hours** of becoming aware of a breach that poses a risk to individuals' rights and freedoms.
- Notify affected data subjects **without undue delay** if the breach is likely to result in high risk to their rights and freedoms.
- If notification to the DPA is not made within 72 hours, document the reasons for the delay.
- Maintain internal records of all breaches, even those not requiring notification.

### CCPA
- No specific breach notification timeline (covered by California's separate breach notification law — AB 1358).
- California breach notification law: notify affected consumers in the most expedient time possible and without unreasonable delay.

### What to Document After a Breach
- Date and time of discovery.
- Nature of the breach (what happened).
- Categories and approximate number of individuals affected.
- Categories and approximate number of records affected.
- Likely consequences.
- Measures taken or proposed to address the breach and mitigate its effects.

---

## 7. Cookies & Tracking

### GDPR + ePrivacy Directive (EU)
- Cookies that are not strictly necessary for the service require **prior, freely given, specific, and informed consent** before being set.
- Strictly necessary cookies (session management, authentication, load balancing, user preferences for the current session) do not require consent.
- Analytics cookies, advertising cookies, and tracking pixels require consent.
- "Accept all" and "Reject all" must be equally prominent — dark patterns (making rejection harder) violate GDPR.
- Consent must be recorded and verifiable.

### What Makes a Cookie Banner Compliant
- Presented before any non-essential cookies are set.
- Reject/decline option is as easy to find and use as Accept.
- Categories of cookies are described clearly.
- Consent can be withdrawn at any time.
- Consent state is stored but not itself set a non-consented cookie.

### CCPA Cookie Rules
- "Do Not Sell or Share My Personal Information" link required if cookies are used for cross-context behavioural advertising (which most third-party ad networks involve).
- Opt-out signal via Global Privacy Control (GPC) must be honoured.

---

## 8. Privacy Policy Requirements

Every software product that collects personal data must have a privacy policy. It must typically include:

| Element | GDPR Required | CCPA Required |
|---------|:---:|:---:|
| Identity and contact details of the controller | ✅ | ✅ |
| Contact details of the DPO (if applicable) | ✅ | — |
| Purposes and lawful basis for processing | ✅ | Partial |
| Categories of personal data collected | ✅ | ✅ |
| Recipients or categories of recipients | ✅ | ✅ |
| Transfers to third countries | ✅ | — |
| Retention periods | ✅ | — |
| Data subject rights and how to exercise them | ✅ | ✅ |
| Right to withdraw consent | ✅ | — |
| Right to lodge a complaint with a DPA | ✅ | — |
| Whether provision is a statutory/contractual requirement | ✅ | — |
| Categories of sources (if not collected directly) | — | ✅ |
| Business/commercial purpose for collection | — | ✅ |
| Third parties personal information is sold/shared with | — | ✅ |

The privacy policy must be written in plain, clear language — not legal jargon.

---

## 9. Data Transfers Across Borders

### GDPR Mechanisms for Transferring Data Outside the EU/EEA
- **Adequacy decision**: The European Commission has determined the destination country provides adequate protection. Current list includes UK, Japan, Canada (commercial), Switzerland, and others.
- **Standard Contractual Clauses (SCCs)**: EU-approved contract templates for controller-to-controller and controller-to-processor transfers.
- **Binding Corporate Rules (BCRs)**: Approved internal data transfer policies for multinational companies.
- **Specific derogations**: Explicit consent, performance of a contract, vital interests, important public interest.

**Note**: Transfers to the US are currently covered by the EU-US Data Privacy Framework (adopted July 2023), but its status should be verified as it has been subject to legal challenge.

---

## 10. Privacy by Design

The GDPR codifies Privacy by Design as a legal requirement (Article 25). Core principles:

1. **Proactive not reactive** — anticipate and prevent privacy events before they occur.
2. **Privacy as the default** — data subjects should receive maximum privacy protection automatically without action required.
3. **Privacy embedded into design** — integrated into architecture, not bolted on.
4. **Full functionality** — positive-sum approach; privacy does not trade off against functionality.
5. **End-to-end security** — data protected throughout its entire lifecycle.
6. **Visibility and transparency** — architecture and policies are open to verification.
7. **Respect for user privacy** — user-centric; strong privacy defaults.

### Practical Implementation for Software Teams
- Run privacy impact assessments during design, not post-launch.
- Collect the minimum data necessary to deliver the feature.
- Build data subject rights (access, deletion, export) into the product from day one.
- Document retention periods and build automated deletion jobs.
- Encrypt personal data at rest and in transit.
- Log all access to personal data by internal users.
- Design data flows to be auditable.

---

## 11. Quick-Reference Obligations Checklist

### GDPR Checklist
- [ ] Lawful basis identified and documented for every processing activity
- [ ] Record of Processing Activities (ROPA) maintained
- [ ] Privacy policy published and up to date
- [ ] Cookie consent mechanism implemented (prior consent, reject-as-easy-as-accept)
- [ ] Data subject rights process documented and tested (access, deletion, portability, objection)
- [ ] Data Processing Agreements signed with all processors
- [ ] Data breach response plan documented; 72-hour notification procedure in place
- [ ] DPA appointed if required (large-scale systematic monitoring or special category data)
- [ ] DPIA conducted for high-risk processing
- [ ] Cross-border transfer mechanism in place if data leaves EU/EEA
- [ ] Retention periods defined and enforced
- [ ] Consent records maintained (where consent is the lawful basis)

### CCPA Checklist
- [ ] Privacy policy updated with CCPA-required disclosures
- [ ] "Do Not Sell or Share My Personal Information" link present
- [ ] Consumer rights process implemented (know, delete, correct, opt-out, non-discrimination)
- [ ] Service Provider agreements in place
- [ ] Global Privacy Control (GPC) signal honoured
- [ ] Verification process for consumer requests implemented

---

*Sources: GDPR (EU) 2016/679; ePrivacy Directive 2002/58/EC; CCPA Cal. Civ. Code §1798.100 et seq.; CPRA Proposition 24 (2020); EDPB Guidelines. This is informational guidance only — not legal advice.*