#!/usr/bin/env python3
"""
Security scanner for Agent Skills.
Scans scripts/ directory for high-risk patterns.

Usage:
    python security_scan.py /path/to/skill
    
Output:
    JSON with scan results
"""

import re
import os
import sys
import json
from pathlib import Path

HIGH_RISK_PATTERNS = {
    'python': [
        (r'\beval\s*\(', 'eval() - arbitrary code execution'),
        (r'\bexec\s*\(', 'exec() - arbitrary code execution'),
        (r'__import__\s*\(', 'dynamic import - potential code injection'),
        (r'compile\s*\([^)]+[\'"]exec[\'"]\s*\)', 'compile with exec mode'),
        (r'os\.system\s*\(', 'os.system() - shell command execution'),
        (r'subprocess\.call\s*\([^)]*shell\s*=\s*True', 'subprocess with shell=True'),
        (r'subprocess\.Popen\s*\([^)]*shell\s*=\s*True', 'Popen with shell=True'),
        (r'subprocess\.run\s*\([^)]*shell\s*=\s*True', 'subprocess.run with shell=True'),
        (r'[\'\"]/etc/', 'access to /etc/ system directory'),
        (r'[\'\"]/root/', 'access to /root/ directory'),
        (r'[\'\"]~/.ssh/', 'access to SSH keys'),
        (r'[\'\"]~/.aws/', 'access to AWS credentials'),
        (r'[\'\"]~/.config/', 'access to user config'),
        (r'\.env[\'\"\\s]', 'access to .env file'),
        (r'requests\.(post|put|patch)\s*\(\s*[\'\"](https?://(?!localhost|127\.0\.0\.1))', 'external data transmission'),
        (r'urllib\.request\.urlopen', 'URL open - potential SSRF'),
        (r'socket\.connect\s*\(', 'raw socket connection'),
        (r'base64\.b64decode\s*\([^)]+\).*exec', 'base64 decode with execution'),
        (r'pickle\.load', 'pickle.load - arbitrary code execution'),
        (r'yaml\.load\s*\([^)]*(?!Loader\s*=\s*yaml\.SafeLoader)', 'unsafe yaml.load'),
    ],
    'bash': [
        (r'rm\s+-rf\s+/', 'rm -rf on root path'),
        (r'rm\s+-rf\s+\*', 'rm -rf with wildcard'),
        (r'curl\s+[^\|]+\|\s*bash', 'curl piped to bash'),
        (r'wget\s+[^\|]+\|\s*bash', 'wget piped to bash'),
        (r'\beval\s+', 'bash eval command'),
        (r'cat\s+/etc/passwd', 'reading /etc/passwd'),
        (r'cat\s+/etc/shadow', 'reading /etc/shadow'),
        (r'cat\s+~/.ssh/id_', 'reading SSH private key'),
        (r'\$\([^)]*curl', 'command substitution with curl'),
        (r'`[^`]*curl', 'backtick execution with curl'),
    ],
    'javascript': [
        (r'\beval\s*\(', 'eval() - arbitrary code execution'),
        (r'new\s+Function\s*\(', 'Function constructor - code execution'),
        (r'child_process\.exec\s*\(', 'child_process.exec - shell command'),
        (r'child_process\.execSync\s*\(', 'child_process.execSync - shell command'),
        (r'require\s*\(\s*[\'\"]\s*child_process', 'importing child_process'),
        (r'fs\.readFileSync\s*\([^)]*(/etc/|~/.ssh|~/.aws)', 'reading sensitive files'),
    ]
}

MEDIUM_RISK_PATTERNS = {
    'python': [
        (r'ctypes\.', 'ctypes usage - native code'),
        (r'importlib\.', 'dynamic import'),
        (r'getattr\s*\([^,]+,\s*[^\'\"]+\)', 'getattr with dynamic attribute'),
    ],
    'bash': [
        (r'chmod\s+777', 'chmod 777 - insecure permissions'),
        (r'sudo\s+', 'sudo usage'),
    ],
    'javascript': [
        (r'require\s*\(\s*[a-zA-Z_][a-zA-Z0-9_]*\s*\)', 'dynamic require'),
    ]
}


def get_language(filepath):
    """Determine language from file extension."""
    ext = Path(filepath).suffix.lower()
    lang_map = {
        '.py': 'python',
        '.sh': 'bash',
        '.bash': 'bash',
        '.js': 'javascript',
        '.ts': 'javascript',
        '.mjs': 'javascript',
    }
    return lang_map.get(ext)


def scan_content(filepath, content, lang):
    """Scan file content for security patterns."""
    findings = []
    lines = content.split('\n')
    
    # Check high-risk patterns
    for pattern, desc in HIGH_RISK_PATTERNS.get(lang, []):
        for i, line in enumerate(lines, 1):
            if re.search(pattern, line, re.IGNORECASE):
                findings.append({
                    'file': filepath,
                    'line': i,
                    'pattern': desc,
                    'severity': 'HIGH',
                    'content': line.strip()[:100]
                })
    
    # Check medium-risk patterns
    for pattern, desc in MEDIUM_RISK_PATTERNS.get(lang, []):
        for i, line in enumerate(lines, 1):
            if re.search(pattern, line, re.IGNORECASE):
                findings.append({
                    'file': filepath,
                    'line': i,
                    'pattern': desc,
                    'severity': 'MEDIUM',
                    'content': line.strip()[:100]
                })
    
    return findings


def scan_skill(skill_path):
    """Scan a skill directory for security issues."""
    skill_dir = Path(skill_path)
    scripts_dir = skill_dir / 'scripts'
    
    results = {
        'skill_path': str(skill_dir),
        'scan_type': 'static',
        'files_scanned': 0,
        'findings': [],
        'summary': {
            'high': 0,
            'medium': 0,
            'low': 0
        }
    }
    
    if not scripts_dir.exists():
        results['note'] = 'No scripts/ directory found'
        results['passed'] = True
        return results
    
    for filepath in scripts_dir.rglob('*'):
        if not filepath.is_file():
            continue
            
        lang = get_language(str(filepath))
        if not lang:
            continue
        
        results['files_scanned'] += 1
        
        try:
            content = filepath.read_text(encoding='utf-8', errors='replace')
            findings = scan_content(
                str(filepath.relative_to(skill_dir)),
                content,
                lang
            )
            results['findings'].extend(findings)
        except Exception as e:
            results['findings'].append({
                'file': str(filepath.relative_to(skill_dir)),
                'error': str(e),
                'severity': 'LOW'
            })
    
    # Calculate summary
    for f in results['findings']:
        sev = f.get('severity', 'LOW').lower()
        if sev in results['summary']:
            results['summary'][sev] += 1
    
    # Determine pass/fail
    results['passed'] = results['summary']['high'] == 0
    
    return results


def main():
    if len(sys.argv) < 2:
        print("Usage: python security_scan.py /path/to/skill", file=sys.stderr)
        sys.exit(1)
    
    skill_path = sys.argv[1]
    
    if not os.path.exists(skill_path):
        print(f"Error: Path does not exist: {skill_path}", file=sys.stderr)
        sys.exit(1)
    
    results = scan_skill(skill_path)
    print(json.dumps(results, indent=2))
    
    sys.exit(0 if results['passed'] else 1)


if __name__ == '__main__':
    main()
