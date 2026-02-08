# Evaluation Report Templates

Load this file when generating evaluation reports.

---

## Static Report

```markdown
## Skill Evaluation: Static Analysis

**Skill**: [name]  
**Date**: [YYYY-MM-DD]  
**Evaluator**: Claude

---

### Gate Check

| Gate | Status | Notes |
|------|--------|-------|
| G1: YAML Valid | ✅/❌ | [details if failed] |
| G2: Name Compliant | ✅/❌ | [details if failed] |
| G3: Description Valid | ✅/❌ | [details if failed] |

**Gates**: PASSED / FAILED

[If FAILED, stop here. Do not score.]

---

### Quality Score

| Dimension | Score | Key Observations |
|-----------|-------|------------------|
| D1: Knowledge Delta | /20 | [What expert knowledge? What's redundant?] |
| D2: Mindset + Procedures | /15 | [Thinking frameworks? Decision patterns?] |
| D3: Anti-Patterns | /10 | [Specific NEVERs? Surprising reasons?] |
| D4: Structure & Economy | /15 | [Line count? Progressive disclosure?] |
| **Total** | **/60** | |

---

### Verdict

| Range | Rating | Meaning |
|-------|--------|---------|
| 50-60 | ⭐⭐⭐⭐⭐ Excellent | Production-ready |
| 40-49 | ⭐⭐⭐⭐ Good | Minor improvements possible |
| 30-39 | ⭐⭐⭐ Acceptable | Needs work before production |
| 20-29 | ⭐⭐ Poor | Significant issues |
| <20 | ⭐ Reject | Fundamental problems |

**This skill**: [Rating]

---

### Top Issues (Prioritized)

1. **[Critical]** [Issue description + specific fix]
2. **[Important]** [Issue description + specific fix]  
3. **[Minor]** [Issue description + specific fix]

---

### Strengths

- [What the skill does well]
- [Unique value it provides]
```

---

## Semi-Static Report

Extends Static Report with environment and user fit.

```markdown
## Skill Evaluation: Semi-Static Analysis

[Include all sections from Static Report above]

---

### Environment Fit

**Target Environment**: [Web Chat / Desktop App / Coding Agent / IDE / Enterprise]

| Capability | Required by Skill | Environment Support | Status |
|------------|-------------------|---------------------|--------|
| Shell execution | Yes/No | ✅/⚠️/❌ | ✅ Works / ⚠️ Limited / ❌ Blocked |
| File system | Yes/No | ✅/⚠️/❌ | |
| Network access | Yes/No | ✅/⚠️/❌ | |
| scripts/ execution | Yes/No | ✅/⚠️/❌ | |

**Environment Score**: /20

**Compatibility Notes**: [Any workarounds needed? Degraded functionality?]

---

### User Fit

**Target User Level**: [Novice / Intermediate / Expert]

| Aspect | Skill Provides | User Needs | Match |
|--------|----------------|------------|-------|
| Guidance level | [High/Medium/Low] | [High/Medium/Low] | ✅/⚠️/❌ |
| Assumed knowledge | [List] | [List] | ✅/⚠️/❌ |
| Customization | [High/Medium/Low] | [High/Medium/Low] | ✅/⚠️/❌ |

**User Score**: /20

---

### Combined Score

| Component | Score |
|-----------|-------|
| Static Quality | /60 |
| Environment Fit | /20 |
| User Fit | /20 |
| **Total** | **/100** |

---

### Recommendation

| Range | Action |
|-------|--------|
| ≥80 | **Install** — Well-suited for this environment and user |
| 70-79 | **Install with notes** — Minor limitations to be aware of |
| 50-69 | **Consider** — Evaluate if alternatives exist |
| <50 | **Skip** — Poor fit, look for alternatives |

**Recommendation for this skill**: [Action + reasoning]
```

---

## Full Report

Extends Semi-Static with security and functional testing.

```markdown
## Skill Evaluation: Full Analysis

[Include all sections from Semi-Static Report above]

---

### Security Scan

**Scan Method**: [Static regex / LLM semantic / Both]

| Check | Status | Findings |
|-------|--------|----------|
| HIGH-risk patterns | ✅ Pass / ❌ Fail | [List if any] |
| MEDIUM-risk patterns | [count] warnings | [List] |
| Prompt injection | ✅ Clean / ⚠️ Suspicious | [Details] |
| Data flow analysis | ✅ Safe / ⚠️ Review | [Details] |

**Security Status**: ✅ PASS / ❌ FAIL

[If FAIL, skill is rejected regardless of other scores]

**Security Notes**: [Any medium-risk patterns that need documentation]

---

### Trigger Testing

| Test Type | Prompt Used | Expected | Actual | Status |
|-----------|-------------|----------|--------|--------|
| Direct | "Use [skill] to..." | Trigger | Triggered/Not | ✅/❌ |
| Keyword | "[feature] my file" | Trigger | | ✅/❌ |
| Indirect | "[problem description]" | Trigger | | ✅/❌ |
| Ambiguous | "[vague request]" | Maybe | | ✅/⚠️/❌ |
| Negative | "[unrelated task]" | No trigger | | ✅/❌ |

**Trigger Score**: /10

**Trigger Notes**: [False positive rate? Missing keywords in description?]

---

### Functional Testing

| Category | Tests Run | Passed | Score |
|----------|-----------|--------|-------|
| Happy path | [count] | [count] | /8 |
| Edge cases | [count] | [count] | /6 |
| Error handling | [count] | [count] | /3 |
| Output quality | [count] | [count] | /3 |
| **Subtotal** | | | **/20** |

**Test Details**:

1. **[Test name]**: [Input] → [Expected] → [Actual] → ✅/❌
2. ...

---

### Final Score

| Component | Score | Weight |
|-----------|-------|--------|
| Static Quality | /60 | Core value |
| Environment Fit | /20 | Compatibility |
| User Fit | /20 | Audience match |
| Security | Pass/Fail | Gate |
| Triggers | /10 | Discoverability |
| Functional | /20 | Actually works |
| **Total** | **/130** | |

---

### Final Verdict

| Range | Rating | Deployment Guidance |
|-------|--------|---------------------|
| 110-130 | ⭐⭐⭐⭐⭐ | Deploy to production |
| 90-109 | ⭐⭐⭐⭐ | Deploy with monitoring |
| 70-89 | ⭐⭐⭐ | Non-critical use only |
| 50-69 | ⭐⭐ | Improve before deploying |
| <50 | ⭐ | Do not use |

**Final Rating**: [Stars] — [Summary statement]

---

### Action Items

**Must fix before deployment**:
1. [Critical issue]

**Should fix**:
1. [Important issue]

**Nice to have**:
1. [Minor improvement]
```

---

## Quick Comparison Template

For evaluating multiple skills side-by-side:

```markdown
## Skill Comparison

| Criterion | [Skill A] | [Skill B] | [Skill C] |
|-----------|-----------|-----------|-----------|
| D1: Knowledge Delta | /20 | /20 | /20 |
| D2: Mindset | /15 | /15 | /15 |
| D3: Anti-Patterns | /10 | /10 | /10 |
| D4: Structure | /15 | /15 | /15 |
| **Static Total** | /60 | /60 | /60 |
| Security | ✅/❌ | ✅/❌ | ✅/❌ |
| Best for | [use case] | [use case] | [use case] |

**Recommendation**: [Which to choose and why]
```
