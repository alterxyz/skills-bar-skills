---
name: skill-evaluator
description: Evaluate Agent Skills against agentskills.io specification with three progressive modes and smart visual reports. (1) Static Analysis - SKILL.md-only review for quality and spec compliance, outputs score /60. (2) Semi-Static Analysis - adds environment and user fit assessment without execution, outputs score /100. (3) Full Analysis - complete evaluation with security scanning, trigger testing, and dynamic verification, outputs score /130. Supports Bento-ready JSON report output for visual dashboards with auto-scaling blocks based on issue severity. Trigger phrases include "evaluate skill", "review skill", "audit skill", "is this skill good", "should I use/install this skill", "skill quality check", "rate this skill", "score this skill", "bento report", "visual report", "技能评估", "评测 skill", "审核 skill", "可视化报告".
---

# Skill Evaluator

Evaluate Agent Skills against [agentskills.io](https://agentskills.io) specification and best practices.

---

## Core Philosophy

> **Good Skill = Expert-only Knowledge − What the LLM Already Knows**

| Knowledge Type | Treatment | Example |
|----------------|-----------|---------|
| **Expert** (LLM doesn't know) | Keep — this is value | "mediabox not cropbox for PDF size" |
| **Activation** (LLM may forget) | Keep if brief | "Always validate XML before packing" |
| **Redundant** (LLM knows) | Delete — token waste | "What is a PDF file" |

### Before Evaluating, Ask Yourself

1. **"Does this skill capture knowledge that took someone years to learn?"** — If no, low D1 score.
2. **"Would an expert read this and nod, or roll their eyes?"** — Eye-roll = redundant content.
3. **"After reading, can the LLM do something it couldn't before?"** — If just faster/reminded, marginal value.

---

## Mode Selection

| Mode | When to Use | Time | Input | Output |
|------|-------------|------|-------|--------|
| **Static** | Quick check, bulk screening, first pass | ~2 min | SKILL.md only | /60 |
| **Semi-Static** | Install decision, fit check | ~5 min | + Environment/User info | /100 |
| **Full** | Production deploy, security audit | ~15 min | + Complete package | /130 |

**Default workflow**: Static first → If score >60 AND installation considered → Semi-Static → If deploying to production → Full.

---

## Mode 1: Static Analysis

**Input**: SKILL.md only  
**Output**: Gate check (Pass/Fail) + Quality Score /60

### Gate Check (All Must Pass)

Any gate failure = immediate reject. Do not proceed to scoring.

| Gate | Requirement | Common Failures |
|------|-------------|-----------------|
| **G1: YAML** | Valid frontmatter with `name` + `description` | Missing `---`, no description |
| **G2: Name** | 1-64 chars, `[a-z0-9-]` only, no reserved words | Uppercase, `claude-`, `anthropic-` |
| **G3: Description** | 1-1024 chars, third-person, no placeholders | Uses "I/you/my", contains "TODO" |

### Quality Dimensions (60 points)

#### D1: Knowledge Delta (20 pts) — MOST IMPORTANT

> "If I delete this, would the LLM perform noticeably worse?"

| Score | Indicator |
|-------|-----------|
| 16-20 | Pure expert knowledge: trade-offs, decision trees, non-obvious sequences, "NEVER X because [surprising reason]" |
| 11-15 | Mostly expert: some activation knowledge mixed in |
| 6-10 | Mixed: useful bits buried in tutorials |
| 0-5 | Redundant: docs the LLM already knows, "What is X" sections |

**Red flags** (subtract points):
- Library tutorials ("How to use pandas")
- Generic best practices ("Write clean code")
- Definitions the LLM knows ("PDF is Portable Document Format")

**Green flags** (add points):
- "When X and Y, choose Z because..."
- "NEVER do X — it causes [non-obvious problem]"
- Specific numbers/thresholds ("Scale UP not down for text clarity")
- Domain-specific sequences the LLM would get wrong

#### D2: Mindset + Procedures (15 pts)

| Score | Indicator |
|-------|-----------|
| 12-15 | Shapes thinking: "Before X, ask yourself...", expert decision frameworks |
| 8-11 | Domain workflows + some thinking patterns |
| 4-7 | Procedures only, no mental models |
| 0-3 | Generic steps ("1. Open file 2. Process 3. Save") |

**Look for**: Diagnostic questions, priority rules, "The expert's first question is always..."

#### D3: Anti-Patterns (10 pts)

| Score | Indicator |
|-------|-----------|
| 9-10 | Comprehensive NEVER list with non-obvious reasons |
| 6-8 | Specific warnings, some reasons |
| 3-5 | Vague warnings ("Be careful with...") |
| 0-2 | No anti-patterns mentioned |

**What counts**: Specific, actionable, with *surprising* consequences. "NEVER use Inter font — dead giveaway of AI-generated" beats "Choose fonts carefully."

#### D4: Structure & Economy (15 pts)

| Score | Indicator |
|-------|-----------|
| 12-15 | <300 lines, excellent progressive disclosure, clear `{baseDir}` references |
| 8-11 | 300-500 lines, uses `references/`, has loading triggers |
| 4-7 | 500-800 lines, some structure |
| 0-3 | >800 lines, monolithic, no disclosure |

**Check for**:
- `{baseDir}/references/` paths with clear "when to load" instructions
- "MANDATORY if [condition]: Read..." triggers
- "Do NOT preload" markers for large references

**Static report template**: See `{baseDir}/references/templates.md#static-report`

---

## Mode 2: Semi-Static Analysis

**Input**: SKILL.md + Target Environment + User Level  
**Output**: Static score + Fit scores = /100

### Step 1: Complete Static Analysis

Run Mode 1 first. If gates fail, stop.

### Step 2: Environment Fit (20 pts)

| Environment | Shell | Files | Network | scripts/ |
|-------------|-------|-------|---------|----------|
| claude.ai/Web | ❌ | Upload only | ❌ | ❌ |
| Claude Desktop | ⚠️ | ⚠️ | ❌ | ⚠️ |
| Coding Agent/CLI | ✅ | ✅ Workspace | ✅ | ✅ |
| IDE Extension | ✅ | ✅ Workspace | ⚠️ | ✅ |
| Enterprise | Policy | Policy | Policy | Policy |

| Score | Criteria |
|-------|----------|
| 16-20 | Fully compatible, all features work |
| 11-15 | Mostly works, minor limitations |
| 6-10 | Partial, requires workarounds or degraded mode |
| 0-5 | Incompatible, core features won't work |

### Step 3: User Fit (20 pts)

| User Level | Signals | Skill Should Provide |
|------------|---------|----------------------|
| Novice | "I'm new to...", asks basics | Guided workflows, examples, guardrails |
| Intermediate | Uses terms correctly, asks "how to optimize" | Efficiency, concepts, options |
| Expert | Asks about internals, wants customization | Control, extensibility, raw power |

| Score | Criteria |
|-------|----------|
| 16-20 | Perfect audience fit |
| 11-15 | Good fit, acceptable learning curve |
| 6-10 | Partial fit, friction expected |
| 0-5 | Wrong audience entirely |

**Semi-static report template**: See `{baseDir}/references/templates.md#semi-static-report`

---

## Mode 3: Full Analysis

**Input**: Complete skill package + Test environment  
**Output**: Comprehensive score /130

### Step 1: Complete Semi-Static

Run Modes 1 and 2 first.

### Step 2: Security Scan (Gate — Must Pass)

**MANDATORY**: Read `{baseDir}/references/security-scan-spec.md` before scanning.

Run static scan:
```bash
python {baseDir}/scripts/security_scan.py /path/to/skill
# or: node {baseDir}/scripts/security_scan.js /path/to/skill
# or: bash {baseDir}/scripts/security_scan.sh /path/to/skill
```

Any HIGH severity finding = **instant fail**. Do not proceed.

For semantic analysis (obfuscation, prompt injection, data flow): Read `{baseDir}/references/security-scan-llm.md` and use the LLM scan prompt.

### Step 3: Trigger Testing (10 pts)

Test 5 prompt types:

| Type | Example | Expected |
|------|---------|----------|
| Direct | "Use [skill-name] to..." | Trigger |
| Keyword | "[feature word] my file" | Trigger |
| Indirect | "[Problem the skill solves]" | Trigger |
| Ambiguous | Vague related request | Maybe trigger |
| Negative | Unrelated task | NOT trigger |

| Score | Criteria |
|-------|----------|
| 9-10 | Reliable triggers, zero false positives |
| 7-8 | Usually triggers, rare false positives |
| 4-6 | Sometimes triggers, some false positives |
| 0-3 | Unreliable or excessive false positives |

### Step 4: Functional Tests (20 pts)

| Category | Points | What to Test |
|----------|--------|--------------|
| Happy path | /8 | Core use cases work correctly |
| Edge cases | /6 | Unusual inputs, boundary conditions |
| Error handling | /3 | Graceful failures, helpful messages |
| Output quality | /3 | Results match expert expectations |

**Full report template**: See `{baseDir}/references/templates.md#full-report`

---

## NEVER Do (Evaluator Anti-Patterns)

1. **NEVER score D1 high for tutorials** — "How to use library X" is not expert knowledge, even if well-written.

2. **NEVER ignore token cost** — An 800-line skill that could be 200 lines is wasting 75% of context window.

3. **NEVER pass security for "educational" shell=True** — Legitimate purposes don't justify vulnerabilities.

4. **NEVER assume environment** — A skill perfect for CLI is worthless in claude.ai web.

5. **NEVER conflate "comprehensive" with "good"** — More content ≠ more value. Density matters.

6. **NEVER skip gate checks** — A skill with invalid YAML shouldn't get quality scores.

---

## Common Failure Patterns → Fixes

| Pattern | Symptom | Root Cause | Fix |
|---------|---------|------------|-----|
| **Tutorial** | Low D1, "What is X" sections | Author wrote for humans, not LLMs | Delete all content LLM already knows |
| **Dump** | >800 lines, no structure | No progressive disclosure | Split to `references/`, add loading triggers |
| **Orphan References** | `references/` exists but never loaded | Missing "when to read" instructions | Add explicit "MANDATORY if [X]: Read..." |
| **Invisible** | Never triggers | Bad description | Move ALL trigger info to description, add keywords |
| **Wrong Location** | "When to Use" in body | Body loads AFTER trigger decision | Description = when, Body = how |
| **Vague Warnings** | "Be careful with X" | No actionable anti-patterns | Specific NEVER + surprising consequence |

---

## Quick Reference: Scoring Cheatsheet

```
D1 (Knowledge Delta):     "Would deleting this make LLM worse?"
D2 (Mindset):             "Does it shape HOW to think, not just WHAT to do?"
D3 (Anti-Patterns):       "Specific NEVERs with surprising reasons?"
D4 (Structure):           "<300 lines? Progressive disclosure? Loading triggers?"
Environment:              "Will core features actually work?"
User:                     "Right audience? Right complexity level?"
```

---

## The Meta-Question

After every evaluation, ask:

> **"Would an expert in this domain say: 'Yes, this captures knowledge that took me years to learn'?"**

- **Yes** → The skill has value.
- **No** → The skill is compressing what the LLM already knows.

---

## Bento-Ready Report Output

For visual dashboard integration, generate JSON reports where **evaluation logic directly determines visual weight**.

### Core Principles

> **异常放大，正常收敛** — Information density scales with deviation severity.

> **Speak human, not framework** — Users haven't read our evaluation docs. No D1/D2/G1 jargon.

| Status | Display Strategy |
|--------|------------------|
| Normal score (≥80%) | Compact block, headline only |
| Notable issue (<60%) | Expanded block with detail + action |
| Critical issue (<30% or security) | Prominent block with full evidence |

### Output Formats

| Request | Output |
|---------|--------|
| Standard evaluation | Markdown report (see `{baseDir}/references/templates.md`) |
| "bento report" / "visual report" / "JSON report" | Bento-ready JSON |

### Bento Report Structure

```json
{
  "meta": { "skillName": "...", "totalScore": 48, "maxScore": 60 },
  "summary": { "verdict": "good", "oneLiner": "Ready to use with minor improvements." },
  "blocks": [
    {
      "id": "expert-knowledge",
      "type": "score",
      "importance": { "level": "normal", "reason": "Good expert content with minor redundancy" },
      "layout": { "size": "default" },
      "content": { 
        "headline": "Expert Knowledge — Good ✓",
        "detail": "Contains valuable professional insights. Some basic tutorials could be trimmed."
      }
    }
  ]
}
```

### Importance → Layout Mapping

| Importance | Layout | Trigger |
|------------|--------|---------|
| `critical` | `prominent` | Gate fail, security issue, score <30% |
| `notable` | `expanded` | Score <60%, outlier disparity |
| `normal` | `default` | Score 60-80% |
| `minor` | `compact` | Score ≥80%, all gates pass |

### Visual Assets

Add `visual_asset` for critical/notable blocks:

- **Charts**: gauge (header), radar (quality overview)
- **Illustrations**: warning style for security issues
- **Badges**: verdict display

Always include `fallback.text` for image generation failures.

**MANDATORY for bento reports**: Read `{baseDir}/references/bento-report-schema.md` for complete JSON schema.

**MANDATORY for bento generation**: Read `{baseDir}/references/bento-report-instruction.md` for generation rules.
