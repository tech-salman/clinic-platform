# Vibe Coding Master Rules (`rules.md`)

> Drop this file into your project root and reference it in `CLAUDE.md`, `GEMINI.md`, or `.cursorrules`.
> Covers all 140 core engineering, prompting, UX, security, and operational standards.

---

## 1. Context, Scope & Planning
- **Plan First:** Always output a numbered checklist of assumptions, trade-offs, and a step-by-step plan before modifying any files (#4, #14, #19).
- **Exact I/O & Criteria:** Confirm the exact target stack, runtime, inputs, actions, outputs, and acceptance criteria before scaffolding (#1, #8, #16).
- **Vertical Slices:** Break large features into small, independently testable vertical slices (#9, #22).
- **Strict Scope Control:** Touch only files directly required for the task. Never refactor unrelated code, rename exports, or alter public function signatures unless explicitly instructed (#5, #13, #18).
- **Context Hygiene:** Keep rule files lean, current, and version-controlled. Prompt the user to reset context when switching between research, planning, and distinct features (#2, #3, #10, #15, #20).
- **Grounded Examples:** Match existing codebase patterns, pinned library versions, and sample schemas/JSON payloads rather than inventing abstractions (#6, #11, #17).

## 2. Architecture & Code Quality
- **Clean Boundaries:** Separate UI, business logic, and data access into modular, single-purpose files (#23, #24).
- **Boring, Proven Tech:** Favor standard, well-documented frameworks and patterns over premature microservices or over-engineered state machines (#25, #26).
- **Data Ownership & Schemas:** Define source-of-truth tables, user roles, permissions, and plain-language data schemas before building features (#31, #35, #36).
- **No Hardcoding:** Store all secrets and environment configs in `.env` variables. Extract magic numbers and thresholds into named constants or config files (#32, #39).
- **Decoupled Integrations:** Wrap third-party AI providers and external APIs behind clean interfaces (#33).
- **Idempotency & Queues:** Keep webhook handlers thin, queue heavy background jobs, and ensure APIs/webhooks handle retries and out-of-order events idempotently (#29, #37, #91, #104).
- **Resilience & Rollbacks:** Design explicit error types (never swallow exceptions silently), implement timeouts/retries for network calls, gate risky features behind flags, and provide undo or soft-delete paths for destructive actions (#28, #34, #38, #40).
- **Structured AI Pipelines:** Enforce strict JSON/structured output schemas whenever wiring LLMs into workflows or automations (#118).

## 3. UI/UX, Polish & Taste
- **Intentional Design:** Avoid generic boilerplate defaults. Standardize spacing, typography hierarchy, icon sets, and button variants (#41, #42, #53).
- **Absorb Complexity:** Follow Tesler's Law—handle edge cases and smart defaults in the system rather than burdening the user (#44).
- **Clear Navigation & CTAs:** Keep navigation intuitive, primary CTAs distinct, forms short with inline validation, and remove all dead buttons or placeholder copy (#43, #51, #54, #56).
- **Complete UI States:** Always implement loading skeletons/spinners (preventing layout shifts), clear empty states with next-step guidance, and human-readable error messages (#7, #47, #48, #52, #58).
- **Safe Destructive Flows:** Require explicit user confirmation before irreversible deletes or resets (#59).
- **Responsive & Accessible:** Ensure layouts work cleanly on mobile and desktop viewports, handle long text/names gracefully, support keyboard focus navigation, and meet WCAG 2.1 contrast basics (#46, #49, #50, #57, #60).
- **Outcome-Driven Onboarding:** Focus initial user flows on immediate value rather than feature tours (#45).

## 4. Debugging, Verification & Doom-Loop Prevention
- **Diagnose Before Fixing:** Separate root-cause diagnosis from applying a patch. Require reproducible steps and verbatim logs before changing code (#12, #61, #66, #67, #68).
- **Two-Strike Rule:** If a fix fails twice on the same bug, stop immediately, revert to a clean commit, and propose an alternative approach or model (#65, #76, #110).
- **Diff & Dependency Discipline:** Keep changes small and reviewable. Never silently delete existing logic or bump dependencies without explicit approval (#62, #63, #74, #115).
- **Mandatory Checks:** Run typechecks, linters, formatting hooks, and unit/smoke tests after every change (#64, #111, #112).
- **Boundary & Environment Testing:** Test empty strings, huge payloads, invalid dates, timezone/locale edge cases, slow connections, cold starts, database migrations (up and clean), and API status codes (#69, #70, #71, #77, #78, #79).
- **Clean Fixtures:** Maintain isolated test/dev data and resettable test fixtures separate from production (#27, #80).

## 5. Security, Data & Reliability
- **Zero Client Secrets:** Never expose private keys, tokens, or service-role credentials in client bundles or logs (#81, #85, #98).
- **Server-Side Auth Everywhere:** Enforce authentication and role-based authorization on every server read, update, and delete endpoint—never rely on UI hiding (#72, #82, #97).
- **Input & Perimeter Hardening:** Validate and sanitize all user inputs and webhook signatures. Enforce request size limits, rate limiting, strict CORS policies, and protections against SQL/NoSQL injection, XSS, and CSRF (#83, #84, #88, #94, #99).
- **Data Lifecycle & Backups:** Define account data retention/deletion rules, configure automated restorable database backups, and verify restore procedures (#86, #87, #92).
- **Observability & Cost Guards:** Log key events and errors with correlation IDs, expose health endpoints with auto-restart policies, monitor token/cloud spend with budget alerts, and scan dependencies for vulnerabilities (#89, #90, #93, #100).

## 6. Workflows, Multi-Agent & Shipping
- **Parallel Agent Safety:** Only run concurrent agents on isolated git worktrees/branches and non-overlapping files; review merged diffs carefully (#75, #105, #106, #120).
- **Automation & Runbooks:** Script repeatable local setup, background process management, webhook tunnels, and deployment checks; document start/restart/incident runbooks (#95, #101, #102, #103, #113, #116, #117, #119).
- **Codebase Hygiene:** Prune dead code, unused packages, and stale branches regularly, and maintain a concise README and changelog (#114, #126, #139).
- **Ship & Iterate:** Ship a working v1 to a live URL early, instrument core activation/drop-off analytics, verify offline/graceful degradation, and keep v1.1 scope tight (#121, #122, #124, #129, #133, #138).
- **Human-in-the-Loop Mastery:** Never merge code you cannot explain. Inspect generated SQL/regex/logic, test flows manually in the browser, observe real users, and refine this playbook monthly (#55, #73, #130, #131, #132, #135, #140).

---


Prompting & Context Engineering

1. State the exact input, action, and output before writing code
2. Keep context files like CLAUDE.md, GEMINI.md, or .cursorrules lean and current
3. Reset context between distinct features to prevent drift
4. Ask for a plan before letting the agent edit files
5. Define explicit off-limits files and modules in every prompt
6. Provide a working example file instead of abstract descriptions
7. Specify exact UI states, edge cases, and empty states up front
8. Set clear success criteria and acceptance checks per task
9. Break large features into small, testable vertical slices
10. Use separate sessions for research, planning, and implementation
11. Pin exact library versions and API shapes when known
12. Include error logs and reproduction steps verbatim when debugging
13. Constrain scope so the AI does not refactor unrelated code
14. Ask the AI to explain trade-offs before picking a pattern
15. Version-control your prompt templates and agent rules
16. State the exact target stack and runtime before asking for scaffolding
17. Give concrete sample JSON payloads or schemas in your prompt
18. Explicitly forbid changing public function signatures unless requested
19. Ask for a numbered checklist of assumptions before implementation
20. Trim stale instructions from agent rule files as architecture evolves

Architecture & Project Scoping

21. Solve specific, observable friction rather than cloning bloated apps
22. Start with a thin end-to-end slice before polishing visuals
23. Design clear boundaries between UI, business logic, and data
24. Keep files modular and focused instead of dumping everything in one file
25. Favor standard, boring frameworks that LLMs know well
26. Avoid premature microservices or over-engineered state machines
27. Separate test data from live production data from day one
28. Plan undo, rollback, or soft-delete paths for destructive actions
29. Design APIs and webhooks to be idempotent when retried
30. Build internal tools and personal utilities to sharpen your workflow
31. Explicitly model user roles and permissions before adding features
32. Keep configuration and secrets in environment variables, never hardcoded
33. Decouple third-party AI providers behind a clean interface
34. Plan for rate limits, timeouts, and partial network failures
35. Document data schemas and key workflows in plain language
36. Define data ownership and source-of-truth tables early
37. Keep third-party webhook handlers thin and queue heavy work
38. Use feature flags to gate unfinished or risky capabilities
39. Avoid hardcoding magic numbers; extract named constants or config
40. Design clear error types instead of swallowing exceptions silently

UI/UX, Polish & Taste

41. Form strong product opinions instead of accepting generic AI defaults
42. Eliminate visual inconsistencies like mismatched icons or reversed arrows
43. Fix disjointed navigation so users never feel lost
44. Apply Tesler's law by absorbing complexity in the system rather than the user
45. Build onboarding around user outcomes instead of feature dumps
46. Test mobile responsiveness and small viewports early
47. Add loading skeletons, spinners, and clear feedback on slow actions
48. Write clear, human error messages instead of raw stack traces
49. Support keyboard navigation and sensible focus states
50. Check color contrast and basic accessibility (WCAG 2.1 basics)
51. Keep forms short and validate inputs with helpful hints
52. Ensure empty states guide the user on what to do next
53. Standardize spacing, typography hierarchy, and button variants
54. Remove dead buttons, placeholder text, and unfinished mockups
55. Watch real people use your app without giving hints
56. Keep primary call-to-action buttons distinct and unambiguous
57. Handle long usernames, long titles, and multi-line text cleanly
58. Avoid jarring layout shifts when async data finishes loading
59. Provide clear confirmation before irreversible deletes or resets
60. Make sure core flows work smoothly on both desktop and mobile

Testing, Debugging & Escaping Doom Loops

61. Separate diagnosing a bug from applying the fix
62. Inspect every git diff before accepting bulk AI edits
63. Watch out for silent deletions or unintended dependency bumps
64. Run typechecks, linters, and unit tests after every accepted change
65. Stop and revert when an agent repeats the same broken fix twice
66. Reproduce bugs reliably before asking AI to solve them
67. Check network tabs, console errors, and server logs directly
68. Isolate flaky behavior in a minimal reproduction script
69. Verify database migrations both forward and on clean state
70. Test boundary inputs: empty strings, huge payloads, and bad dates
71. Check timezone and locale handling across client and server
72. Audit AI-generated auth and access-control logic line by line
73. Never trust "it builds now" without clicking through the flow
74. Keep commits small so you can pinpoint regressions fast
75. Use branches or worktrees when experimenting with risky changes
76. Revert to a clean commit instead of stacking patches on broken code
77. Check environment variables and port bindings when services fail to start
78. Verify API responses and status codes rather than assuming UI success
79. Test cold starts, slow connections, and timeout recovery
80. Keep a minimal test fixture dataset that resets cleanly

Security, Data & Reliability

81. Verify where passwords, tokens, and API keys are stored
82. Enforce server-side authorization even when UI hides controls
83. Validate and sanitize all external inputs and webhook payloads
84. Protect against SQL/NoSQL injection, XSS, and CSRF
85. Never expose private keys or service-role secrets to client bundles
86. Set up automated, restorable backups for your database
87. Test restoring from a backup before you ever need it
88. Add rate limiting and abuse protection to public endpoints
89. Log key events and errors with correlation IDs
90. Monitor cloud, API token, and compute costs with budget alerts
91. Handle webhook retries and out-of-order events safely
92. Define data retention and deletion behavior for user accounts
93. Scan dependencies for known vulnerabilities regularly
94. Lock down CORS policies and environment permissions
95. Prepare a simple incident checklist for when things break
96. Rotate leaked or exposed API keys and tokens immediately
97. Verify permissions on every read, update, and delete endpoint
98. Avoid logging raw secrets, tokens, or sensitive personal fields
99. Set sensible request size limits to prevent payload abuse
100. Check health endpoints and auto-restart policies for long-running apps

Workflows, Automation & Multi-Agent Habits

101. Automate repetitive setup, scaffolding, and deployment steps
102. Use local background runners or process managers for persistent services
103. Back up encryption keys and local environment configs safely
104. Connect workflows and webhooks cleanly with clear payload contracts
105. Run parallel agents only on non-overlapping files or branches
106. Watch for agent contention and merge conflicts early
107. Use MCP tools or CLI integrations to ground agents in live context
108. Keep a personal library of reusable prompts and project starters
109. Benchmark model speed, cost, and reasoning for different tasks
110. Switch models when one gets stuck in a reasoning rut
111. Automate formatting and lint hooks before commits land
112. Create repeatable smoke tests after every deployment
113. Document runbooks for starting, restarting, and recovering services
114. Prune unused packages, dead code, and stale branches weekly
115. Review changelogs of core SDKs and runtimes before upgrading
116. Script repeatable local startup and environment checks
117. Keep credentials and encryption keys backed up outside the repo
118. Use structured output schemas when wiring LLMs into automations
119. Test webhook endpoints locally with tunnels before going public
120. Review diffs across parallel agent branches before merging

Shipping, Growth & Continuous Learning

121. Ship a working v1 quickly instead of chasing perfection in private
122. Deploy to a real live URL early to catch environment mismatches
123. Pick a clear, memorable name and test how it sounds and looks
124. Instrument basic analytics to see where users drop off
125. Collect real user feedback and prioritize recurring pain points
126. Write a concise README explaining setup, architecture, and limits
127. Record a short demo or walkthrough to clarify value fast
128. Price early and test willingness to pay if building commercially
129. Keep scope tight for v1.1 and resist feature bloat
130. Read the code AI writes so you actually understand your system
131. Ask AI to explain unfamiliar patterns, SQL queries, or regexes
132. Compare your vibe-coded output against clean hand-crafted code
133. Maintain offline or graceful degradation where it matters
134. Celebrate small shipped milestones and keep momentum high
135. Revisit and refine your personal vibe-coding playbook every month
136. Cut non-essential scope to get real feedback this week
137. Share a working link with 3 to 5 target users and watch closely
138. Track basic activation and retention metrics rather than vanity hits
139. Keep a changelog of what shipped and what broke along the way
140. Audit your own code patterns to level up core engineering skills