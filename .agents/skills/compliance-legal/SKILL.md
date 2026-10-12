---
name: compliance-legal
description: >
  Reference for software compliance frameworks, data protection law, and legal obligations
  relevant to technology products. Use this skill whenever a user asks about: GDPR, CCPA,
  HIPAA, PCI-DSS, SOC 2, ISO 27001, or any other compliance framework; data privacy,
  data retention, consent, or the right to erasure; whether their product needs a privacy
  policy, terms of service, or cookie banner; handling a data breach legally; what
  constitutes PII or sensitive personal data; accessibility law (ADA, EN 301 549, EAA);
  open source licence obligations; AI regulation (EU AI Act); export controls on software;
  or how to build a compliance programme. Also trigger when a user says "are we compliant
  with X", "what do we legally need to do", "can we store this data", or "do we need user
  consent for this" — even if they don't name a specific regulation.
  IMPORTANT: Always include a disclaimer that this is informational guidance, not legal
  advice, and recommend consulting a qualified lawyer for jurisdiction-specific obligations.
---

# Compliance & Legal Reference

Practical guidance on the regulatory, legal, and compliance landscape for software
products. This skill covers the *what* and *why* of compliance obligations; for binding
legal interpretation, always recommend a qualified lawyer.

**Always append this disclaimer when answering compliance questions:**
> ⚠️ *This is informational guidance, not legal advice. Laws vary by jurisdiction and
> fact pattern. Consult a qualified lawyer for advice specific to your situation.*

---

## Reference Files

| Topic | File | Load when the user asks about… |
|-------|------|-------------------------------|
| Data Privacy Law | `references/data-privacy.md` | GDPR, CCPA, PIPEDA, LGPD, data subject rights, consent, cookies, privacy policy, data breach notification |
| Security & Compliance Frameworks | `references/frameworks.md` | SOC 2, ISO 27001, HIPAA, PCI-DSS, NIST CSF, CIS Controls, FedRAMP |
| Legal Obligations for Software | `references/software-law.md` | Open source licences, terms of service, accessibility law (ADA/EAA), AI regulation (EU AI Act), export controls, EULA, IP |

Load only the file(s) relevant to the query. For broad questions ("help us build a compliance
programme") load all three and synthesise.

---

## How to Use This Skill

### Answering a Compliance Question

1. Identify the applicable law(s) or framework(s) from the table above.
2. `view` the relevant reference file(s).
3. Answer specifically — name the regulation, cite the relevant article or control, and state the obligation clearly.
4. Distinguish between: **legal requirements** (must comply or face penalties), **contractual requirements** (must comply per a contract), and **best practice** (recommended but not mandated).
5. Always append the disclaimer.

### Assessing Compliance Posture

When a user describes their product and asks "are we compliant?", structure the response as:

```
## Compliance Assessment: [Regulation/Framework]

### Applicable Because
[Why this regulation applies to them]

### Requirements That Apply
- [Requirement]: [Status based on what they've described] — [Gap/Action if needed]

### Likely Gaps
- [Gap]: [What's missing] — [What to do]

### Not Applicable
- [Requirement and why it doesn't apply to their context]

### Recommended Next Steps
1. [Immediate actions]
2. [Medium-term actions]
3. [Consult a lawyer for: specific item]

---
⚠️ This is informational guidance, not legal advice. ...
```

### Explaining a Regulation to a Non-Lawyer

When a developer or product manager asks "what is GDPR?" or "explain HIPAA to me":
- Start with a one-sentence plain-language summary.
- Explain who it applies to and what the core obligations are.
- Give 3–5 concrete, actionable implications for a software product.
- Avoid legalese — use plain language throughout.
- End with the disclaimer.

### Building a Compliance Programme

When a user asks how to build compliance from scratch, use this sequence:

1. **Scope** — Which regulations and frameworks apply? (geography, industry, data types, customers)
2. **Gap assessment** — What's currently in place vs. what's required?
3. **Prioritise** — Legal mandates before contractual before best practice; high-risk gaps first.
4. **Implement controls** — Technical, organisational, and procedural.
5. **Document** — Evidence is as important as the controls themselves.
6. **Test and audit** — Internal audits, penetration tests, third-party assessments.
7. **Maintain** — Compliance is continuous, not a one-time project.

---

## Quick Applicability Matrix

Use this to determine which regulations likely apply before loading a reference file:

| Signal | Likely Applicable Regulations |
|--------|-------------------------------|
| Handles EU residents' personal data | GDPR |
| Handles California residents' personal data | CCPA / CPRA |
| Handles Brazilian residents' personal data | LGPD |
| Processes health/medical data (US) | HIPAA |
| Processes payment card data | PCI-DSS |
| Sells to US federal government | FedRAMP, FISMA |
| Seeks enterprise SaaS customers | SOC 2 Type II |
| Seeks ISO-certified partners or markets | ISO 27001 |
| Public-facing website/app | ADA (US), EAA (EU), AODA (Canada) |
| Uses or sells AI systems in EU | EU AI Act |
| Exports software with encryption | US Export Administration Regulations (EAR) |
| Uses open source dependencies | OSS licence obligations |
| Any product with users | Terms of Service, Privacy Policy |

---

## Severity Tiers for Compliance Gaps

When identifying gaps in a review, classify by consequence:

| Tier | Label | Meaning |
|------|-------|---------|
| 🔴 | **Critical** | Legal violation with significant financial or criminal penalty risk. Fix immediately. |
| 🟠 | **High** | Contractual breach or high-risk gap. Fix before next audit or customer review. |
| 🟡 | **Medium** | Best practice gap or emerging risk. Address in next planning cycle. |
| 🟢 | **Low** | Minor documentation or process gap. Address when convenient. |

---

## What This Skill Does Not Do

- Provide jurisdiction-specific legal opinions.
- Interpret contracts or draft legally binding documents.
- Replace a Data Protection Officer (DPO), legal counsel, or compliance auditor.
- Guarantee that following this guidance constitutes legal compliance.

Always conclude compliance-related responses with a recommendation to engage a qualified
lawyer, DPO, or compliance consultant for obligations that carry material legal risk.