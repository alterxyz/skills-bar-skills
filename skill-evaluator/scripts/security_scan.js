#!/usr/bin/env node
/**
 * Security scanner for Agent Skills.
 * Scans scripts/ directory for high-risk patterns.
 * 
 * Usage:
 *   node security_scan.js /path/to/skill
 *   
 * Output:
 *   JSON with scan results (to stdout)
 *   
 * Exit codes:
 *   0 = passed (no HIGH findings)
 *   1 = failed (HIGH findings found)
 *   2 = error
 *   
 * Spec: See references/security-scan-spec.md
 */

const fs = require('fs');
const path = require('path');

// Pattern definitions per language
const HIGH_RISK_PATTERNS = {
  python: [
    [/\beval\s*\(/i, 'eval() - arbitrary code execution'],
    [/\bexec\s*\(/i, 'exec() - arbitrary code execution'],
    [/__import__\s*\(/i, 'dynamic import - potential code injection'],
    [/compile\s*\([^)]+['"]exec['"]\s*\)/i, 'compile with exec mode'],
    [/os\.system\s*\(/i, 'os.system() - shell command execution'],
    [/subprocess\.call\s*\([^)]*shell\s*=\s*True/i, 'subprocess with shell=True'],
    [/subprocess\.Popen\s*\([^)]*shell\s*=\s*True/i, 'Popen with shell=True'],
    [/subprocess\.run\s*\([^)]*shell\s*=\s*True/i, 'subprocess.run with shell=True'],
    [/['"]\/etc\//i, 'access to /etc/ system directory'],
    [/['"]\/root\//i, 'access to /root/ directory'],
    [/['"]~\/\.ssh\//i, 'access to SSH keys'],
    [/['"]~\/\.aws\//i, 'access to AWS credentials'],
    [/['"]~\/\.config\//i, 'access to user config'],
    [/\.env['"\\s]/i, 'access to .env file'],
    [/requests\.(post|put|patch)\s*\(\s*['"](https?:\/\/(?!localhost|127\.0\.0\.1))/i, 'external data transmission'],
    [/urllib\.request\.urlopen/i, 'URL open - potential SSRF'],
    [/socket\.connect\s*\(/i, 'raw socket connection'],
    [/base64\.b64decode\s*\([^)]+\).*exec/i, 'base64 decode with execution'],
    [/pickle\.load/i, 'pickle.load - arbitrary code execution'],
    [/yaml\.load\s*\([^)]*(?!Loader\s*=\s*yaml\.SafeLoader)/i, 'unsafe yaml.load'],
  ],
  javascript: [
    [/\beval\s*\(/i, 'eval() - arbitrary code execution'],
    [/new\s+Function\s*\(/i, 'Function constructor - code execution'],
    [/child_process\.(exec|execSync)\s*\(/i, 'shell command execution'],
    [/child_process\.spawn\s*\([^)]*shell:\s*true/i, 'spawn with shell option'],
    [/require\s*\(\s*['"]child_process/i, 'importing child_process'],
    [/fs\.(readFileSync|readFile)\s*\([^)]*(?:\/etc\/|~\/\.ssh|~\/\.aws)/i, 'reading sensitive files'],
  ],
  bash: [
    [/rm\s+-rf\s+\//i, 'rm -rf on root path'],
    [/rm\s+-rf\s+\*/i, 'rm -rf with wildcard'],
    [/curl\s+[^|]+\|\s*(ba)?sh/i, 'curl piped to shell'],
    [/wget\s+[^|]+\|\s*(ba)?sh/i, 'wget piped to shell'],
    [/\beval\s+/i, 'bash eval command'],
    [/cat\s+\/etc\/passwd/i, 'reading /etc/passwd'],
    [/cat\s+\/etc\/shadow/i, 'reading /etc/shadow'],
    [/cat\s+~\/\.ssh\/id_/i, 'reading SSH private key'],
    [/\$\([^)]*curl/i, 'command substitution with curl'],
    [/`[^`]*curl/i, 'backtick execution with curl'],
  ]
};

const MEDIUM_RISK_PATTERNS = {
  python: [
    [/ctypes\./i, 'ctypes usage - native code'],
    [/importlib\./i, 'dynamic import'],
    [/yaml\.load\s*\([^)]*(?!Loader\s*=\s*yaml\.SafeLoader)/i, 'unsafe yaml.load'],
  ],
  javascript: [
    [/require\s*\(\s*[a-zA-Z_][a-zA-Z0-9_]*\s*\)/i, 'dynamic require'],
  ],
  bash: [
    [/chmod\s+777/i, 'chmod 777 - insecure permissions'],
    [/\bsudo\s+/i, 'sudo usage'],
  ]
};

/**
 * Detect language from file extension
 */
function getLanguage(filepath) {
  const ext = path.extname(filepath).toLowerCase();
  const langMap = {
    '.py': 'python',
    '.sh': 'bash',
    '.bash': 'bash',
    '.js': 'javascript',
    '.mjs': 'javascript',
    '.ts': 'javascript',
  };
  return langMap[ext] || null;
}

/**
 * Scan file content for security patterns
 */
function scanContent(filepath, content, lang) {
  const findings = [];
  const lines = content.split('\n');
  
  // Check high-risk patterns
  const highPatterns = HIGH_RISK_PATTERNS[lang] || [];
  for (const [pattern, desc] of highPatterns) {
    lines.forEach((line, idx) => {
      if (pattern.test(line)) {
        findings.push({
          file: filepath,
          line: idx + 1,
          pattern: desc,
          severity: 'HIGH',
          content: line.trim().slice(0, 100)
        });
      }
    });
  }
  
  // Check medium-risk patterns
  const mediumPatterns = MEDIUM_RISK_PATTERNS[lang] || [];
  for (const [pattern, desc] of mediumPatterns) {
    lines.forEach((line, idx) => {
      if (pattern.test(line)) {
        findings.push({
          file: filepath,
          line: idx + 1,
          pattern: desc,
          severity: 'MEDIUM',
          content: line.trim().slice(0, 100)
        });
      }
    });
  }
  
  return findings;
}

/**
 * Recursively get all files in directory
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) {
    return arrayOfFiles;
  }
  
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  }
  
  return arrayOfFiles;
}

/**
 * Main scan function
 */
function scanSkill(skillPath) {
  const results = {
    skill_path: skillPath,
    scan_type: 'static',
    files_scanned: 0,
    findings: [],
    summary: {
      high: 0,
      medium: 0,
      low: 0
    }
  };
  
  const scriptsDir = path.join(skillPath, 'scripts');
  
  if (!fs.existsSync(scriptsDir)) {
    results.note = 'No scripts/ directory found';
    results.passed = true;
    return results;
  }
  
  const files = getAllFiles(scriptsDir);
  
  for (const filepath of files) {
    const lang = getLanguage(filepath);
    if (!lang) continue;
    
    results.files_scanned++;
    
    try {
      const content = fs.readFileSync(filepath, 'utf8');
      const relativePath = path.relative(skillPath, filepath);
      const findings = scanContent(relativePath, content, lang);
      results.findings.push(...findings);
    } catch (err) {
      results.findings.push({
        file: path.relative(skillPath, filepath),
        error: err.message,
        severity: 'LOW'
      });
    }
  }
  
  // Calculate summary
  for (const f of results.findings) {
    const sev = (f.severity || 'LOW').toLowerCase();
    if (sev in results.summary) {
      results.summary[sev]++;
    }
  }
  
  // Determine pass/fail
  results.passed = results.summary.high === 0;
  
  return results;
}

/**
 * Main entry point
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('Usage: node security_scan.js /path/to/skill');
    process.exit(2);
  }
  
  const skillPath = args[0];
  
  if (!fs.existsSync(skillPath)) {
    console.error(`Error: Path does not exist: ${skillPath}`);
    process.exit(2);
  }
  
  try {
    const results = scanSkill(skillPath);
    console.log(JSON.stringify(results, null, 2));
    process.exit(results.passed ? 0 : 1);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(2);
  }
}

main();
