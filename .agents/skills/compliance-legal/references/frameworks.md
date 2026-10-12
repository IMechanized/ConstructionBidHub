# Security & Compliance Frameworks Reference

> Informational guidance only — not legal advice. Framework requirements vary by scope, version, and auditor interpretation. Engage a qualified assessor for formal certification.

---

## Table of Contents

1. [SOC 2](#1-soc-2)
2. [ISO 27001](#2-iso-27001)
3. [HIPAA (US Health Data)](#3-hipaa-us-health-data)
4. [PCI-DSS (Payment Cards)](#4-pci-dss-payment-cards)
5. [NIST Cybersecurity Framework (CSF)](#5-nist-cybersecurity-framework-csf)
6. [CIS Controls](#6-cis-controls)
7. [FedRAMP (US Federal Cloud)](#7-fedramp-us-federal-cloud)
8. [Framework Selection Guide](#8-framework-selection-guide)
9. [Building a Compliance Programme](#9-building-a-compliance-programme)
10. [Audit Readiness Checklist](#10-audit-readiness-checklist)

---

## 1. SOC 2

**Full name**: Service Organisation Control 2
**Issued by**: American Institute of CPAs (AICPA)
**Purpose**: Demonstrates to enterprise customers that a SaaS/cloud vendor handles data securely and reliably.
**Who needs it**: Almost any B2B SaaS company selling to enterprise customers will eventually be asked for a SOC 2 report.

### Type I vs. Type II

| | SOC 2 Type I | SOC 2 Type II |
|-|-------------|---------------|
| What it covers | Design of controls at a point in time | Operating effectiveness of controls over a period (usually 6–12 months) |
| Value | Quick to achieve; demonstrates intent | Higher assurance; preferred by enterprise buyers |
| Timeline | 2–4 months | 6–12 months after controls are in place |

### Trust Service Criteria (TSC)

SOC 2 is structured around up to five criteria — only **Security** is mandatory:

| Criterion | What It Covers |
|-----------|---------------|
| **Security** (required) | Protection against unauthorised access |
| **Availability** | System availability per SLA |
| **Processing Integrity** | Complete, accurate, timely processing |
| **Confidentiality** | Protection of confidential information |
| **Privacy** | Collection, use, retention, and disposal of personal data |

### Key Control Domains for Security Criterion
- Logical and physical access controls
- System operations (change management, incident response, monitoring)
- Risk management
- Vendor management
- Encryption and key management
- Vulnerability management and penetration testing
- Employee security training

### Common SOC 2 Gaps (What Fails Audits)
- Missing or incomplete change management process.
- No documented incident response plan or evidence it has been tested.
- Access reviews not performed at regular intervals.
- Terminated employees' access not revoked promptly.
- No vendor risk assessment process.
- Logs not retained for required period (typically 1 year).
- No penetration testing evidence.

---

## 2. ISO 27001

**Full name**: ISO/IEC 27001:2022 (Information Security Management Systems)
**Issued by**: International Organisation for Standardisation (ISO)
**Purpose**: International standard for an Information Security Management System (ISMS). Demonstrates systematic approach to managing information risk.
**Who needs it**: Organisations selling internationally, regulated industries, government suppliers, and those requiring formal certification (not just a report).

### Structure
- **Main body**: 10 clauses defining ISMS requirements (clauses 4–10 are mandatory).
- **Annex A**: 93 controls across 4 themes — must be considered; controls not implemented must be justified in a Statement of Applicability (SoA).

### Four Themes of Annex A Controls (ISO 27001:2022)

| Theme | Controls |
|-------|---------|
| Organisational | Policies, roles, responsibilities, threat intelligence, supplier security |
| People | Pre-employment screening, security awareness, disciplinary process |
| Physical | Physical security perimeters, equipment security, clear desk |
| Technological | Access control, cryptography, secure development, vulnerability management, logging |

### Key Mandatory Requirements
1. **Context of the organisation** — understand internal/external issues affecting the ISMS.
2. **Leadership commitment** — top management must demonstrate active sponsorship.
3. **Risk assessment** — systematic identification and evaluation of information risks.
4. **Risk treatment plan** — documented decisions on how each risk is treated.
5. **Statement of Applicability (SoA)** — justification for inclusion/exclusion of each Annex A control.
6. **Internal audit** — regular internal audits of the ISMS.
7. **Management review** — periodic review of ISMS performance by leadership.
8. **Continual improvement** — documented improvement actions.

### Certification Process
1. Gap analysis against the standard.
2. Implement required controls and documentation.
3. Internal audit.
4. Stage 1 audit (document review by accredited certification body).
5. Stage 2 audit (effectiveness review; on-site).
6. Certificate issued (valid 3 years, with annual surveillance audits).

---

## 3. HIPAA (US Health Data)

**Full name**: Health Insurance Portability and Accountability Act of 1996
**Enforced by**: HHS Office for Civil Rights (OCR)
**Penalties**: $100–$50,000 per violation; up to $1.9 million per violation category per year; criminal penalties for wilful neglect

### Who It Applies To
- **Covered entities**: Healthcare providers, health plans, healthcare clearinghouses that transmit health information electronically.
- **Business associates**: Any organisation that creates, receives, maintains, or transmits Protected Health Information (PHI) on behalf of a covered entity. This includes most health-tech SaaS products.
- Business associates must sign a **Business Associate Agreement (BAA)** before receiving PHI.

### Protected Health Information (PHI)
Any individually identifiable health information relating to:
- Past, present, or future physical or mental health/condition.
- Provision of healthcare.
- Past, present, or future payment for healthcare.

18 identifiers make health data PHI (including name, dates, location, phone, email, SSN, IP address, device identifiers, etc.).

**ePHI**: PHI that is created, stored, transmitted, or received electronically — subject to the Security Rule.

### Three Rules

| Rule | Covers | Key Requirements |
|------|--------|-----------------|
| **Privacy Rule** | Use and disclosure of PHI | Minimum necessary standard; patient rights; notice of privacy practices |
| **Security Rule** | ePHI (electronic PHI) | Administrative, physical, and technical safeguards |
| **Breach Notification Rule** | PHI breaches | 60-day notification to individuals; annual HHS report; media if >500 in a state |

### Security Rule Safeguards

**Administrative safeguards** (the most important):
- Security officer designation.
- Workforce training and access management.
- Risk analysis and risk management (must be documented and updated).
- Contingency plan (backup, disaster recovery).

**Physical safeguards**:
- Facility access controls.
- Workstation and device controls.
- Disposal of media with PHI.

**Technical safeguards**:
- Unique user identification.
- Emergency access procedure.
- Automatic logoff.
- Encryption and decryption (addressable — must implement or document why not).
- Audit controls (logs of PHI access).
- Integrity controls.
- Transmission security (encryption in transit).

### Common HIPAA Mistakes for SaaS Products
- Accepting PHI from a covered entity without a signed BAA.
- Using email or SMS to transmit PHI without encryption.
- Granting workforce access to PHI without minimum-necessary analysis.
- Not documenting the risk analysis.
- Not training workforce on HIPAA requirements.

---

## 4. PCI-DSS (Payment Cards)

**Full name**: Payment Card Industry Data Security Standard
**Issued by**: PCI Security Standards Council (PCI SSC)
**Current version**: PCI DSS v4.0 (effective March 2024)
**Enforced by**: Card brands (Visa, Mastercard, Amex, etc.) via acquiring banks; non-compliance results in fines and loss of ability to process cards

### Who It Applies To
Any organisation that stores, processes, or transmits cardholder data (CHD) or sensitive authentication data (SAD). Scope is determined by the Cardholder Data Environment (CDE).

### Key Principle: Reduce Your Scope
The best way to manage PCI compliance is to reduce the amount of cardholder data your environment handles. Use a PCI-compliant payment processor (Stripe, Braintree, Square) to tokenise card data — your servers never see the raw card number.

### Merchant Levels and SAQ Types

| Merchant Level | Transaction Volume | Assessment |
|---------------|-------------------|-----------|
| Level 1 | >6M Visa/MC per year | Annual Report on Compliance (QSA) + quarterly network scan |
| Level 2 | 1M–6M | Annual SAQ + quarterly scan |
| Level 3 | 20K–1M (e-commerce) | Annual SAQ + quarterly scan |
| Level 4 | <20K e-commerce or <1M other | Annual SAQ + quarterly scan recommended |

SAQ = Self-Assessment Questionnaire (multiple types depending on integration method).

### The 12 PCI DSS Requirements

| # | Requirement |
|---|-------------|
| 1 | Install and maintain network security controls |
| 2 | Apply secure configurations to all system components |
| 3 | Protect stored account data |
| 4 | Protect cardholder data with strong cryptography during transmission |
| 5 | Protect all systems against malware |
| 6 | Develop and maintain secure systems and software |
| 7 | Restrict access to system components and CHD by business need to know |
| 8 | Identify users and authenticate access to system components |
| 9 | Restrict physical access to CHD |
| 10 | Log and monitor all access to system components and CHD |
| 11 | Test security of systems and networks regularly |
| 12 | Support information security with organisational policies and programmes |

### What You Must Never Store (Post-Authorisation)
- Full magnetic stripe / chip data
- Card verification codes (CVV2, CVC2, CAV2)
- PINs and PIN blocks

---

## 5. NIST Cybersecurity Framework (CSF)

**Full name**: NIST Cybersecurity Framework 2.0
**Issued by**: National Institute of Standards and Technology (US)
**Purpose**: Voluntary framework for managing cybersecurity risk. Widely adopted as a baseline even outside the US.

### Six Core Functions (CSF 2.0)

| Function | Purpose |
|----------|---------|
| **Govern** | Establish cybersecurity risk management strategy, policies, and roles |
| **Identify** | Understand the organisation's cybersecurity risk to systems, people, assets, data |
| **Protect** | Safeguards to manage cybersecurity risk |
| **Detect** | Identify cybersecurity incidents |
| **Respond** | Take action regarding a detected incident |
| **Recover** | Restore capabilities impaired by an incident |

### Implementation Tiers

| Tier | Label | Description |
|------|-------|-------------|
| 1 | Partial | Ad hoc, reactive; limited risk awareness |
| 2 | Risk Informed | Risk management approved but not organisation-wide |
| 3 | Repeatable | Formal policies; consistent processes organisation-wide |
| 4 | Adaptive | Actively adapts based on lessons learned and threat intelligence |

### CSF Profiles
A CSF Profile maps the core functions to an organisation's business requirements, risk tolerance, and resources — used to identify and prioritise gaps.

---

## 6. CIS Controls

**Full name**: Center for Internet Security Critical Security Controls (CIS Controls v8)
**Purpose**: Prioritised set of 18 safeguards to defend against the most common cyber attacks. Practical and prescriptive.

### Implementation Groups

| Group | Organisation Profile | Controls |
|-------|---------------------|---------|
| **IG1** | Small, limited IT resources | 56 safeguards — essential cyber hygiene |
| **IG2** | Moderate sensitivity/complexity | IG1 + 74 additional |
| **IG3** | High sensitivity, complex | All 153 safeguards |

### The 18 CIS Controls
1. Inventory and Control of Enterprise Assets
2. Inventory and Control of Software Assets
3. Data Protection
4. Secure Configuration of Enterprise Assets and Software
5. Account Management
6. Access Control Management
7. Continuous Vulnerability Management
8. Audit Log Management
9. Email and Web Browser Protections
10. Malware Defenses
11. Data Recovery
12. Network Infrastructure Management
13. Network Monitoring and Defense
14. Security Awareness and Skills Training
15. Service Provider Management
16. Application Software Security
17. Incident Response Management
18. Penetration Testing

---

## 7. FedRAMP (US Federal Cloud)

**Full name**: Federal Risk and Authorization Management Program
**Purpose**: Standardised approach to security assessment, authorisation, and monitoring for cloud products used by US federal agencies.
**Who needs it**: Cloud service providers (CSPs) selling to US federal government agencies.

### Impact Levels

| Level | Data Sensitivity | Example |
|-------|-----------------|---------|
| **Low** | Loss would have limited effect | Public websites |
| **Moderate** | Loss would have serious effect | Most government systems |
| **High** | Loss would have severe/catastrophic effect | Law enforcement, emergency services |

### Key Requirements
- Implement NIST SP 800-53 security controls (number varies by level: ~125 at Low, ~325 at Moderate).
- Assessment by a FedRAMP-accredited Third Party Assessment Organisation (3PAO).
- Continuous monitoring with monthly vulnerability scans and annual assessments.
- Authorization to Operate (ATO) from a sponsoring federal agency.

---

## 8. Framework Selection Guide

| Your situation | Recommended framework(s) |
|----------------|-------------------------|
| B2B SaaS, US enterprise customers | SOC 2 Type II (start here) |
| International enterprise sales | ISO 27001 |
| Both US + international | SOC 2 + ISO 27001 (they overlap ~70%) |
| Handling health data for US healthcare | HIPAA BAA + Security Rule compliance |
| Processing credit/debit cards | PCI-DSS |
| US federal government customers | FedRAMP |
| Want a baseline internal security programme | CIS Controls IG1/IG2 or NIST CSF |
| Mature, seeking continuous improvement | NIST CSF profiles + CIS Controls |

---

## 9. Building a Compliance Programme

### Phase 1: Scoping (Weeks 1–2)
- Identify which regulations and frameworks apply (see Framework Selection Guide).
- Map your data flows: what data, from whom, stored where, accessed by whom.
- Define the scope boundary — what systems are in scope for each framework.

### Phase 2: Gap Assessment (Weeks 3–6)
- Map current controls against framework requirements.
- Identify gaps: missing controls, partial controls, undocumented controls.
- Prioritise gaps by risk level and framework criticality.

### Phase 3: Remediation (Variable — typically 2–6 months)
- Implement missing technical controls.
- Document policies, procedures, and processes.
- Train staff on their compliance obligations.
- Establish monitoring, logging, and alerting.

### Phase 4: Evidence Collection (Ongoing — 3–6 months before audit)
- Collect evidence of control operation (logs, screenshots, approval records, training records).
- Perform internal audit against framework requirements.
- Remediate any findings before external assessment.

### Phase 5: External Assessment (Variable)
- Engage auditor/assessor (QSA for PCI, 3PAO for FedRAMP, CPA for SOC 2, accredited CB for ISO 27001).
- Provide evidence; respond to findings.
- Receive report/certificate.

### Phase 6: Continuous Compliance (Ongoing)
- Monitor controls continuously.
- Perform regular vulnerability assessments and penetration tests.
- Update risk register and risk treatment plan.
- Track regulatory changes and update controls as needed.
- Conduct annual (or more frequent) reviews.

---

## 10. Audit Readiness Checklist

### Documentation (Required for Almost All Frameworks)
- [ ] Information security policy
- [ ] Acceptable use policy
- [ ] Access control policy
- [ ] Incident response plan and playbooks
- [ ] Business continuity and disaster recovery plan
- [ ] Change management procedure
- [ ] Vendor/third-party risk management procedure
- [ ] Data classification policy and data inventory
- [ ] Risk assessment (documented and current)
- [ ] Risk treatment plan

### Technical Evidence
- [ ] Access logs demonstrating least-privilege access
- [ ] Evidence of regular access reviews
- [ ] Vulnerability scan reports
- [ ] Penetration test report (within last 12 months)
- [ ] Evidence of encryption in transit and at rest
- [ ] Evidence of MFA on privileged accounts
- [ ] Evidence of off-boarding procedures (timely access revocation)
- [ ] Backup and recovery test results

### Operational Evidence
- [ ] Security awareness training records
- [ ] Incident register (including near-misses)
- [ ] Change management records
- [ ] Vendor assessments for critical third parties
- [ ] Board/leadership review of security programme

---

*Sources: AICPA SOC 2 Trust Services Criteria; ISO/IEC 27001:2022; HIPAA 45 CFR Parts 160 and 164; PCI DSS v4.0; NIST CSF 2.0; CIS Controls v8; FedRAMP documentation. This is informational guidance only — not legal advice.*