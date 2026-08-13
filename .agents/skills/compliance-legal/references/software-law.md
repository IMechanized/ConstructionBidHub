# Software Law & Legal Obligations Reference

> Informational guidance only — not legal advice. Laws vary significantly by jurisdiction. Engage a qualified lawyer for obligations specific to your situation.

---

## Table of Contents

1. [Open Source Licences](#1-open-source-licences)
2. [Terms of Service & End-User Licence Agreements](#2-terms-of-service--end-user-licence-agreements)
3. [Privacy Policy Requirements](#3-privacy-policy-requirements)
4. [Accessibility Law](#4-accessibility-law)
5. [AI Regulation](#5-ai-regulation)
6. [Export Controls on Software](#6-export-controls-on-software)
7. [Intellectual Property in Software](#7-intellectual-property-in-software)
8. [Consumer Protection Law](#8-consumer-protection-law)
9. [Electronic Signature & Contracting Law](#9-electronic-signature--contracting-law)
10. [Legal Checklist for Software Products](#10-legal-checklist-for-software-products)

---

## 1. Open Source Licences

### Why This Matters
Using open source software (OSS) creates legal obligations. Violation of OSS licence terms is copyright infringement. The specific obligations depend on the licence type.

### Licence Categories

#### Permissive Licences
Few restrictions — can use in proprietary products with minimal obligations.

| Licence | Key Obligations |
|---------|----------------|
| **MIT** | Include copyright notice and licence text in distributions |
| **BSD 2-Clause** | Include copyright notice and licence text |
| **BSD 3-Clause** | Same as above + cannot use project name for endorsement |
| **Apache 2.0** | Include copyright notice, licence text, and NOTICE file; state changes made |
| **ISC** | Include copyright notice and licence text |

#### Weak Copyleft (LGPL, MPL, EPL)
Can use in proprietary software but must share modifications to the licensed component itself.

| Licence | Key Obligations |
|---------|----------------|
| **LGPL 2.1 / 3.0** | Modifications to the LGPL library must be released; allows linking from proprietary code |
| **MPL 2.0** | Modifications to MPL-covered files must be released under MPL; can combine with proprietary code |
| **EPL 2.0** | Modifications must be released; compatible with some other licences |

#### Strong Copyleft (GPL, AGPL)
The most restrictive. Using GPL/AGPL code in your product can require you to release your entire product's source code.

| Licence | Key Obligations |
|---------|----------------|
| **GPL 2.0 / 3.0** | Any software that incorporates GPL code and is distributed must be released under GPL with full source |
| **AGPL 3.0** | Same as GPL, but the "distribution" trigger also covers making software available over a network (SaaS) |

**Critical implication of AGPL**: If your SaaS product uses AGPL-licensed code, you may be required to release your entire application's source code to users who access it over the internet. Evaluate AGPL dependencies with extreme care.

### OSS Compliance Programme
- Maintain a software bill of materials (SBOM) listing all OSS dependencies and their licences.
- Conduct licence audits with tools: FOSSA, Black Duck, REUSE, or `license-checker` (npm).
- Review licences of new dependencies before adoption.
- Create an OSS policy defining which licence types are approved for different use cases.
- Attribute correctly: include required notices in your product's documentation or UI.

### Common Mistakes
- Assuming all open source is freely usable without restriction.
- Including GPL/AGPL code in proprietary products without legal review.
- Failing to include required attribution notices.
- Modifying LGPL/MPL code without releasing the modifications.

---

## 2. Terms of Service & End-User Licence Agreements

### Terms of Service (ToS) / Terms & Conditions

A ToS is a legally binding agreement between the service provider and the user. For most web/mobile products, it should address:

**Essential Clauses**
- **Acceptance mechanism**: How users agree (clickwrap preferred over browsewrap for enforceability).
- **Eligibility**: Age requirements (COPPA in the US mandates 13+; GDPR may require 16+ for data processing consent in some member states).
- **Licence grant**: What rights users have to use the service.
- **Prohibited uses**: What users cannot do.
- **Content ownership**: Who owns user-generated content; what licence users grant the platform.
- **Payment terms**: Pricing, billing cycles, refunds, chargebacks.
- **Termination**: Under what conditions accounts can be suspended or terminated.
- **Dispute resolution**: Jurisdiction, governing law, arbitration clause (where enforceable).
- **Limitation of liability**: Cap on damages the service can be held liable for.
- **Disclaimer of warranties**: "As is" provision.
- **Changes to terms**: How and with what notice terms can be updated.

**Enforceability Considerations**
- Clickwrap (user actively clicks "I agree") is more enforceable than browsewrap (notice at bottom of page linking to terms).
- Maintain records of when each user accepted which version of the terms.
- Courts in some jurisdictions will not enforce terms that are unconscionable, buried, or not presented clearly.
- Class action waivers and mandatory arbitration clauses are enforceable in some US states but not others, and are generally not enforceable in the EU.

### EULA (End-User Licence Agreement)
Typically used for downloadable software. Grants a licence to use the software rather than transferring ownership. Key clauses:
- Scope of licence (single user, per seat, per device).
- Restrictions (no reverse engineering, no redistribution).
- Termination on breach.
- No transfer of intellectual property.

---

## 3. Privacy Policy Requirements

A privacy policy is a legal requirement whenever you collect personal data. See `data-privacy.md` for full GDPR/CCPA requirements. Minimum content for any product:

- Who you are and how to contact you.
- What personal data you collect (exhaustive list).
- Why you collect it (purpose).
- What you do with it (processing, sharing with third parties).
- How long you keep it.
- User rights and how to exercise them.
- How to complain (regulator contact information).
- Last updated date.

**Format requirements**: Must be easy to find (linked in footer, presented during sign-up), written in plain language, and free of legalese.

---

## 4. Accessibility Law

### United States — ADA & Section 508

**Americans with Disabilities Act (ADA), Title III**:
- Applies to places of public accommodation.
- Courts have increasingly held that websites and mobile apps of businesses open to the public are covered under Title III.
- There is no explicit technical standard written into the ADA, but courts and the DOJ use **WCAG 2.1 Level AA** as the de facto standard.
- Penalties: First violation up to $75,000; subsequent violations up to $150,000; plus plaintiff's legal fees in private lawsuits.

**Section 508 of the Rehabilitation Act**:
- Applies to federal agencies and any organisation receiving federal funding.
- Requires conformance with WCAG 2.0 Level AA (ICT standards).
- Mandatory for US federal procurement.

### European Union — European Accessibility Act (EAA)

**European Accessibility Act (Directive 2019/882)**:
- Applies from 28 June 2025.
- Covers: computers, smartphones, e-commerce, banking services, e-books, audiovisual media services, and electronic communications.
- Requires compliance with **EN 301 549** (which references WCAG 2.1 Level AA).
- Member states determine penalties; significant fines expected.

**Web Accessibility Directive (Directive 2016/2102)**:
- Applies to public sector bodies in the EU.
- Requires WCAG 2.1 Level AA compliance.

### United Kingdom

**Equality Act 2010**:
- "Reasonable adjustments" required for service providers to avoid discrimination against disabled people.
- WCAG 2.1 Level AA is the accepted technical standard.

**Public Sector Bodies Accessibility Regulations 2018**:
- WCAG 2.1 Level AA mandatory for UK public sector websites and apps.

### Canada

**Accessibility for Ontarians with Disabilities Act (AODA)**:
- WCAG 2.0 Level AA required for Ontario private sector (employees 50+) and public sector.

### The Technical Standard: WCAG

| Level | Status |
|-------|--------|
| WCAG 2.1 Level A | Minimum — does not satisfy most legal requirements alone |
| **WCAG 2.1 Level AA** | Legal requirement in most jurisdictions |
| WCAG 2.1 Level AAA | Best practice; not generally required by law |
| WCAG 2.2 | Published October 2023; adoption in law is progressing |

For software products with any user-facing interface, target **WCAG 2.1 Level AA** as the baseline. See `references/ui-ux.md` → Section 9 for technical implementation guidance.

---

## 5. AI Regulation

### EU AI Act (Regulation 2024/1689)

The world's first comprehensive AI regulation. In force August 2024; most provisions apply from August 2026.

**Risk-Based Classification**:

| Risk Level | Examples | Requirements |
|------------|----------|-------------|
| **Unacceptable risk** (banned) | Social scoring by governments; real-time biometric surveillance in public | Prohibited entirely |
| **High risk** | AI in critical infrastructure, employment decisions, credit scoring, law enforcement | Conformity assessment, transparency, human oversight, logging, registration in EU database |
| **Limited risk** | Chatbots, deepfake generators, emotion recognition | Transparency obligations (disclose AI nature to users) |
| **Minimal risk** | Spam filters, AI in video games, recommendation systems | No mandatory obligations |

**General Purpose AI (GPAI) Models** (e.g. LLMs):
- Transparency obligations: publish technical documentation, copyright summary.
- GPAI models with systemic risk (above capability thresholds): adversarial testing, incident reporting, cybersecurity measures.

**Who Is Affected**:
- Any organisation placing AI systems on the EU market or putting them into service in the EU — regardless of where the organisation is based.
- Both AI system providers and deployers have obligations.

**Penalties**: Up to €35 million or 7% of global turnover (prohibited practices); €15 million or 3% (other violations); €7.5 million or 1.5% (incorrect information to authorities).

### US AI Regulation (As of 2025)

No comprehensive federal AI law equivalent to the EU AI Act. Sector-specific guidance:
- **Executive Order on AI (Oct 2023)**: Directed agencies to develop AI safety standards; primarily affects federal agencies and large AI developers.
- **FTC**: Authority over deceptive AI practices, biometric data, and AI-enabled discrimination.
- **EEOC**: AI used in employment decisions must not violate anti-discrimination law.
- **CFPB**: AI in consumer financial services must comply with fair lending laws.
- **State laws**: Several US states have enacted AI-specific legislation (Colorado, California, Illinois, Texas).

### Practical AI Compliance Considerations for Software Products

- **Disclosure**: If your product uses AI in a way that interacts with users, consider whether disclosure is legally or ethically required.
- **Bias and fairness**: AI systems used in consequential decisions (hiring, lending, housing) face anti-discrimination law scrutiny in most jurisdictions.
- **Intellectual property**: Outputs from AI models trained on copyrighted data may face copyright challenges. The legal landscape is still evolving.
- **Data used for training**: Using user data to train AI models may require explicit consent under GDPR.
- **Automated decision-making**: GDPR Article 22 restricts solely automated decisions with significant effects on individuals.

---

## 6. Export Controls on Software

### US Export Administration Regulations (EAR)

Administered by the Bureau of Industry and Security (BIS), US Department of Commerce.

**What Is Controlled**:
- Software with encryption above certain thresholds (Export Control Classification Number: ECCN 5D002).
- Software on the Commerce Control List (CCL).
- Mass market encryption software (most commercial products) qualifies for License Exception ENC after a one-time notification to BIS.

**Key Obligations for Most Software Companies**:
- If your product contains encryption (SSL/TLS, encrypted storage, VPN), you likely need to file a one-time self-classification with BIS under License Exception ENC.
- Do not export to embargoed countries: Cuba, Iran, North Korea, Russia (broad restrictions post-2022), Syria.
- Do not export to denied parties (check the BIS Denied Persons List, Entity List, and OFAC SDN List).
- Open-source encryption software that is publicly available may be exempt but typically still requires a notification to BIS.

**Penalties**: Criminal penalties up to $1 million per violation and 20 years imprisonment; civil penalties up to $364,992 per violation.

### Practical Steps for Software Companies
1. Determine if your product is subject to EAR (most software with encryption is).
2. Classify your product on the CCL.
3. If eligible, file for License Exception ENC.
4. Screen customers and end-users against denied party and sanctioned country lists before providing access.
5. Include export compliance clauses in your Terms of Service.

---

## 7. Intellectual Property in Software

### Copyright
- Software code is automatically protected by copyright from the moment of creation — no registration required (though registration strengthens enforcement in the US).
- The copyright holder has exclusive rights to copy, distribute, modify, and create derivative works.
- Work made for hire doctrine: code created by employees within the scope of employment is owned by the employer.
- Independent contractors: copyright ownership must be explicitly assigned in a written contract — it does not transfer automatically.

**Practical implication**: Ensure all contractor agreements include a clear IP assignment clause.

### Patents
- Software patents are valid in the US but subject to restrictions on abstract ideas. The legal landscape is complex and jurisdiction-specific.
- EU generally does not grant patents for software "as such," though patents covering technical effects of software are possible.
- Patent freedom-to-operate searches should be conducted before launching products in new markets.

### Trade Secrets
- Proprietary algorithms, business logic, and data can be protected as trade secrets if they provide competitive advantage and are subject to reasonable secrecy measures.
- Require NDAs with employees, contractors, and partners who access trade secrets.
- Implement access controls and document the secrecy measures taken.

### Trademarks
- Register your product name, logo, and key brand identifiers as trademarks in the jurisdictions you operate in.
- Conduct clearance searches before adopting a new brand name.
- Monitor for infringement; failure to enforce can weaken trademark rights.

### Employee/Contractor IP Agreements
Every employment and contractor agreement should include:
- Assignment of all work-related IP to the company.
- Disclosure of inventions.
- Representation that work does not infringe third-party rights.
- Carve-out for pre-existing IP brought into the engagement.

---

## 8. Consumer Protection Law

### US Federal Trade Commission (FTC) Act
- Prohibits "unfair or deceptive acts or practices" in commerce.
- Applies broadly to digital products: misleading claims, dark patterns, subscription traps, unauthorised data collection.
- FTC has taken action against: auto-renewing subscriptions without clear disclosure, negative option marketing, making it unreasonably hard to cancel, and deceptive claims about data privacy.

### EU Unfair Commercial Practices Directive / Digital Services Act
- Prohibits misleading and aggressive commercial practices.
- **Digital Services Act (DSA)**: Applies to online platforms; transparency requirements for algorithms, advertising, and moderation; complaint mechanisms; crisis response for very large platforms.
- **Omnibus Directive**: Enhanced consumer rights for digital products; disclosure requirements for personalised pricing.

### Children's Privacy (COPPA — US)
- The Children's Online Privacy Protection Act applies to websites and online services directed at children under 13, or that knowingly collect data from children under 13.
- Requires verifiable parental consent before collecting personal information from children.
- Penalties: up to $51,744 per violation per day.
- If your product might be used by children, obtain legal advice on COPPA compliance.

---

## 9. Electronic Signature & Contracting Law

### US — Electronic Signatures in Global and National Commerce Act (E-SIGN)
- Electronic signatures are legally valid and enforceable for most contracts.
- A "click to agree" constitutes a valid signature.
- Certain categories excluded: wills, family law, court orders.

### EU — eIDAS Regulation
- Three tiers: Simple Electronic Signature, Advanced Electronic Signature (AES), Qualified Electronic Signature (QES).
- QES is legally equivalent to a handwritten signature across all EU member states.
- High-stakes contracts (real estate, employment termination in some countries) may require QES or specific national requirements.

---

## 10. Legal Checklist for Software Products

### At Launch
- [ ] Privacy policy published and accessible (link in footer, shown during sign-up)
- [ ] Terms of Service / EULA in place with clear acceptance mechanism
- [ ] Cookie consent mechanism (prior consent for non-essential cookies in EU)
- [ ] Age gate if product may be used by children (COPPA if US, GDPR Article 8 if EU)
- [ ] OSS licence audit completed; attribution notices included
- [ ] Export compliance: BIS notification filed if product contains encryption
- [ ] Accessibility: WCAG 2.1 Level AA audit completed
- [ ] IP assignment agreements in place with all employees and contractors

### Ongoing
- [ ] Privacy policy reviewed and updated when processing activities change
- [ ] ToS reviewed annually or when material changes are made to the product
- [ ] New OSS dependencies audited for licence compatibility before adoption
- [ ] Denied party screening performed for customers in controlled categories
- [ ] Data breach response plan reviewed and tested
- [ ] AI system transparency and fairness documentation maintained (if applicable)

### When Entering New Markets
- [ ] Jurisdiction-specific privacy law requirements reviewed (LGPD, POPIA, APPI, etc.)
- [ ] Local accessibility law requirements reviewed
- [ ] Export licence requirements for the new market checked
- [ ] Local consumer protection law obligations reviewed
- [ ] Trademark clearance and registration in new jurisdiction

---

*Sources: EUPL, GNU GPL/AGPL, MIT, Apache 2.0 licence texts; 42 U.S.C. §12181 (ADA); 29 U.S.C. §794d (Section 508); EU Directive 2019/882 (EAA); EU AI Act 2024/1689; EAR 15 CFR Parts 730–774; 15 U.S.C. §7001 (E-SIGN); EU eIDAS Regulation 910/2014. This is informational guidance only — not legal advice.*