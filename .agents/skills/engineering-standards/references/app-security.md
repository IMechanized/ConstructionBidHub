# Application Security Rules: A Comprehensive Reference

> *Security is not a product, but a process. It's not something you buy; it's something you do. — Bruce Schneier*

---

## Table of Contents

1. [Core Security Principles](#1-core-security-principles)
2. [Authentication](#2-authentication)
3. [Authorisation & Access Control](#3-authorisation--access-control)
4. [Input Validation & Sanitisation](#4-input-validation--sanitisation)
5. [Injection Attacks](#5-injection-attacks)
6. [Cryptography](#6-cryptography)
7. [Secrets & Credential Management](#7-secrets--credential-management)
8. [Session Management](#8-session-management)
9. [API Security](#9-api-security)
10. [Transport Layer Security](#10-transport-layer-security)
11. [Dependency & Supply Chain Security](#11-dependency--supply-chain-security)
12. [Frontend Security](#12-frontend-security)
13. [Database Security](#13-database-security)
14. [Logging, Monitoring & Incident Response](#14-logging-monitoring--incident-response)
15. [Infrastructure & Deployment Security](#15-infrastructure--deployment-security)
16. [OWASP Top 10 Reference](#16-owasp-top-10-reference)
17. [Security Checklists](#17-security-checklists)

---

## 1. Core Security Principles

### 1.1 Defence in Depth
- Never rely on a single security control. Layer multiple independent defences so that the failure of one does not compromise the whole system.
- Example: Input validation at the UI layer + parameterised queries at the DB layer + least-privilege DB user — all three, not just one.

### 1.2 Principle of Least Privilege
- Every user, process, and service should have the minimum permissions required to perform its function — nothing more.
- A database account used by a read-only reporting service must not have write permissions.
- Escalate privileges only when required, for the minimum duration needed, and log the escalation.

### 1.3 Fail Securely
- When a system encounters an error or unexpected state, it should default to a **denied/closed** state, not an open one.
- A failed authentication check should deny access, not grant it.
- Exceptions that bubble up to users must never reveal stack traces, database schemas, or internal paths.

### 1.4 Assume Breach
- Design systems as if an attacker already has partial access.
- Implement monitoring to detect anomalous behaviour from inside the perimeter.
- Segment systems so that compromising one component does not grant access to all others.

### 1.5 Security by Design
- Security is an architectural concern — it cannot be bolted on after a system is built.
- Threat modelling should occur during design, before a line of code is written.
- Security requirements belong in the same backlog as feature requirements.

### 1.6 Open Design (Kerckhoffs's Principle)
- The security of a system must not depend on the secrecy of its design or algorithm — only on the secrecy of its keys.
- Security through obscurity is not security. Hiding the algorithm provides no durable protection.

### 1.7 Zero Trust Architecture
- Do not trust any request by default — regardless of whether it originates inside or outside the network perimeter.
- Authenticate and authorise every request, every time, at every layer.
- "Never trust, always verify."

---

## 2. Authentication

### 2.1 Never Roll Your Own Authentication
- Authentication is extraordinarily difficult to implement correctly.
- Use a battle-tested Identity Provider (IdP) or authentication library — Auth0, Okta, Keycloak, Cognito, Supabase Auth, etc.
- Bespoke authentication systems consistently have subtle, critical vulnerabilities.

### 2.2 Password Standards (NIST SP 800-63B)
- Minimum password length: **8 characters** (user-chosen); recommend **15+** for high-assurance accounts.
- **Do not require periodic password rotation** — it encourages predictable, weak passwords.
- **Do not impose arbitrary complexity rules** (must have a symbol, a number, etc.) — they reduce entropy.
- Check passwords against breached password databases (e.g. Have I Been Pwned) on registration and change.
- Allow all printable characters including spaces in passwords.

### 2.3 Password Storage
- **NEVER** store passwords in plaintext or with reversible encryption.
- **NEVER** use MD5, SHA-1, or unsalted SHA-256 for password hashing.
- **Use adaptive hashing algorithms**: Argon2id (preferred), bcrypt (cost ≥ 12), or scrypt.
- Use a unique per-user **salt** (handled automatically by the above algorithms).

```python
# ✅ Correct — using Argon2id
from argon2 import PasswordHasher
ph = PasswordHasher()
hash = ph.hash(password)       # Store this
ph.verify(hash, password)      # Returns True / raises VerifyMismatchError

# ❌ Never do this
import hashlib
hashlib.md5(password.encode()).hexdigest()  # VULNERABLE
```

### 2.4 Multi-Factor Authentication (MFA)
- Offer MFA for all user accounts. **Require** it for admin, privileged, and high-value accounts.
- Prefer TOTP (time-based one-time passwords, RFC 6238) over SMS-based OTPs.
- SMS OTPs are vulnerable to SIM-swapping attacks. Treat SMS MFA as better than nothing, but not best practice.
- Support passkeys (WebAuthn/FIDO2) as a strong alternative to passwords.

### 2.5 Account Lockout & Brute Force Protection
- Lock an account for a minimum of **5–15 minutes** after **5–10 consecutive failed authentication attempts**.
- Notify the account owner of failed attempts and lockout events by email.
- Implement **rate limiting** at the IP and account level for all authentication endpoints.
- Use CAPTCHA after a small number of failed attempts as an additional layer.
- Implement **progressive delays** on failed attempts (exponential backoff).

### 2.6 Credential Stuffing Mitigation
- Monitor for large-scale, distributed login attempts from many IPs.
- Alert on or block anomalous login patterns (e.g. 1000 unique accounts attempted in 1 minute).
- Use bot detection signals (device fingerprinting, behavioural analysis) on login pages.

### 2.7 Password Reset
- Password reset tokens must be **cryptographically random**, **single-use**, and **short-lived** (max 15–60 minutes).
- Send reset links to the verified email address — do not display the token in the response.
- Invalidate all active sessions when a password is changed.
- Do not reveal whether an email address is registered — return the same message regardless.

---

## 3. Authorisation & Access Control

### 3.1 Enforce Authorisation Server-Side, Always
- Never implement authorisation solely on the frontend — it can be trivially bypassed.
- Every server-side endpoint must independently verify that the authenticated user has permission to perform the requested operation on the requested resource.

### 3.2 Broken Object-Level Authorisation (BOLA / IDOR)
- The most common API vulnerability: a user can access another user's data by changing an ID in the request.
- Every data access query must scope results to the authenticated user's context.
  - ❌ `SELECT * FROM orders WHERE id = ?` (with user-supplied ID)
  - ✅ `SELECT * FROM orders WHERE id = ? AND user_id = ?` (scoped to current user)

### 3.3 Role-Based Access Control (RBAC)
- Define roles that represent business functions, not individuals.
- Roles contain permissions; users are assigned roles.
- Audit role assignments regularly — remove roles that are no longer needed.
- Never grant elevated roles indefinitely — use time-limited, just-in-time access for admin operations.

### 3.4 Attribute-Based Access Control (ABAC)
- For complex permission models, ABAC evaluates rules based on user attributes, resource attributes, and environment.
- Prefer ABAC when RBAC produces an explosion of overly specific roles.

### 3.5 Principle of Least Privilege in Code
```python
# ❌ Don't fetch everything and filter in application code
all_documents = Document.objects.all()
user_documents = [d for d in all_documents if d.owner_id == user.id]

# ✅ Filter at the query level — never load unauthorised data into memory
user_documents = Document.objects.filter(owner_id=user.id)
```

### 3.6 Insecure Direct Object References (IDOR)
- Use non-sequential, non-guessable identifiers (UUIDs v4) for user-facing resource IDs.
- Validate ownership/permission on every resource access, regardless of ID format.

### 3.7 Admin & Privileged Interfaces
- Admin interfaces must require re-authentication before sensitive operations (credential confirmation).
- Admin actions must be logged with actor identity, timestamp, and full action detail.
- Consider placing admin interfaces on a separate subdomain/path accessible only from trusted networks.

---

## 4. Input Validation & Sanitisation

### 4.1 Validate All Input at the Server
- All data entering the system from any external source must be validated: user input, API responses, file uploads, environment variables, config files.
- Client-side validation is a UX improvement, not a security control.

### 4.2 Validation Strategy
- **Allowlist (whitelist)**: Accept only known-good input. This is always preferable.
- **Denylist (blacklist)**: Block known-bad input. Incomplete by definition — attackers find bypasses.
- Validate type, length, format, and range for every input field.

### 4.3 Reject Unexpected Input
- If an endpoint expects 3 fields and receives 10, the extra 7 should be explicitly rejected or ignored — never silently processed.
- Mass assignment vulnerabilities arise from automatically binding request data to model objects without explicit field whitelisting.

### 4.4 File Upload Security
- Validate file type by inspecting the file's **magic bytes** (MIME type of content), not just the filename extension or the Content-Type header — both can be spoofed.
- Store uploaded files **outside the web root** — files stored inside the web root can be executed if the server is misconfigured.
- Rename uploaded files server-side — never trust or use the original filename.
- Scan uploaded files with antivirus/malware tooling before processing.
- Set a maximum file size and enforce it before processing begins.
- For image uploads: re-encode images server-side with a library like Pillow to strip embedded payloads.

### 4.5 Canonicalise Before Validating
- Normalise and canonicalise input before validating it to prevent bypass via encoding tricks.
- Decode URL encoding, HTML entities, and Unicode normalise before validation.
- Path traversal attacks (`../../../etc/passwd`) rely on the validator not resolving the canonical path.

---

## 5. Injection Attacks

### 5.1 SQL Injection — Zero Tolerance
- **All** database queries that incorporate external input must use **parameterised queries** (prepared statements).
- No exceptions. Not for search, not for ORDER BY, not for "simple" queries.

```python
# ❌ VULNERABLE — string interpolation into SQL
query = f"SELECT * FROM users WHERE email = '{user_input}'"

# ✅ SAFE — parameterised query
cursor.execute("SELECT * FROM users WHERE email = %s", (user_input,))

# ❌ VULNERABLE — dynamic ORDER BY (common bypass)
query = f"SELECT * FROM products ORDER BY {sort_column}"

# ✅ SAFE — whitelist the column name
ALLOWED_SORT_COLUMNS = {"name", "price", "created_at"}
if sort_column not in ALLOWED_SORT_COLUMNS:
    raise ValueError("Invalid sort column")
query = f"SELECT * FROM products ORDER BY {sort_column}"  # Now safe
```

### 5.2 Command Injection
- Never pass user input to OS shell commands.
- Avoid `os.system()`, `exec()`, `eval()`, `subprocess(shell=True)`.
- If shell execution is necessary, use argument arrays (not shell strings) and explicitly whitelist allowed values.

### 5.3 LDAP Injection
- Escape all user input before incorporating it into LDAP queries.
- Use the LDAP API's built-in parameterisation if available.

### 5.4 XML Injection / XXE (XML External Entities)
- Disable external entity processing in all XML parsers.
- Use JSON APIs instead of XML where possible.
- If XML is required, configure the parser with `resolve_entities=False` and `no_network=True`.

### 5.5 Template Injection (SSTI)
- Never pass user input directly into a server-side template rendering context.
- Use sandboxed template engines and disable execution of arbitrary expressions.

### 5.6 NoSQL Injection
- NoSQL databases are also injectable — validate and sanitise input for MongoDB, Redis, and others.
- MongoDB: avoid passing user-controlled objects directly as query operators; check for `$where`, `$gt`, `$regex` injection.

---

## 6. Cryptography

### 6.1 Use Established Algorithms Only
| Use Case | Recommended | Avoid |
|----------|-------------|-------|
| Symmetric encryption | AES-256-GCM | DES, 3DES, RC4, AES-ECB |
| Asymmetric encryption | RSA-OAEP (≥2048-bit), ECDSA P-256 | RSA PKCS#1 v1.5 padding |
| Hashing (data integrity) | SHA-256, SHA-3 | MD5, SHA-1 |
| Password hashing | Argon2id, bcrypt (≥12), scrypt | MD5, SHA-1, SHA-256 (unsalted) |
| Key exchange | ECDH, Diffie-Hellman (≥2048-bit) | Export-grade / short-key DH |
| Digital signatures | ECDSA, Ed25519, RSA-PSS | RSA PKCS#1 v1.5 |
| HMAC | HMAC-SHA-256 or better | HMAC-MD5, HMAC-SHA1 |

### 6.2 Never Roll Your Own Cryptography
- Cryptographic algorithms are extremely difficult to implement correctly.
- Subtle implementation errors (padding oracles, timing side-channels, nonce reuse) render correct-looking code completely insecure.
- Use `cryptography` (Python), `libsodium`/`nacl`, or the platform's built-in crypto libraries.

### 6.3 Key Management
- Encryption keys must never be hardcoded in source code.
- Store keys in a dedicated key management system: AWS KMS, Azure Key Vault, HashiCorp Vault, GCP Cloud KMS.
- Rotate encryption keys on a regular schedule and immediately upon any potential exposure.
- Keep the key separate from the data it encrypts — storing both together defeats the purpose.

### 6.4 Randomness
- Use cryptographically secure random number generators (CSPRNGs) for all security-sensitive purposes.
- ❌ `random.random()` (Python) — not cryptographically secure.
- ✅ `secrets.token_hex(32)` (Python) — cryptographically secure.
- ✅ `crypto.randomBytes(32)` (Node.js) — cryptographically secure.

### 6.5 Initialisation Vectors (IVs) & Nonces
- Never reuse an IV or nonce with the same key — this catastrophically breaks GCM and CTR modes.
- Generate IVs/nonces randomly and store them alongside the ciphertext.

---

## 7. Secrets & Credential Management

### 7.1 Never Commit Secrets to Version Control
- Credentials, API keys, tokens, private keys, database passwords must **never** appear in source code or commits.
- A committed secret is compromised — assume it even if the commit is immediately reverted (git history is retained).
- Use pre-commit hooks (`git-secrets`, `gitleaks`, `detect-secrets`) to prevent accidental commits.

### 7.2 Use Environment Variables or a Secrets Manager
- Load secrets from environment variables injected at runtime, or from a dedicated secrets manager.
- Preferred secrets managers: HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, GCP Secret Manager.
- Avoid `.env` files in production — they are config files, not secrets management.

### 7.3 Secret Rotation
- All secrets should be rotatable without downtime.
- Rotate secrets immediately upon any suspected or confirmed exposure.
- Automate rotation where the secrets manager supports it.

### 7.4 Scope Secrets Tightly
- Each service or environment should have its own set of secrets.
- Development credentials must never have production-level permissions.
- Principle of least privilege applies to secrets: each secret should grant access only to what the consumer needs.

### 7.5 Scan for Leaked Secrets
- Run secret scanning tools on all repositories continuously: `gitleaks`, `truffleHog`, `detect-secrets`.
- Enable GitHub/GitLab secret scanning if your code is hosted there.
- Set up alerts to notify when a secret is detected in a push.

---

## 8. Session Management

### 8.1 Secure Session Token Properties
- Session tokens must be **cryptographically random**, with at least **128 bits of entropy**.
- Use the session management provided by your framework — do not implement your own.
- Never encode user identity or privileges into the token in a way that can be decoded without server verification.

### 8.2 Token Storage (Browser)
| Storage | XSS Risk | CSRF Risk | Recommendation |
|---------|----------|-----------|----------------|
| `localStorage` | HIGH (accessible via JS) | Low | ❌ Not for auth tokens |
| `sessionStorage` | HIGH | Low | ❌ Not for auth tokens |
| `HttpOnly` Cookie | Low (not accessible via JS) | HIGH (sent automatically) | ✅ With CSRF protection |
| `HttpOnly` + `SameSite=Strict` Cookie | Low | Low | ✅ Best for most apps |

### 8.3 Cookie Security Attributes
All session/auth cookies must be set with:
- `HttpOnly` — prevents JavaScript access.
- `Secure` — only transmitted over HTTPS.
- `SameSite=Strict` or `SameSite=Lax` — mitigates CSRF.
- `Path=/` — scoped to the application.
- `Max-Age` / `Expires` — explicitly limit lifetime.

```http
Set-Cookie: session=<token>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600
```

### 8.4 Session Lifetime
- Sessions should expire after a period of **inactivity** (e.g. 15–30 minutes for sensitive applications, 1–7 days for lower-risk apps).
- Provide absolute session expiry in addition to idle expiry (e.g. max 24 hours regardless of activity).
- Sessions must be **immediately invalidated** on logout — server-side.

### 8.5 Session Fixation
- Regenerate the session ID on authentication (login, privilege escalation).
- Invalidate any pre-authentication session immediately upon login.

### 8.6 Concurrent Session Control
- For high-security applications, limit users to one active session.
- When a new session is created, invalidate all prior sessions for that user.
- Notify users when their session is terminated by a new login from another device.

---

## 9. API Security

### 9.1 Authenticate Every Endpoint
- Every API endpoint must require authentication unless explicitly public.
- Do not use API keys alone for user-facing endpoints — combine with user session tokens.

### 9.2 Use JWT Securely
- Always validate the **algorithm** — reject `alg: none` and unexpected algorithms.
- Verify the **signature** on every request — do not trust claims without verification.
- Validate **expiry** (`exp`), **issued-at** (`iat`), **audience** (`aud`), and **issuer** (`iss`).
- Keep JWTs short-lived (15–60 minutes for access tokens).
- Use refresh tokens with strict rotation and revocation lists.

```python
# ❌ Dangerous — no algorithm enforcement
decoded = jwt.decode(token, secret)

# ✅ Safe — explicit algorithm whitelist
decoded = jwt.decode(token, secret, algorithms=["HS256"])
```

### 9.3 Rate Limiting
- Rate-limit all API endpoints to prevent abuse, enumeration, and brute force.
- Apply limits at: the IP level, the user/account level, and the endpoint level.
- Return `429 Too Many Requests` with a `Retry-After` header.
- Implement graduated rate limits for authentication endpoints (stricter than general API).

### 9.4 CORS Policy
- Configure CORS to allow only explicitly trusted origins.
- Never use `Access-Control-Allow-Origin: *` for authenticated endpoints.
- Do not reflect the `Origin` header back without validation.

```http
# ✅ Specific origin
Access-Control-Allow-Origin: https://app.yourdomain.com

# ❌ Open to all origins (never for authenticated APIs)
Access-Control-Allow-Origin: *
```

### 9.5 CSRF Protection
- For cookie-based authentication, implement CSRF tokens or use `SameSite=Strict` cookies.
- CSRF tokens must be: per-session, unpredictable, validated server-side, and single-use for sensitive operations.
- JSON APIs that require `Content-Type: application/json` are naturally protected from simple CSRF (browsers cannot send cross-origin JSON with custom headers without a preflight check).

### 9.6 HTTP Security Headers
Every response should include:

| Header | Recommended Value | Purpose |
|--------|-------------------|---------|
| `Content-Security-Policy` | Restrictive policy | Prevent XSS, data injection |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Force HTTPS |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-Frame-Options` | `DENY` or `SAMEORIGIN` | Prevent clickjacking |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control referrer leakage |
| `Permissions-Policy` | Restrict unneeded browser features | Reduce attack surface |

### 9.7 API Versioning & Deprecation
- Version APIs from day one. Breaking changes must go in a new version.
- Deprecated versions must have a published sunset date and notify consumers.
- Maintain old versions long enough for consumers to migrate; log usage to track when it's safe to retire.

### 9.8 Mass Assignment Protection
- Never bind a request body directly to a model without explicit field whitelisting.
- Reject or ignore unexpected fields; never silently persist them.

---

## 10. Transport Layer Security

### 10.1 HTTPS Everywhere
- All communication, internal and external, must be encrypted in transit.
- Internal service-to-service communication is equally important — do not assume internal networks are safe.
- Redirect all HTTP requests to HTTPS at the application or CDN layer.

### 10.2 TLS Configuration
- Minimum TLS version: **TLS 1.2**. Prefer **TLS 1.3**.
- Disable SSL 2.0, SSL 3.0, TLS 1.0, and TLS 1.1 — they are cryptographically broken.
- Disable weak cipher suites. Use a tool like Mozilla SSL Config Generator for recommended configurations.
- Obtain an A or A+ rating on SSL Labs (ssllabs.com/ssltest).

### 10.3 Certificate Management
- Use certificates from a trusted Certificate Authority (Let's Encrypt for most cases; commercial CA for EV certificates if required).
- Automate certificate renewal — manual renewal is a reliability and security risk.
- Implement Certificate Transparency log monitoring to detect unauthorised certificates issued for your domains.
- Use HSTS Preloading for domains that are always HTTPS.

### 10.4 Certificate Pinning
- For mobile apps with high-security requirements, pin the certificate or public key.
- Pinning prevents MITM attacks using fraudulently issued certificates.
- Always include a backup pin and a pin rotation plan — mismanaged pinning causes outages.

---

## 11. Dependency & Supply Chain Security

### 11.1 Software Composition Analysis (SCA)
- Scan all dependencies for known vulnerabilities on every CI build.
- Tools: `npm audit`, `pip-audit`, Snyk, OWASP Dependency-Check, Trivy, Grype.
- Fail the build if critical or high-severity vulnerabilities are found in direct dependencies.

### 11.2 Pin Dependency Versions
- Lock files (`package-lock.json`, `poetry.lock`, `Pipfile.lock`, `go.sum`) must be committed to source control.
- Pin direct dependencies to exact versions in production. Use integrity hashes where supported.

### 11.3 Evaluate Dependencies Before Adding
- Check: last commit date, open issues, number of maintainers, download count, licence.
- A dependency with one maintainer, last updated 3 years ago, and 10 open security issues is a risk.
- Consider the transitive dependency tree — a small direct dependency may bring hundreds of transitive ones.

### 11.4 Typosquatting
- Verify the exact package name before installation — attackers publish packages with names one character different from popular ones.
- Use private registries or scoped packages for internal libraries.

### 11.5 CI/CD Pipeline Security
- The CI/CD pipeline is a high-value attack target — compromise it to deploy malicious code.
- Use short-lived, scoped credentials for all pipeline steps — never use long-lived root credentials.
- Pin GitHub Actions and other pipeline actions to a specific commit SHA, not a branch or tag.
- Run pipeline steps with the minimum permissions required (least privilege).
- Audit pipeline configuration changes as rigorously as application code.

---

## 12. Frontend Security

### 12.1 Cross-Site Scripting (XSS)
- XSS remains one of the most prevalent vulnerabilities. All user-generated content rendered in HTML must be escaped.
- Use a framework that auto-escapes by default (React, Vue, Angular) — do not bypass escaping with `dangerouslySetInnerHTML`, `v-html`, or `[innerHTML]` unless the content is sanitised.
- Sanitise HTML with a trusted library (DOMPurify) if you must render user-supplied HTML.

```javascript
// ❌ VULNERABLE — raw HTML injection
element.innerHTML = userSuppliedContent;
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ SAFE — textContent escapes automatically
element.textContent = userSuppliedContent;
// ✅ SAFE — JSX auto-escapes
<div>{userInput}</div>

// ✅ SAFE — sanitised HTML when HTML rendering is required
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### 12.2 Content Security Policy (CSP)
- Implement a strict CSP to constrain what the browser is allowed to execute.
- Avoid `unsafe-inline` and `unsafe-eval` — they negate the primary benefit of CSP.
- Use nonces or hashes for inline scripts that cannot be externalised.
- Use CSP report-only mode to test before enforcing.

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{random}'; style-src 'self' 'nonce-{random}'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
```

### 12.3 Sensitive Data in the Frontend
- Never store session tokens, credentials, or PII in `localStorage` or `sessionStorage` — they are accessible via XSS.
- Never embed API keys with backend-access scopes in frontend code — they will be extracted.
- Use HttpOnly cookies for authentication tokens.

### 12.4 Clickjacking
- Set `X-Frame-Options: DENY` or `Content-Security-Policy: frame-ancestors 'none'` to prevent your pages from being embedded in iframes on attacker-controlled pages.

### 12.5 Open Redirects
- Never redirect users to a URL taken directly from a request parameter without validating it.
- Validate redirect targets against an explicit allowlist of trusted domains.
- ❌ `redirect(request.params.next)` — can redirect to attacker's site
- ✅ Validate `next` is a relative path or a whitelisted domain.

### 12.6 Subresource Integrity (SRI)
- When loading scripts or stylesheets from CDNs, use SRI to verify the content has not been tampered with.

```html
<script src="https://cdn.example.com/lib.js"
        integrity="sha384-<hash>"
        crossorigin="anonymous"></script>
```

---

## 13. Database Security

### 13.1 Least-Privilege Database Accounts
- The application database user should have only the permissions it needs: typically `SELECT`, `INSERT`, `UPDATE`, `DELETE` on specific tables.
- Never connect the application to the database as `root` or a superuser.
- Create separate accounts for: the application, migrations, reporting, and admin operations.

### 13.2 Encrypt Sensitive Data at Rest
- Sensitive fields (SSNs, health records, payment data, tokens) must be encrypted at the column level, not just at the disk level.
- Use envelope encryption: encrypt the data with a data key; encrypt the data key with a key encryption key (KMS).
- Disk-level encryption alone (transparent data encryption) does not protect against database compromise.

### 13.3 Data Masking & Minimisation
- Do not store data you do not need — every field you store is a liability in a breach.
- Mask or truncate sensitive data in non-production environments.
- Tokenise payment card data — do not store raw card numbers; integrate with a PCI-compliant payment processor.

### 13.4 Database Network Exposure
- Databases must never be directly accessible from the public internet.
- Place databases in a private subnet with security groups/firewall rules allowing connections only from application servers.
- Access databases via a bastion host or VPN for administrative operations.

### 13.5 Audit Logging
- Enable database audit logging for all DDL operations (schema changes) and privileged DML (bulk deletes, updates).
- Log query execution for sensitive tables (users, payments) at the application layer if not at the DB layer.

---

## 14. Logging, Monitoring & Incident Response

### 14.1 Log Security Events
The following events must always be logged with timestamp, actor, IP, and outcome:
- Authentication attempts (success and failure).
- Authorisation failures.
- Password changes, MFA changes, and account lockouts.
- Admin actions.
- Data export or bulk access events.
- Input validation failures (especially repeated failures from the same source).

### 14.2 Never Log Sensitive Data
- Passwords, tokens, private keys, full credit card numbers, SSNs must never appear in logs.
- Mask or truncate PII in log output: `user email: j***@example.com`.
- Audit log pipelines to ensure sensitive data is not flowing into logging systems.

### 14.3 Protect Log Integrity
- Logs must be write-once and tamper-evident — they should not be modifiable by application code.
- Ship logs to a centralised, separate system immediately — local logs can be deleted in an attack.
- Use log aggregation platforms (ELK, Splunk, Datadog, CloudWatch) with access controls.

### 14.4 Monitor & Alert
- Alert on: authentication failure spikes, unusual data access volumes, new admin actions, deployment anomalies.
- Set up anomaly detection for user behaviour (login from new country, bulk data download).
- Every alert must have a defined response owner and response procedure.

### 14.5 Incident Response Plan
Define and rehearse:
1. **Detection** — How is a breach identified?
2. **Containment** — How is the affected system isolated?
3. **Eradication** — How is the attack vector closed?
4. **Recovery** — How is service safely restored?
5. **Post-mortem** — What happened and what controls prevent recurrence?
6. **Notification** — Who must be notified? (GDPR: 72 hours; PCI DSS; sector-specific requirements)

---

## 15. Infrastructure & Deployment Security

### 15.1 Infrastructure as Code (IaC) Security
- Scan IaC templates (Terraform, CloudFormation, Bicep) for misconfigurations: `tfsec`, `checkov`, `Trivy`.
- Common IaC misconfigurations: S3 buckets open to public, security groups with `0.0.0.0/0` on port 22, unencrypted storage.

### 15.2 Container Security
- Run containers as a non-root user.
- Use minimal base images (distroless, Alpine) to reduce the attack surface.
- Scan container images for vulnerabilities in the CI pipeline: Trivy, Grype, Snyk.
- Enforce read-only filesystems where possible.
- Never store secrets in Docker images or ENV instructions in Dockerfiles.

### 15.3 Secrets in Environment
- Use a secrets manager to inject secrets at runtime — not environment variables set at build time (they can end up in image layers).
- In Kubernetes: use Secrets (encrypted at rest in etcd), or CSI driver integration with a secrets manager.
- Rotate Kubernetes service account tokens regularly.

### 15.4 Network Segmentation
- Apply the principle of least privilege to network connectivity.
- Use security groups, NACLs, and Network Policies (Kubernetes) to enforce that services can only reach what they need.
- Implement a service mesh (Istio, Linkerd) for mutual TLS between microservices in zero-trust architectures.

### 15.5 Patch Management
- Apply operating system and runtime security patches on a regular cadence (weekly is a reasonable baseline; critical patches within 24–72 hours).
- Include base image updates in your CI/CD process — do not run containers built on 2-year-old base images.

---

## 16. OWASP Top 10 Reference

The OWASP Top 10 (2021) represents the most critical web application security risks:

| # | Risk | Key Mitigations |
|---|------|----------------|
| A01 | **Broken Access Control** | Enforce server-side authorisation; BOLA checks; least privilege |
| A02 | **Cryptographic Failures** | Use TLS everywhere; encrypt sensitive data at rest; use strong algorithms |
| A03 | **Injection** | Parameterised queries; input validation; escape all output |
| A04 | **Insecure Design** | Threat modelling; security requirements; secure design patterns |
| A05 | **Security Misconfiguration** | Harden defaults; disable debug in production; audit cloud configs |
| A06 | **Vulnerable Components** | SCA scanning; pin versions; update dependencies regularly |
| A07 | **Authentication Failures** | Strong passwords; MFA; account lockout; secure session management |
| A08 | **Software and Data Integrity Failures** | SRI; signed releases; verified CI/CD pipeline |
| A09 | **Logging and Monitoring Failures** | Log security events; centralise logs; alert on anomalies |
| A10 | **SSRF** (Server-Side Request Forgery) | Validate and restrict outbound URLs; network egress controls |

---

## 17. Security Checklists

### ✅ Authentication & Session Checklist
- [ ] Passwords hashed with Argon2id, bcrypt (≥12), or scrypt
- [ ] MFA available; required for privileged accounts
- [ ] Account lockout after 5–10 failed attempts
- [ ] Password reset tokens are random, single-use, and expire in ≤60 minutes
- [ ] Session tokens have ≥128 bits of entropy
- [ ] Session cookies set with `HttpOnly`, `Secure`, `SameSite=Strict`
- [ ] Sessions invalidated server-side on logout
- [ ] Session regenerated after successful login

### ✅ Input & Injection Checklist
- [ ] All database queries use parameterised statements
- [ ] No user input passed to OS shell commands
- [ ] File uploads validated by magic bytes, renamed, stored outside web root
- [ ] No direct object references without authorisation check (BOLA/IDOR)
- [ ] Mass assignment protection in place

### ✅ API Security Checklist
- [ ] Every endpoint requires authentication (or is explicitly public)
- [ ] Rate limiting on all endpoints (stricter on auth endpoints)
- [ ] CORS allows only explicitly trusted origins
- [ ] CSRF protection on cookie-authenticated endpoints
- [ ] All security headers present (CSP, HSTS, X-Content-Type-Options, etc.)
- [ ] JWT signature and claims validated on every request

### ✅ Cryptography & Secrets Checklist
- [ ] No secrets in source code or git history
- [ ] Secrets loaded from environment variables or a secrets manager
- [ ] TLS 1.2+ enforced; TLS 1.3 preferred
- [ ] All sensitive data encrypted at the column level in the database
- [ ] CSPRNGs used for all security-sensitive randomness

### ✅ Infrastructure & Deployment Checklist
- [ ] Dependency vulnerability scanning in CI pipeline
- [ ] Container images scanned for vulnerabilities
- [ ] IaC templates scanned for misconfigurations
- [ ] No database ports accessible from the public internet
- [ ] Least-privilege database user for the application
- [ ] All security events logged with actor, timestamp, and outcome

---

*Last updated: May 2026 | Sources include: OWASP Top 10 (2021), OWASP Application Security Verification Standard (ASVS) v4.0, NIST SP 800-63B, CWE/SANS Top 25, Google Application Security, and Mozilla Security Guidelines.*