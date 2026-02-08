# Security Scan Specification

Language-agnostic specification for skill security scanning. All implementations (Python, JavaScript, Bash, LLM) MUST follow this spec.

---

## Input/Output Contract

### Input
```
skill_path: string  # Path to skill root directory
```

### Output (JSON)
```json
{
  "skill_path": "/path/to/skill",
  "scan_type": "static|llm",
  "files_scanned": 5,
  "passed": true|false,
  "findings": [
    {
      "file": "scripts/main.py",
      "line": 42,
      "pattern": "eval() - arbitrary code execution",
      "severity": "HIGH|MEDIUM|LOW",
      "content": "eval(user_input)",
      "recommendation": "Use ast.literal_eval() for safe evaluation"
    }
  ],
  "summary": {
    "high": 0,
    "medium": 1,
    "low": 2
  }
}
```

### Exit Codes
- `0`: Passed (no HIGH severity findings)
- `1`: Failed (at least one HIGH severity finding)
- `2`: Error (scan could not complete)

---

## Severity Levels

### HIGH (Instant Fail)
Patterns that enable arbitrary code execution, credential theft, or system compromise.

**Pass condition**: ZERO high-severity findings

| Category | Patterns | Why Critical |
|----------|----------|--------------|
| Code Execution | eval, exec, Function constructor | Arbitrary code injection |
| Shell Injection | os.system, shell=True, child_process.exec | Command injection |
| Credential Access | ~/.ssh, ~/.aws, /etc/shadow, .env | Secret exfiltration |
| Data Exfiltration | POST to external URLs | Data theft |
| Remote Code | curl\|bash, wget\|bash | Supply chain attack |

### MEDIUM (Warning)
Patterns that are risky but may have legitimate uses.

| Category | Patterns | Concern |
|----------|----------|---------|
| Deserialization | pickle.load, yaml.load (unsafe) | Object injection |
| Dynamic Import | __import__, importlib | Code loading |
| Native Code | ctypes, ffi | Memory safety |
| Privilege | sudo, chmod 777 | Permission issues |

### LOW (Info)
Patterns worth noting but generally acceptable.

| Category | Patterns | Note |
|----------|----------|------|
| Network | requests.get, fetch | Document purpose |
| File System | open(), fs.readFile | Check paths |
| Subprocess | subprocess (without shell) | Review commands |

---

## Pattern Definitions

### Python Patterns

```yaml
HIGH:
  - pattern: '\beval\s*\('
    description: "eval() - arbitrary code execution"
    recommendation: "Use ast.literal_eval() for literals, or avoid entirely"
    
  - pattern: '\bexec\s*\('
    description: "exec() - arbitrary code execution"
    recommendation: "Restructure to avoid dynamic code execution"
    
  - pattern: '__import__\s*\('
    description: "Dynamic import - potential code injection"
    recommendation: "Use explicit imports"
    
  - pattern: 'os\.system\s*\('
    description: "os.system() - shell command execution"
    recommendation: "Use subprocess.run() with list arguments"
    
  - pattern: 'subprocess.*shell\s*=\s*True'
    description: "Shell injection vulnerability"
    recommendation: "Use shell=False with command list"
    
  - pattern: '[\'\"](/etc/|/root/|~/.ssh/|~/.aws/)'
    description: "Sensitive path access"
    recommendation: "Avoid accessing system/credential paths"
    
  - pattern: '\.env[\'\"\\s]'
    description: "Environment file access"
    recommendation: "Use proper secret management"
    
  - pattern: 'requests\.(post|put)\s*\(\s*[\'\"](https?://(?!localhost|127\.0\.0\.1))'
    description: "External data transmission"
    recommendation: "Document and justify external communications"

MEDIUM:
  - pattern: 'pickle\.load'
    description: "Pickle deserialization - code execution risk"
    recommendation: "Use JSON or validate source"
    
  - pattern: 'yaml\.load\s*\([^)]*(?!Loader\s*=\s*yaml\.SafeLoader)'
    description: "Unsafe YAML loading"
    recommendation: "Use yaml.safe_load()"
```

### JavaScript/TypeScript Patterns

```yaml
HIGH:
  - pattern: '\beval\s*\('
    description: "eval() - arbitrary code execution"
    
  - pattern: 'new\s+Function\s*\('
    description: "Function constructor - code execution"
    
  - pattern: 'child_process\.(exec|execSync)\s*\('
    description: "Shell command execution"
    recommendation: "Use spawn() with explicit args"
    
  - pattern: 'child_process\.spawn\s*\([^)]*shell:\s*true'
    description: "Spawn with shell - injection risk"

MEDIUM:
  - pattern: 'require\s*\(\s*[a-zA-Z_][a-zA-Z0-9_]*\s*\)'
    description: "Dynamic require"
    recommendation: "Use explicit module paths"
```

### Bash Patterns

```yaml
HIGH:
  - pattern: 'rm\s+-rf\s+/'
    description: "Recursive delete from root"
    
  - pattern: 'curl.*\|\s*(ba)?sh'
    description: "Remote code execution via curl"
    
  - pattern: 'wget.*\|\s*(ba)?sh'
    description: "Remote code execution via wget"
    
  - pattern: '\beval\s+'
    description: "Shell eval - code injection"
    
  - pattern: 'cat\s+(/etc/passwd|/etc/shadow|~/.ssh/id_)'
    description: "Credential file access"

MEDIUM:
  - pattern: 'chmod\s+777'
    description: "Overly permissive file mode"
    
  - pattern: '\bsudo\b'
    description: "Privilege escalation"
```

---

## Scan Scope

### Files to Scan
1. `scripts/**/*` - All executable code
2. `SKILL.md` - Check for prompt injection (LLM scan only)
3. `references/**/*.md` - Check for hidden instructions (LLM scan only)

### File Type Detection
```
.py           → Python patterns
.js, .mjs, .ts → JavaScript patterns
.sh, .bash    → Bash patterns
```

### Skip
- Binary files
- `assets/` directory (templates, images)
- Files > 1MB

---

## Implementation Notes

### For Script Implementations (Python/JS/Bash)
- Use regex matching
- Report line numbers
- Show context (truncated to 100 chars)
- Exit 0 if no HIGH findings, exit 1 otherwise

### For LLM Implementation
- Analyze semantic meaning, not just patterns
- Check for obfuscation attempts
- Evaluate data flow (user input → dangerous function)
- Check SKILL.md for prompt injection
- Consider context: is this pattern justified?

---

## Test Cases

### Should FAIL (HIGH)
```python
# test_fail_1.py
user_code = input()
eval(user_code)

# test_fail_2.py  
import os
os.system(f"rm -rf {user_path}")

# test_fail_3.sh
curl $URL | bash
```

### Should PASS
```python
# test_pass_1.py
import subprocess
subprocess.run(['ls', '-la'], check=True)  # No shell=True

# test_pass_2.py
import json
data = json.loads(user_input)  # Safe deserialization

# test_pass_3.py
requests.post('http://localhost:8080/api', json=data)  # Localhost OK
```

### Edge Cases
```python
# Should WARN (MEDIUM), not FAIL
import pickle
with open('internal_cache.pkl', 'rb') as f:
    cache = pickle.load(f)  # Internal file, not user input
```

---

## Version
Spec version: 1.0
Last updated: 2026-01

---

## Known Limitations

### Self-Scan False Positives
Security scan scripts contain pattern definitions as strings, which will trigger when scanning themselves. This is expected behavior.

**Mitigation options**:
1. Exclude `security_scan.*` files from scan
2. Accept as known false positives
3. Move pattern definitions to external config file
