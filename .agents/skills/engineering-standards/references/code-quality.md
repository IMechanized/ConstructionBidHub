# Code Quality Rules: A Comprehensive Reference

> *Clean code is not written by following a set of rules. You don't become a software craftsman by learning a list of heuristics. Professionalism and craftsmanship come from values that drive disciplines. — Robert C. Martin*

---

## Table of Contents

1. [Core Principles](#1-core-principles)
2. [Naming Conventions](#2-naming-conventions)
3. [Functions & Methods](#3-functions--methods)
4. [Classes & Modules](#4-classes--modules)
5. [Comments & Documentation](#5-comments--documentation)
6. [Error Handling](#6-error-handling)
7. [Code Structure & Organisation](#7-code-structure--organisation)
8. [Testing](#8-testing)
9. [Version Control & Git Hygiene](#9-version-control--git-hygiene)
10. [Dependency Management](#10-dependency-management)
11. [Performance & Efficiency](#11-performance--efficiency)
12. [Code Review Standards](#12-code-review-standards)
13. [Refactoring](#13-refactoring)
14. [Logging & Observability](#14-logging--observability)
15. [Database & Query Quality](#15-database--query-quality)
16. [Anti-Patterns to Avoid](#16-anti-patterns-to-avoid)
17. [Language-Agnostic Checklists](#17-language-agnostic-checklists)

---

## 1. Core Principles

### 1.1 DRY — Don't Repeat Yourself
- Every piece of knowledge must have a **single, unambiguous, authoritative representation** in the system.
- Duplication is the root cause of the vast majority of maintenance problems.
- Exception: duplication in tests is acceptable and often preferable over shared test utilities that obscure intent.

### 1.2 KISS — Keep It Simple, Stupid
- The simplest solution that meets the requirements is almost always the correct solution.
- Complexity is a cost. Every abstraction, pattern, and framework you add must justify that cost.
- When choosing between a clever solution and an obvious one, choose the obvious one.

### 1.3 YAGNI — You Aren't Gonna Need It
- Do not add functionality or abstractions until they are actually needed.
- Speculative generality creates dead code, complexity, and maintenance burden without delivering value.
- It is cheaper to add code later than to maintain unused code now.

### 1.4 SOLID Principles

| Principle | Statement |
|-----------|-----------|
| **S** — Single Responsibility | A class/module should have only one reason to change. |
| **O** — Open/Closed | Open for extension, closed for modification. |
| **L** — Liskov Substitution | Subtypes must be substitutable for their base types. |
| **I** — Interface Segregation | Clients should not depend on interfaces they do not use. |
| **D** — Dependency Inversion | Depend on abstractions, not concretions. |

### 1.5 The Boy Scout Rule
- Leave the code cleaner than you found it.
- Every commit should make the codebase incrementally better, even if only by renaming a variable.

### 1.6 The Principle of Least Astonishment
- Code should behave in the way that least surprises a reader familiar with the domain.
- Surprising behaviour should be loudly commented with a clear explanation.

### 1.7 Readability Over Cleverness
- Code is read far more often than it is written.
- Optimise for the next reader, not the current writer.
- If you need a comment to explain *what* the code does, rewrite the code. If you need a comment to explain *why*, that comment is valuable.

---

## 2. Naming Conventions

Good names are the most powerful tool for communicating intent.

### 2.1 Use Intention-Revealing Names
- A name should answer: Why does it exist? What does it do? How is it used?
- ❌ `int d;` — elapsed time in days
- ✅ `int elapsedDaysInPeriod;`

### 2.2 Avoid Abbreviations
- Unless an abbreviation is universally understood within the domain (e.g. `url`, `id`, `i` in loops), spell it out.
- ❌ `usrActLog` ✅ `userActivityLog`

### 2.3 Use Pronounceable Names
- Names you cannot pronounce cannot be discussed in code reviews or team conversations.
- ❌ `genymdhms` ✅ `generationTimestamp`

### 2.4 Use Searchable Names
- Single-letter names and numeric literals are impossible to grep for.
- Define constants for all magic numbers and magic strings.
- ❌ `if (status == 7)` ✅ `if (status == ORDER_SHIPPED)`

### 2.5 Naming by Type

| Element | Convention (most languages) | Example |
|---------|---------------------------|---------|
| Variable | `camelCase` | `userProfile` |
| Constant | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| Function/Method | `camelCase` / `snake_case` | `calculateTotal()` |
| Class | `PascalCase` | `OrderProcessor` |
| Interface | `PascalCase` or `IPascalCase` | `IRepository` |
| File | `kebab-case` or `snake_case` | `order-processor.ts` |
| Boolean | Prefixed with `is`, `has`, `can`, `should` | `isActive`, `hasPermission` |

### 2.6 Avoid Noise Words
- Words like `Data`, `Info`, `Manager`, `Handler`, `Processor`, `Object` are often meaningless filler.
- ❌ `UserDataManager` — what does it manage? ✅ `UserRepository`, `UserService`

### 2.7 Use Domain Language
- Name things using the vocabulary of the business domain, not the vocabulary of the implementation.
- Code that uses domain language is immediately meaningful to domain experts and new developers alike.

---

## 3. Functions & Methods

### 3.1 Do One Thing
- A function should do one thing, do it well, and do it only.
- If a function does A, then B, then C — it should probably be three functions.
- **Litmus test**: Can you describe the function's purpose in one simple sentence without using "and" or "or"?

### 3.2 Keep Functions Short
- Ideal function length: **5–15 lines** for most cases.
- Hard limit guideline: functions exceeding **30 lines** almost always have more than one responsibility.
- Short functions are easier to name, test, and reason about.

### 3.3 One Level of Abstraction per Function
- Do not mix high-level orchestration (`processOrder()`) with low-level implementation (`trim string, format date`) in the same function.
- Functions at the same level should operate at the same level of abstraction.

### 3.4 Function Arguments
- Ideal: **0–2 arguments** (niladic or dyadic).
- 3 arguments (triadic): acceptable with justification.
- 4+ arguments: consider grouping into a parameter object.
- Boolean flag arguments are a code smell — they signal the function does two things.
  - ❌ `render(page, true)` ✅ `renderWithBorder(page)` / `renderWithoutBorder(page)`

### 3.5 Command-Query Separation
- A function should either **change state** (command) OR **return a value** (query) — never both.
- Functions that both mutate and return are unpredictable and difficult to test.

### 3.6 No Side Effects
- A function's effects on program state should be exactly and only what its name implies.
- Side effects are one of the most common sources of bugs that are hard to reproduce.

### 3.7 Avoid Output Arguments
- If a function must change the state of something, it should change the state of its owning object.
- ❌ `appendFooter(report)` ✅ `report.appendFooter()`

### 3.8 Don't Repeat Control Flow
- Avoid nested `if`/`else` chains deeper than 2 levels.
- Use guard clauses (early returns) to eliminate deep nesting.

```python
# ❌ Deeply nested
def process(order):
    if order is not None:
        if order.is_valid():
            if order.has_items():
                # ... logic here

# ✅ Guard clauses
def process(order):
    if order is None:
        raise ValueError("Order cannot be None")
    if not order.is_valid():
        raise InvalidOrderError("Order failed validation")
    if not order.has_items():
        raise EmptyOrderError("Order has no items")
    # ... logic here
```

---

## 4. Classes & Modules

### 4.1 Small, Focused Classes
- A class should have one reason to change (Single Responsibility Principle).
- Ideal class: fewer than **200 lines**, fewer than **10 public methods**.
- Classes with many instance variables or many methods are usually trying to do too much.

### 4.2 Cohesion
- The methods of a class should operate on the instance variables of the class.
- High cohesion = the class's methods and variables belong together.
- Low cohesion is a signal that a class should be split.

### 4.3 Favour Composition Over Inheritance
- Inheritance creates tight coupling between base and derived classes.
- Use inheritance for true is-a relationships. Use composition for has-a or uses-a.
- Deep inheritance hierarchies (>2–3 levels) are almost always a design mistake.

### 4.4 Depend on Abstractions
- High-level modules should not depend on low-level modules. Both should depend on abstractions.
- Inject dependencies rather than instantiating them inside a class — this enables testing and flexibility.

### 4.5 Law of Demeter
- A method should only call methods on: itself, its parameters, objects it creates, its direct components.
- ❌ `customer.getWallet().getCard().charge(amount)`
- ✅ `customer.pay(amount)` — let the object navigate its own relationships.

### 4.6 Module Boundaries
- Modules should have a clear, documented public API.
- Internal implementation details must not leak through the public API.
- Each module should own and encapsulate its data — avoid reaching into another module's internals.

---

## 5. Comments & Documentation

### 5.1 Comments Are a Last Resort
- A comment is a failure to express intent in code.
- Before writing a comment, try to refactor the code to make the comment unnecessary.
- Good code with no comments is preferable to bad code with many comments.

### 5.2 Comments That Add Value
These comment types are always justified:
- **Legal comments** — copyright, licence notices.
- **Intent comments** — explaining *why* a non-obvious decision was made.
- **Warning comments** — flagging consequences: `// WARNING: This function is not thread-safe.`
- **TODO comments** — with a specific task and owner: `// TODO(shaun): Replace with streaming API once v2 is stable.`
- **Clarification** — explaining an obscure algorithm or a counter-intuitive library behaviour.

### 5.3 Comments to Avoid
- **Redundant comments** that restate what the code clearly says.
- **Misleading comments** that describe behaviour the code no longer has.
- **Noise comments** — auto-generated boilerplate, changelog comments in source files.
- **Commented-out code** — delete it; version control preserves history.
- **Closing brace comments** — `} // end for` — if you need these, the block is too long.

### 5.4 Documentation Standards
- All public APIs (functions, classes, modules) must have documentation comments.
- Documentation should cover: **purpose**, **parameters** (type + semantics), **return value**, and **exceptions thrown**.
- Keep documentation co-located with the code — external documents drift out of sync.

### 5.5 README Standards
Every repository must have a README containing:
1. Project name and one-sentence description.
2. How to install and run locally (step-by-step).
3. How to run the tests.
4. Architecture overview (or link to ADR/docs).
5. How to contribute.
6. Licence.

---

## 6. Error Handling

### 6.1 Use Exceptions, Not Return Codes
- Error return codes clutter call sites and are easily ignored.
- Exceptions separate the happy path from error handling, improving readability.
- Checked/unchecked exception strategy should be consistent across the codebase.

### 6.2 Fail Fast and Loud
- Detect errors at the earliest possible point.
- Silent failures (swallowing exceptions, returning null from failed operations) are the most dangerous bugs — they corrupt state silently.
- An explicit crash with a clear message is always preferable to corrupt silent execution.

### 6.3 Don't Return Null
- Returning `null` forces every caller to check for it, or risk a null pointer exception.
- Prefer: returning an empty collection, using an Option/Maybe type, throwing an exception, or using the Null Object pattern.

### 6.4 Don't Pass Null
- Passing `null` as a function argument is as dangerous as returning it.
- Functions should not accept `null` unless the type system or documentation explicitly states it as valid.

### 6.5 Exception Specificity
- Catch the most specific exception type possible.
- ❌ `catch (Exception e)` — catches everything including bugs you want to propagate.
- ✅ `catch (DatabaseConnectionException e)` — targeted, intentional.

### 6.6 Include Context in Errors
- Every exception should carry enough context to diagnose the problem without a debugger.
- Include: what operation failed, what input caused it, and what state the system was in.
- ❌ `raise ValueError("Invalid value")`
- ✅ `raise ValueError(f"Order amount must be positive; received {amount} for order {order_id}")`

### 6.7 Clean Up After Yourself
- Use `try/finally`, `with` statements, or RAII patterns to guarantee resource cleanup.
- Never leave database connections, file handles, or network sockets open in error paths.

---

## 7. Code Structure & Organisation

### 7.1 Vertical Density
- Lines of code that are related should appear vertically close together.
- Lines of code that are conceptually separate should be separated by a blank line.

### 7.2 The Newspaper Metaphor
- Source files should read like a newspaper: the most important, high-level concepts at the top; detail fills in further down.
- Public methods before private, high-level orchestration before low-level implementation.

### 7.3 File Length
- A single file should represent a single concept.
- Guideline: files over **500 lines** are candidates for splitting.
- Files over **1000 lines** almost always need to be split.

### 7.4 Horizontal Formatting
- Line length limit: **100–120 characters** (project-consistent).
- Never sacrifice clarity for a shorter line, but never let lines exceed the limit for brevity.
- Do not align variable declarations horizontally — it creates noisy diffs when you add a longer name.

### 7.5 Indentation and Whitespace
- Use the project-configured indentation (tabs vs. spaces, width). It must be enforced by a formatter (Prettier, Black, gofmt).
- Blank lines should separate logical sections within a function; more than one blank line is rarely needed.

### 7.6 Dependency Direction
- Dependencies should flow in one direction: from outer layers (UI, API) inward (domain, data).
- The domain layer should have no knowledge of the infrastructure layer.
- Violations of dependency direction are architectural debt — address them in the next sprint.

---

## 8. Testing

### 8.1 The Testing Pyramid

```
        /\
       /  \
      / E2E \        ← Few (slow, expensive, brittle)
     /--------\
    /Integration\    ← Some (moderate cost)
   /------------\
  /  Unit Tests  \   ← Many (fast, cheap, isolated)
 /________________\
```

- The base of the pyramid (unit tests) should be the largest investment.
- Invert the pyramid and you get a slow, brittle, expensive test suite.

### 8.2 F.I.R.S.T. Properties of Good Tests

| Property | Meaning |
|----------|---------|
| **Fast** | Unit tests must run in milliseconds. A slow test suite is not run. |
| **Independent** | Tests must not depend on each other or shared mutable state. |
| **Repeatable** | Tests must produce the same result on every machine, every time. |
| **Self-Validating** | Tests either pass or fail — they must not require manual inspection. |
| **Timely** | Tests should be written alongside (or before) the production code they test. |

### 8.3 Test-Driven Development (TDD)
- The TDD cycle: **Red → Green → Refactor**.
  1. Write a failing test that specifies the desired behaviour.
  2. Write the minimum production code to make it pass.
  3. Refactor both test and production code while keeping tests green.
- TDD produces better-designed, more testable code — the tests act as the first client.

### 8.4 One Assert per Test
- Each test should verify one specific behaviour.
- Multiple assertions in one test make it harder to identify which behaviour failed.
- A descriptive test name makes the failure immediately diagnostic.

### 8.5 Given/When/Then Structure
Every test should have three clear sections:
```python
def test_order_total_includes_tax():
    # Given
    order = Order(items=[Item("widget", price=100)])
    tax_rate = 0.20

    # When
    total = order.calculate_total(tax_rate)

    # Then
    assert total == 120
```

### 8.6 Test Behaviour, Not Implementation
- Tests that assert on internal state or private methods are brittle — they break on every refactor.
- Test the contract (inputs, outputs, side effects) not the mechanism.

### 8.7 Code Coverage
- Aim for **80–90% line coverage** as a floor, not a ceiling.
- 100% coverage does not mean bug-free. Coverage measures execution, not correctness.
- Focus coverage efforts on critical paths, complex logic, and edge cases — not boilerplate.

### 8.8 Test Data
- Use factories or builders for test data — avoid hardcoded literals scattered across test files.
- Minimal test data: set up only what the test actually needs.
- Do not share mutable test data between tests.

---

## 9. Version Control & Git Hygiene

### 9.1 Commit Often, Commit Small
- Each commit should represent one logical change.
- Small commits are easy to review, revert, and cherry-pick.
- The commit history is a narrative of how the software evolved — make it readable.

### 9.2 Write Meaningful Commit Messages
Follow the **Conventional Commits** format or an equivalent agreed standard:

```
<type>(<scope>): <imperative subject, ≤72 chars>

[Optional body: explain WHY, not what]

[Optional footer: BREAKING CHANGE, closes #issue]
```

**Types**: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`

Examples:
- ✅ `feat(auth): add OAuth2 login with Google`
- ✅ `fix(orders): prevent duplicate submission on slow network`
- ❌ `fixed stuff`
- ❌ `WIP`

### 9.3 Branch Strategy
- Use a consistent branching strategy: GitFlow, trunk-based development, or GitHub Flow.
- Feature branches should be short-lived (hours to days, not weeks).
- Long-lived feature branches accumulate merge conflicts and diverge from main.

### 9.4 Never Commit
- Secrets, API keys, or credentials of any kind.
- Build artefacts or generated files (unless intentional as releases).
- Large binary files without Git LFS.
- Personal IDE configuration files (`.vscode/settings.json`, `.idea/`).

### 9.5 Pull Request Standards
Every PR must have:
- A clear description of what changed and why.
- A link to the related issue/ticket.
- All CI checks passing before review.
- At least one approving review before merge.

### 9.6 Rebase or Merge?
- Use **squash merge** for feature branches to keep the main branch history linear and clean.
- Use **merge commits** for release branches to preserve history.
- Never rebase a shared/public branch.

---

## 10. Dependency Management

### 10.1 Minimise Dependencies
- Every dependency is a security surface, a maintenance burden, and a supply chain risk.
- Before adding a dependency, ask: Can this be implemented in <100 lines? Is it worth the cost?
- Prefer well-maintained, widely-adopted libraries with active communities.

### 10.2 Pin Exact Versions in Production
- Use exact version pinning (`== 1.2.3`) in production lockfiles.
- Use range constraints (`^1.2.0`) in library manifests to allow consumers flexibility.
- Never rely on `latest` or `*` in production.

### 10.3 Audit Regularly
- Run dependency vulnerability audits on every CI build (`npm audit`, `pip-audit`, `trivy`).
- Review and update dependencies on a regular cadence (monthly is a reasonable default).
- Set up automated dependency update PRs (Dependabot, Renovate).

### 10.4 Licence Compliance
- Audit dependency licences before production use.
- GPL-licensed dependencies can impose licence obligations on your codebase.
- Maintain a bill of materials (SBOM) for regulated environments.

---

## 11. Performance & Efficiency

### 11.1 Measure Before Optimising
- Premature optimisation is the root of all evil. — Donald Knuth
- Profile first. Fix only what the data shows is a bottleneck.
- Micro-optimisations at the expense of readability are almost never justified.

### 11.2 Algorithmic Complexity First
- A O(n²) algorithm is a performance problem at any constant. An O(n log n) algorithm is fast at almost any constant.
- Know the Big O of your critical paths. Prioritise better algorithms over micro-optimisations.

### 11.3 Cache Strategically
- Cache the results of expensive, idempotent computations.
- Define cache invalidation strategy before implementing the cache.
- Document cache TTLs, eviction policies, and cache key structure explicitly.

### 11.4 Lazy Loading
- Defer expensive initialisation until it is actually needed.
- Load data in pages/chunks, not all at once.

### 11.5 Database Performance
- Use indexes on all columns used in `WHERE`, `JOIN`, and `ORDER BY` clauses.
- Avoid N+1 query problems — use eager loading or batching.
- Never `SELECT *` in production queries — specify only required columns.
- Add `EXPLAIN`/`EXPLAIN ANALYZE` to your review process for any new complex query.

---

## 12. Code Review Standards

### 12.1 What to Review
- **Correctness**: Does the code do what it claims?
- **Clarity**: Is the intent immediately obvious?
- **Test coverage**: Are the critical paths and edge cases tested?
- **Design**: Does the change fit the architecture? Does it create technical debt?
- **Security**: Does the change introduce any vulnerabilities?
- **Performance**: Are there obvious algorithmic or resource concerns?

### 12.2 How to Give Review Feedback
- Be specific — reference the exact line and explain the concern clearly.
- Distinguish between blocking issues and suggestions:
  - `BLOCKER:` — must be resolved before merge.
  - `SUGGESTION:` — optional improvement.
  - `NIT:` — trivial style issue (non-blocking).
- Critique the code, never the author.
- If you suggest a change, also suggest the alternative.

### 12.3 How to Receive Review Feedback
- Code review is collaborative, not adversarial — every comment is an opportunity to improve.
- Respond to every comment: either fix it, or explain why you disagree.
- If you disagree with feedback, discuss it professionally — don't silently ignore it.

### 12.4 Review Size
- Keep PRs small: aim for under **400 lines changed** per review.
- Large PRs receive worse reviews — reviewers lose focus and miss issues.
- If a feature requires more changes, split it into logically independent PRs.

---

## 13. Refactoring

### 13.1 When to Refactor
- When adding a feature is made harder by the current design.
- When a bug is caused by poor structure, not just a typo.
- When code review feedback reveals a design smell.
- When you understand the domain better now than when the code was written.

### 13.2 Refactoring vs. Rewriting
- Refactor incrementally — small, safe, test-backed changes.
- Rewrites are expensive, high-risk, and often reproduce the same mistakes with new syntax.
- Prefer the Strangler Fig pattern for large-scale architectural changes.

### 13.3 The Four Rules of Simple Design (Kent Beck)
In priority order, a design is simple when it:
1. **Passes all the tests** — it works.
2. **Reveals its intent** — it communicates what it does clearly.
3. **Has no duplication** — DRY.
4. **Has the fewest elements** — YAGNI; nothing unnecessary.

### 13.4 Common Refactoring Techniques
| Smell | Technique |
|-------|-----------|
| Long function | Extract Method |
| Long parameter list | Introduce Parameter Object |
| Duplicate code | Extract Method / Pull Up Method |
| Large class | Extract Class |
| Feature Envy (method uses another class's data excessively) | Move Method |
| Magic numbers | Introduce Constant |
| Nested conditionals | Replace Nested Conditional with Guard Clauses |
| Primitive obsession | Introduce Value Object |

---

## 14. Logging & Observability

### 14.1 Log Levels — Use Them Correctly

| Level | When to Use |
|-------|------------|
| `DEBUG` | Detailed diagnostic information. Off in production. |
| `INFO` | Normal application lifecycle events (startup, shutdown, major state transitions). |
| `WARNING` | Unexpected but recoverable situations that warrant attention. |
| `ERROR` | Errors that caused an operation to fail. Requires investigation. |
| `CRITICAL` | System-level failures requiring immediate response. |

### 14.2 What to Log
- Every significant state transition in a business process.
- All external API calls (request summary + response status, never body in production).
- All errors and exceptions (with full stack trace).
- Performance metrics for critical paths (query time, API latency).

### 14.3 What Not to Log
- Passwords, tokens, or credentials — ever.
- Personally Identifiable Information (PII) — unless mandated and protected.
- Full request/response bodies containing sensitive data.
- Excessive DEBUG logs in production — log volume costs money and obscures signals.

### 14.4 Structured Logging
- Log as structured data (JSON) rather than free-form strings — enables querying, filtering, and alerting.
- Include consistent fields: `timestamp`, `level`, `service`, `trace_id`, `user_id`, `message`.
- Trace IDs must propagate across service boundaries (distributed tracing).

### 14.5 Alerts, Not Logs
- Logs are for investigation. Alerts are for action.
- Define alert thresholds for: error rate spikes, latency degradation, resource exhaustion.
- Alert fatigue kills operational effectiveness — every alert must be actionable.

---

## 15. Database & Query Quality

### 15.1 Never Trust Input in Queries
- All user input in SQL queries must be parameterised — no exceptions.
- String interpolation in SQL is a SQL injection vulnerability.

### 15.2 Migration Standards
- Every schema change must be versioned and tracked in a migration file.
- Migrations must be reversible (up and down).
- Never modify an existing migration that has been applied to production.
- Test migrations on a copy of production data before deploying.

### 15.3 Transaction Boundaries
- Wrap all operations that must succeed or fail together in a transaction.
- Keep transactions as short as possible — long-running transactions cause lock contention.
- Never perform external I/O (API calls, file writes) inside a database transaction.

### 15.4 Data Integrity at the Database Layer
- Enforce constraints at the database level (NOT NULL, UNIQUE, FOREIGN KEY, CHECK).
- Application-layer validation is not a substitute for database constraints — both are needed.

### 15.5 Schema Documentation
- Document each table's purpose and each column's meaning if it is not obvious.
- Document denormalisation decisions explicitly — they will confuse future developers without context.

---

## 16. Anti-Patterns to Avoid

| Anti-Pattern | Description | Remedy |
|--------------|-------------|--------|
| **God Object** | One class knows too much and does too much | Split using SRP; extract domain objects |
| **Spaghetti Code** | Control flow jumps around unpredictably | Refactor to smaller, well-named functions |
| **Magic Numbers/Strings** | Raw literals without semantic meaning | Extract as named constants |
| **Copy-Paste Programming** | Duplicated logic with slight variations | Extract shared function; parameterise differences |
| **Shotgun Surgery** | A single change requires modifications in many unrelated places | Consolidate related logic; reduce coupling |
| **Feature Envy** | A method is more interested in data of another class than its own | Move the method closer to the data it uses |
| **Primitive Obsession** | Using primitives (string, int) instead of small domain objects | Introduce Value Objects |
| **Stringly Typed** | Using strings to represent enumerations or structured data | Use enums or typed objects |
| **Cargo Cult Patterns** | Applying patterns without understanding why | Understand the problem a pattern solves before using it |
| **Lava Flow** | Dead code / old designs that nobody dares remove | Delete it; version control preserves history |
| **Silver Bullet** | Applying one pattern or technology to every problem | Choose the right tool; resist over-engineering |
| **Action at a Distance** | A change in one part of the system unexpectedly affects another | Reduce global state; make dependencies explicit |
| **Boat Anchor** | Keeping code for future use that never comes | YAGNI; delete it now |
| **Reinventing the Wheel** | Building custom solutions for solved problems | Use a well-maintained library |

---

## 17. Language-Agnostic Checklists

### ✅ Code Authoring Checklist
- [ ] Every function/method does one thing
- [ ] No function exceeds 30 lines
- [ ] All names are intention-revealing and pronounceable
- [ ] No magic numbers or magic strings in logic
- [ ] No commented-out code
- [ ] Guard clauses used to avoid deep nesting (max 2–3 levels)
- [ ] All errors are handled explicitly — no silent swallowing
- [ ] No null returned from functions (unless null is domain-valid)
- [ ] All public APIs are documented
- [ ] No dead code

### ✅ Testing Checklist
- [ ] New logic has corresponding unit tests
- [ ] Tests follow Given/When/Then structure
- [ ] Tests are independent (no shared mutable state)
- [ ] No production code changes that weren't driven by a failing test (TDD)
- [ ] Critical paths have integration tests
- [ ] Edge cases are explicitly tested
- [ ] Test names describe the scenario, not the implementation

### ✅ Pull Request Checklist
- [ ] PR description explains what changed and why
- [ ] PR is linked to a ticket/issue
- [ ] All CI checks pass
- [ ] No secrets or credentials in diff
- [ ] No debug/temporary code left in
- [ ] New dependencies are justified in the PR description
- [ ] Migrations tested on a production data copy (if applicable)

---

*Last updated: May 2026 | Sources include: Clean Code (Robert C. Martin), The Pragmatic Programmer (Hunt & Thomas), Refactoring (Martin Fowler), Google Engineering Practices, and The Twelve-Factor App methodology.*