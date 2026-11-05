---
name: preventive-security-review
description: Perform a focused, source-first preventive security review for a requested security-sensitive change without starting a full audit or changing code.
---

# Preventive security review

Use this skill when a user requests a preventive security review or a security-sensitive change needs a focused boundary check. Do not start a full audit, create audit artifacts, install tools, make live calls, reproduce exploits, or require unrelated code work.

Read `docs/agent-shared/security-policy.md` first. Treat it as preventive context, not as proof that every listed control holds. Follow its attack-prevention boundary and use its proposed negative-test recipes for touched SEC patterns.

Read [references/boundaries.md](references/boundaries.md) for repository-specific questions and source anchors.

For each substantive claim, name:

- the lower-trust actor or input;
- the protected resource or principal;
- the effective authority and intended control;
- the enforcement boundary and actual caller or registration path;
- the concrete unauthorized consequence, if any.

Trace registration, callers, alternate paths, and existing framework or upstream guards before alleging a gap. Preserve legitimate public flows, authorized selectors and responses, role-appropriate actions, safe retries, and client presentation calculations.

Separate source-established boundary defects, hardening suggestions, disproved claims, and specific facts that need validation. Do not grade an unresolved deployment or external assumption as a confirmed vulnerability. Do not claim complete coverage or runtime safety. Record unreviewed boundaries and missing evidence.

For hooks and installed plugin content, remember that the code runs on an engineer's machine with that engineer's permissions. Trace what a hook does on every failure branch, what an agent can do with its granted tools, and which file or value a script trusts. Treat prompts, model text, tool arguments, and files an agent reads as untrusted. Capability and resource authority must come from handler-side code, a deterministic hook, or a verified server, not from prompt wording. For data and event paths, trace derived copies, caller or event provenance, and effects. Do not require blanket field validation unless a consumed field crosses an evidenced unsafe sink, authorization, or resource-abuse boundary.

Keep review read-only. Existing authorized engineering tests belong to their own workflow. Do not globally ban ordinary development or introduce a framework.

## Provenance

The preventive methods were adapted from the pinned Cloudflare security-audit material. See `references/boundaries.md` for the exact source, selected filenames, and MIT notice.
