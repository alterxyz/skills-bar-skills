# Bento Report Generation Instructions

Load this file when generating bento-ready evaluation reports.

---

## Core Principles

> **Your evaluation logic directly determines visual weight.**

This is NOT a two-step process (evaluate → format). Your assessment decisions ARE layout decisions.

> **Speak human, not framework.**

Reports are for end users who haven't read our evaluation criteria. Never use internal terminology (D1, D2, Gate G1). Translate everything into natural language that explains the actual impact.

| ❌ Internal Jargon | ✅ User-Friendly |
|-------------------|------------------|
| D1: Knowledge Delta — 14/20 | Expert Knowledge — Good ✓ |
| D4 score is 27% | File organization needs work |
| Gate G1 failed | Cannot read the skill file (formatting error) |
| Low progressive disclosure | Everything loads at once, wasting memory |
| Token economy poor | File is too long, slowing down responses |

---

## Generation Flow

### Step 1: Execute Evaluation

Complete all Gate checks and dimension scoring per standard evaluation process.

### Step 2: Calculate Importance for Each Result

Apply these rules to determine each block's importance level:

```
Gate Rules:
  IF gate.status == 'fail'           → critical
  IF all gates pass                  → minor (group into single block)

Score Rules:
  IF score.percentage < 30           → critical
  IF score.percentage < 60           → notable
  IF score.percentage >= 80          → minor
  ELSE                               → normal

Special Rules:
  IF security.hasHighRisk            → critical (always)
  IF score disparity > 40% from avg  → notable (flag the outlier)
  IF verdict == 'excellent'          → add celebration block
```

### Step 3: Generate Content Layers

Content depth scales with importance:

| Importance | Required Content |
|------------|------------------|
| `critical` | headline + detail + evidence + action |
| `notable` | headline + detail + action |
| `normal` | headline + detail |
| `minor` | headline only |

**Content Guidelines:**

- `headline`: ≤10 words, instantly understandable, NO jargon
  - ❌ "D1: Knowledge Delta — 14/20"
  - ✅ "Expert Knowledge — Good ✓"
  
- `detail`: 1-2 sentences explaining the impact in plain language
  - ❌ "SKILL.md is 820 lines with no progressive disclosure. Wastes ~5000 tokens."
  - ✅ "The skill file is very long with everything crammed together. This wastes memory and slows down responses."
  
- `evidence`: Specific facts (keep technical, but explain why it matters)
  - ❌ "references/ directory: empty"
  - ✅ "No separate reference files (detailed content could be moved out of main file)"
  
- `action`: Concrete, executable fix that anyone can understand
  - ❌ "Split to references/, add 'MANDATORY: Read...' triggers"
  - ✅ "Move detailed guides to separate files, keeping only essential instructions in the main file."

**The test**: Could someone who has never heard of "Agent Skills" understand this report?

### Step 4: Derive Layout

```
critical → prominent (3×2 or full width)
notable  → expanded  (2×2)
normal   → default   (2×1)
minor    → compact   (1×1)
```

### Step 5: Add Visual Assets

**When to add visual_asset:**

| Condition | Asset Type | Style |
|-----------|------------|-------|
| Header block | chart (gauge) | neutral |
| Scores overview | chart (radar) | neutral |
| Critical issue | illustration | warning |
| Security vulnerability | illustration | warning |
| Verdict excellent | illustration | celebration |
| Verdict good/acceptable | badge | minimal |

**When NOT to add visual_asset:**

- `minor` importance blocks (keep compact)
- Individual passed gates (group them)
- Normal scores without notable content

---

## Importance Reason Guidelines

Every block MUST have `importance.reason` explaining WHY this level was assigned. This is for internal tracking—it can be slightly more technical than user-facing content, but should still be understandable.

**Good reasons:**
- "Cannot parse the skill file due to formatting error on line 15"
- "File organization is poor—820 lines with no separation"
- "Security risk: allows arbitrary command execution"
- "All basic checks passed"
- "Expert knowledge quality is strong but has some tutorial content"

**Bad reasons:**
- "D1 score is low" (jargon)
- "This is important" (not specific)
- "Security issue" (what issue?)
- "Gate G1 failed" (internal terminology)

---

## Visual Asset Prompt Guidelines

### DO:
- Keep prompts concise and specific
- Always include style_preset suffix
- Use semantic metaphors (shield = security, building blocks = structure)
- Specify "flat vector" or "minimal" to ensure consistency

### DON'T:
- Include text/words in prompts (use fallback.text instead)
- Use realistic/3D styles
- Create complex scenes

### Prompt Templates by Category:

**Security Issues:**
```
"Cracked shield icon, {specific_issue_metaphor}, red warning glow, dark background, flat vector"
negative: "text, words, realistic, 3d"
```

**Structure Issues:**
```
"Scattered building blocks, disorganized, need assembly, muted colors, minimal style"
negative: "text, words, realistic"
```

**Knowledge Issues:**
```
"Dim lightbulb, question mark, knowledge gap visualization, flat vector"
negative: "text, words, realistic"
```

**Excellent Verdict:**
```
"Golden trophy or medal, subtle glow, achievement celebration, minimal style"
negative: "text, words, realistic, confetti"
```

---

## Fallback Priority

If image generation seems complex, prioritize good fallback:

1. **Data visualizations** → ASCII progress bars
2. **Status indicators** → Emoji combinations
3. **Conceptual content** → Brief metaphor text

**ASCII Progress Bar Template:**
```
████████░░ 80%   (8 filled, 2 empty for 80%)
██████░░░░ 60%   (6 filled, 4 empty for 60%)
███░░░░░░░ 30%   (3 filled, 7 empty for 30%)
```

---

## Special Cases

### All Gates Pass
Combine into single minor block:
```json
{
  "id": "gates-summary",
  "type": "gate",
  "importance": { "level": "minor", "reason": "All 3 gates passed" },
  "layout": { "size": "compact" },
  "content": { "headline": "✓ G1 G2 G3 passed" }
}
```

### Gate Failure (Stop Early)
If any gate fails:
1. Create critical block for failed gate
2. Create one "evaluation halted" block
3. Do NOT generate score blocks (meaningless without passing gates)

```json
{
  "id": "evaluation-halted",
  "type": "insight",
  "importance": { "level": "notable", "reason": "Cannot proceed with gate failure" },
  "content": {
    "headline": "⏸️ Evaluation halted",
    "detail": "Fix gate failures before quality assessment can proceed."
  }
}
```

### Excellent Skill (Celebration)
If totalScore ≥ 50/60 (Static) or equivalent:
```json
{
  "id": "celebration",
  "type": "insight",
  "importance": { "level": "notable", "reason": "Exceptional skill quality" },
  "layout": { "size": "expanded" },
  "content": {
    "headline": "🎉 Excellent Skill",
    "detail": "This skill demonstrates expert-level knowledge packaging."
  },
  "visual_asset": {
    "type": "illustration",
    "generation": {
      "prompt": "Golden achievement badge, subtle rays, professional celebration, minimal style",
      "style_preset": "celebration"
    },
    "fallback": { "emoji": "🏆", "text": "EXCELLENT QUALITY" }
  }
}
```

### Score Disparity
If one dimension is >40% different from average:
```json
{
  "importance": {
    "level": "notable",
    "reason": "D4 (33%) is 37% below average (70%), significant imbalance"
  }
}
```

---

## Output Validation Checklist

Before finalizing report, verify:

- [ ] Every block has `importance.reason` filled
- [ ] All `critical` blocks have `evidence` and `action`
- [ ] All `headline` fields are ≤10 words
- [ ] No `minor` blocks have `visual_asset`
- [ ] Gates are grouped if all pass
- [ ] Scores use percentage for importance calculation
- [ ] Visual prompts have `negative_prompt` excluding text
- [ ] All fallback.text fields are filled
- [ ] JSON is valid and matches schema

---

## Mode-Specific Block Lists

### Static Mode (/60)

Required blocks:
- header (with gauge showing overall score)
- basic-checks (gates grouped, or individual if failed)
- expert-knowledge (quality of specialized information)
- thinking-frameworks (does it shape how to approach problems?)
- warnings-pitfalls (specific things to avoid)
- file-organization (structure and efficiency)
- quality-overview (radar chart insight)
- verdict (final recommendation)
- issues (0-n, problems found)
- strengths (0-n, notable positives)

### Semi-Static Mode (/100)

Additional blocks:
- environment-compatibility (will it work in user's setup?)
- audience-fit (right skill level for the user?)
- combined-score

### Full Mode (/130)

Additional blocks:
- security-assessment
- activation-reliability (does it trigger when expected?)
- functional-testing (does it actually work?)
