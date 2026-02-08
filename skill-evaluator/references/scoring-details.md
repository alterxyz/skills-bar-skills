# Detailed Scoring Reference

Load this file when performing detailed evaluation or when user asks for scoring rationale.

---

## D1: Knowledge Delta — Detailed Examples

### Score 16-20 (Pure Knowledge Delta)

**Example from frontend-design skill (43 lines, industry-leading)**:
```markdown
NEVER use these AI-aesthetic clichés:
- Purple/blue gradients (dead giveaway of AI-generated)
- Inter font (overused, signals "default AI choice")
- Generic blob backgrounds
- Perfectly centered everything

Instead: Asymmetry, unusual color combinations, editorial layouts
```

Why high score: Expert aesthetic judgment that took years to develop. the model doesn't know "Inter = AI cliché" from training.

### Score 11-15 (Mostly Expert)

**Good**:
```markdown
When merging PDFs with different page sizes:
1. Check if target needs uniform size
2. If yes, scale smaller pages UP (not down) to preserve text clarity
3. Use mediabox, not cropbox, for size calculations
```

Why good: Non-obvious sequence + trade-off (scale up vs down).

### Score 6-10 (Mixed)

**Contains both expert and redundant**:
```markdown
## What is a PDF?
PDF (Portable Document Format) is a file format...  ← REDUNDANT

## Merging Strategy
When pages have different orientations:
- Landscape + Portrait: rotate landscape 90° CCW  ← EXPERT
- Check for form fields before merge  ← EXPERT
```

Fix: Delete "What is PDF" section entirely.

### Score 0-5 (Redundant)

**Bad**:
```markdown
## How to Read a PDF
import pdfplumber
with pdfplumber.open('file.pdf') as pdf:
    text = pdf.pages[0].extract_text()
```

Why bad: This is in pdfplumber documentation. the model knows this.

---

## D2: Mindset + Procedures — Examples

### Score 12-15 (Expert Thinking + Procedures)

**Thinking pattern**:
```markdown
Before designing any component, ask:
- **Hierarchy**: What's the ONE thing users should see first?
- **Tension**: What visual contrast creates interest?
- **Memory**: What makes this unforgettable in 3 seconds?
```

**Domain procedure** (the model wouldn't know):
```markdown
OOXML Editing Workflow:
1. Unzip .docx → temp directory
2. Edit word/document.xml (NOT word/_rels/)
3. Validate XML before packing
4. Repack with zip (not gzip!)
5. Test in Word before returning
```

### Score 4-7 (Procedures Only)

```markdown
Steps to process document:
1. Open file
2. Parse content
3. Apply changes
4. Save file
```

Why low: Generic procedure the model already knows.

---

## D3: Anti-Patterns — Examples

### Score 9-10 (Comprehensive + Reasons)

```markdown
## NEVER Do

1. **NEVER use `eval()` on user input**
   Even for "simple math" — users will inject code

2. **NEVER trust file extensions**
   A .pdf might be a .exe renamed

3. **NEVER load entire large file into memory**
   Stream processing for >100MB files

4. **NEVER use `shell=True` in subprocess**
   Opens command injection vulnerability
   Instead: pass command as list
```

### Score 3-5 (Vague)

```markdown
- Be careful with user input
- Handle errors properly
- Consider edge cases
```

Why low: "Be careful" tells the model nothing new.

---

## D4: Structure — Size Guidelines

| Lines | Rating | Action |
|-------|--------|--------|
| <200 | Excellent | Ideal density |
| 200-300 | Good | Acceptable |
| 300-500 | Acceptable | Consider splitting |
| 500-800 | Needs work | Must split to references/ |
| >800 | Poor | Urgent refactoring needed |

### Good Progressive Disclosure

```markdown
## Quick Start
[50 lines core workflow]

## Advanced
For complex scenarios, load {baseDir}/references/advanced.md

## Troubleshooting
**MANDATORY if errors occur**: Read {baseDir}/references/errors.md
```

### Bad (No Disclosure)

```markdown
[800 lines of everything mixed together]
[No references/ directory]
[No loading triggers]
```

---

## Environment Compatibility Matrix

| Capability | Web Chat | Desktop App | Coding Agent | IDE Extension | Enterprise |
|------------|----------|-------------|--------------|---------------|------------|
| Shell exec | ❌ | ⚠️ | ✅ | ✅ | Policy |
| File write | ❌ | ⚠️ | ✅ | ✅ | Policy |
| Network | ❌ | ❌ | ✅ | ⚠️ | Policy |
| Local files | Upload only | Upload | Workspace | Workspace | Policy |
| scripts/ | ❌ | ⚠️ | ✅ | ✅ | Policy |

⚠️ = Limited or requires manual enable
Policy = Depends on enterprise configuration

---

## User Level Indicators

### Novice Signals
- "I'm new to..."
- "Can you explain..."
- Asks about basic concepts
- Prefers step-by-step guidance

### Intermediate Signals
- Uses technical terms correctly
- Asks "how to optimize"
- Wants efficiency, not tutorials
- Comfortable with configuration

### Expert Signals
- Asks about internals
- Wants customization options
- References specific versions/APIs
- Prefers control over convenience
