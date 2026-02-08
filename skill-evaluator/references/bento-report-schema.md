# Bento-Ready Report Schema

Load this file when generating visual-ready evaluation reports.

---

## Core Philosophy

> **Amplify anomalies, converge on normal** — The report itself carries layout intelligence

| Status | Display Strategy |
|--------|-----------------|
| Normal score | "✓ Passed" (compact) |
| Critical issue | Full diagnosis + fix guide (prominent) |

**Information density ∝ Degree of deviation**

---

## Natural Language Labels

**NEVER use internal codes (D1, D2, G1, etc.) in user-facing content.**

| Internal Code | User-Friendly Label | What It Measures |
|---------------|---------------------|------------------|
| D1 | Expert Knowledge | Valuable insights an AI wouldn't know |
| D2 | Thinking Frameworks | Mental models and decision patterns |
| D3 | Warnings & Pitfalls | Things to avoid and why |
| D4 | File Organization | Structure, efficiency, and loading |
| G1 | File Format | Can the skill file be read? |
| G2 | Naming | Is the name valid? |
| G3 | Description | Is the description useful? |
| Environment Fit | Compatibility | Will it work in your setup? |
| User Fit | Audience Match | Is it right for your skill level? |

---

## JSON Schema

```yaml
type: object
required: [meta, summary, blocks]

properties:
  meta:
    type: object
    required: [skillName, evaluatedAt, mode, totalScore, maxScore, gatesPassed]
    properties:
      skillName: { type: string }
      evaluatedAt: { type: string, format: date }
      mode: { enum: [static, semi-static, full] }
      totalScore: { type: number }
      maxScore: { type: number }
      gatesPassed: { type: boolean }

  summary:
    type: object
    required: [verdict, oneLiner]
    properties:
      verdict: { enum: [excellent, good, acceptable, poor, reject] }
      oneLiner: { type: string, maxLength: 100 }

  blocks:
    type: array
    items:
      $ref: "#/definitions/Block"

definitions:
  Block:
    type: object
    required: [id, type, importance, content]
    properties:
      id: { type: string }
      type: { enum: [header, gate, score, issue, strength, insight, verdict, comparison] }
      
      importance:
        type: object
        required: [level, reason]
        properties:
          level: { enum: [critical, notable, normal, minor] }
          reason: { type: string }
        
      layout:
        type: object
        properties:
          size: { enum: [compact, default, expanded, prominent] }
          
      visual:
        type: object
        properties:
          variant: { enum: [success, warning, error, neutral, highlight] }
          icon: { type: string }
          
      content:
        type: object
        required: [headline]
        properties:
          headline: { type: string, maxLength: 50 }
          detail: { type: string }
          evidence: { type: array, items: { type: string } }
          action: { type: string }
          
      visual_asset:
        $ref: "#/definitions/VisualAsset"

  VisualAsset:
    type: object
    required: [type, fallback]
    properties:
      type: { enum: [illustration, chart, badge, icon] }
      
      generation:
        type: object
        properties:
          prompt: { type: string }
          style_preset: { enum: [minimal, technical, warning, celebration, neutral] }
          aspect_ratio: { enum: ["1:1", "16:9", "4:3", "2:1"] }
          negative_prompt: { type: string }
          
      chart_data:
        type: object
        properties:
          chart_type: { enum: [radar, bar, gauge, comparison] }
          data: { type: object }
          
      fallback:
        type: object
        required: [text]
        properties:
          text: { type: string }
          emoji: { type: string }
          ascii_art: { type: string }
```

---

## Importance Levels

| Level | Trigger Condition | Layout | Content Expansion |
|-------|-------------------|--------|-------------------|
| `critical` | Gate fail, security issue, score <30% | `prominent` | full (headline + detail + evidence + action) |
| `notable` | Score <60%, score disparity >40% | `expanded` | detail + action |
| `normal` | Score 60-80% | `default` | headline + detail |
| `minor` | Score ≥80%, all gates pass | `compact` | headline only |

---

## Layout Size Mapping

| Size | Grid Span | Typical Use |
|------|-----------|-------------|
| `compact` | 1×1 | Passed gates, high scores |
| `default` | 2×1 | Normal scores, minor issues |
| `expanded` | 2×2 | Notable issues, detailed scores |
| `prominent` | 3×2 or full | Critical issues, header, security warnings |

---

## Visual Asset Style Presets

| Preset | Color Palette | Prompt Suffix |
|--------|---------------|---------------|
| `minimal` | Purple (#6366f1, #8b5cf6) | "flat vector, minimal style, clean lines, muted colors" |
| `technical` | Blue (#3b82f6, #06b6d4) | "blueprint aesthetic, thin lines, dark blue background" |
| `warning` | Red/Orange (#ef4444, #f97316) | "warning sign aesthetic, bold shapes, high contrast" |
| `celebration` | Green/Gold (#22c55e, #fbbf24) | "celebratory, confetti elements, golden accents" |
| `neutral` | Gray (#6b7280, #9ca3af) | "neutral informational, gray tones, professional" |

---

## Block Type Templates

### Header Block

```json
{
  "id": "header",
  "type": "header",
  "importance": { "level": "normal", "reason": "Standard header display" },
  "layout": { "size": "prominent" },
  "content": {
    "headline": "{skillName} — {score}/{maxScore}"
  },
  "visual_asset": {
    "type": "chart",
    "chart_data": {
      "chart_type": "gauge",
      "data": { "value": 48, "max": 60, "thresholds": [20, 30, 40, 50] }
    },
    "fallback": {
      "text": "Score: 48/60 (80%)",
      "ascii_art": "████████████████░░░░ 80%"
    }
  }
}
```

### Gate Block (Passed — Minor)

```json
{
  "id": "gates-summary",
  "type": "gate",
  "importance": { "level": "minor", "reason": "All gates passed" },
  "layout": { "size": "compact" },
  "visual": { "variant": "success", "icon": "check" },
  "content": {
    "headline": "✓ All gates passed"
  }
}
```

### Gate Block (Failed — Critical)

```json
{
  "id": "gate-g1-fail",
  "type": "gate",
  "importance": { "level": "critical", "reason": "Gate G1 failed: invalid YAML" },
  "layout": { "size": "prominent" },
  "visual": { "variant": "error", "icon": "x-circle" },
  "content": {
    "headline": "❌ Gate Failed: YAML Invalid",
    "detail": "YAML frontmatter cannot be parsed. Missing closing '---' on line 15.",
    "action": "Add closing '---' after description field."
  },
  "visual_asset": {
    "type": "illustration",
    "generation": {
      "prompt": "Broken document icon, red X mark, syntax error visualization, dark background, flat vector",
      "style_preset": "warning",
      "aspect_ratio": "1:1",
      "negative_prompt": "text, words, realistic"
    },
    "fallback": {
      "emoji": "📄❌",
      "text": "YAML PARSE ERROR"
    }
  }
}
```

### Score Block (Normal)

```json
{
  "id": "expert-knowledge",
  "type": "score",
  "importance": { "level": "normal", "reason": "Expert knowledge quality is good but has some redundancy" },
  "layout": { "size": "default" },
  "visual": { "variant": "success" },
  "content": {
    "headline": "Expert Knowledge — Good ✓",
    "detail": "Contains valuable professional insights on data transformation. Some basic tutorials could be trimmed to save space."
  }
}
```

### Score Block (Critical)

```json
{
  "id": "file-organization",
  "type": "score",
  "importance": { "level": "critical", "reason": "File is too large and poorly organized" },
  "layout": { "size": "expanded" },
  "visual": { "variant": "error" },
  "content": {
    "headline": "File Organization — Needs Work 🔴",
    "detail": "The skill file is very long (820 lines) with everything crammed together. This wastes memory and slows down responses.",
    "evidence": [
      "Current size: 820 lines (ideal: under 300)",
      "No separate reference files for detailed content",
      "All content loads at once, even when not needed"
    ],
    "action": "Move detailed guides to separate files in a 'references/' folder, keeping only essential instructions in the main file."
  }
}
```

### Issue Block (Critical with Visual)

```json
{
  "id": "security-critical",
  "type": "issue",
  "importance": { "level": "critical", "reason": "shell=True vulnerability detected" },
  "layout": { "size": "prominent" },
  "visual": { "variant": "error", "icon": "shield-alert" },
  "content": {
    "headline": "🔴 Security: Command injection risk",
    "detail": "scripts/process.py line 47 uses subprocess.call(shell=True)",
    "evidence": [
      "subprocess.call(f'process {user_input}', shell=True)  # line 47"
    ],
    "action": "Use subprocess.run([...], shell=False) with proper escaping"
  },
  "visual_asset": {
    "type": "illustration",
    "generation": {
      "prompt": "Cracked digital shield, red glitch effect, binary code fragments, dark background, flat vector",
      "style_preset": "warning",
      "aspect_ratio": "1:1",
      "negative_prompt": "text, words, realistic, 3d"
    },
    "fallback": {
      "emoji": "🛡️💥",
      "text": "SECURITY VULNERABILITY",
      "ascii_art": "  ╔═══════════╗\n  ║  ⚠ VULN  ║\n  ╚═══════════╝"
    }
  }
}
```

### Verdict Block

```json
{
  "id": "verdict",
  "type": "verdict",
  "importance": { "level": "notable", "reason": "Final verdict display" },
  "layout": { "size": "default" },
  "visual": { "variant": "highlight" },
  "content": {
    "headline": "⭐⭐⭐⭐ Good",
    "detail": "Production-ready with minor improvements possible"
  },
  "visual_asset": {
    "type": "badge",
    "generation": {
      "prompt": "Four golden stars in row, one outline star, minimal badge style, subtle glow",
      "style_preset": "minimal",
      "aspect_ratio": "2:1"
    },
    "fallback": {
      "emoji": "⭐⭐⭐⭐☆",
      "text": "GOOD"
    }
  }
}
```

### Scores Radar (Insight Block)

```json
{
  "id": "quality-overview",
  "type": "insight",
  "importance": { "level": "normal", "reason": "Overall quality visualization" },
  "layout": { "size": "expanded" },
  "content": {
    "headline": "Quality Overview"
  },
  "visual_asset": {
    "type": "chart",
    "chart_data": {
      "chart_type": "radar",
      "data": {
        "labels": ["Expert Knowledge", "Thinking Frameworks", "Warnings & Pitfalls", "File Organization"],
        "values": [70, 73, 60, 33],
        "max": 100
      }
    },
    "fallback": {
      "text": "Expert Knowledge    ███████░░░ Good\nThinking Frameworks ███████░░░ Good\nWarnings & Pitfalls ██████░░░░ Fair\nFile Organization   ███░░░░░░░ Poor ⚠️"
    }
  }
}
```
