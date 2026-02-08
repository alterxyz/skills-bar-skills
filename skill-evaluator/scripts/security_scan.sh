#!/bin/bash
#
# Security scanner for Agent Skills (Bash version)
# Scans scripts/ directory for high-risk patterns.
#
# Usage:
#   ./security_scan.sh /path/to/skill
#
# Output:
#   JSON with scan results (to stdout)
#
# Exit codes:
#   0 = passed (no HIGH findings)
#   1 = failed (HIGH findings found)
#   2 = error
#
# Note: This is a basic implementation for CI/CD quick checks.
#       For comprehensive analysis, use Python/JS version or LLM scan.
#
# Spec: See references/security-scan-spec.md

set -e

# High-risk patterns (grep -E compatible)
# Format: "pattern|description"
HIGH_RISK_PATTERNS=(
    # Python
    'eval\s*\(|eval() - arbitrary code execution'
    'exec\s*\(|exec() - arbitrary code execution'
    '__import__\s*\(|dynamic import - potential code injection'
    'compile\s*\([^)]+['"'"'"]exec['"'"'"]\s*\)|compile with exec mode'
    'os\.system\s*\(|os.system() - shell command execution'
    'subprocess\.call\s*\([^)]*shell\s*=\s*True|subprocess with shell=True'
    'subprocess\.Popen\s*\([^)]*shell\s*=\s*True|Popen with shell=True'
    'subprocess\.run\s*\([^)]*shell\s*=\s*True|subprocess.run with shell=True'
    'requests\.(post|put|patch)\s*\(|external data transmission'
    'urllib\.request\.urlopen|URL open - potential SSRF'
    'socket\.connect\s*\(|raw socket connection'
    'base64\.b64decode\s*\([^)]+\).*exec|base64 decode with execution'
    'pickle\.load|pickle.load - arbitrary code execution'
    'yaml\.load\s*\([^)]*$|unsafe yaml.load'
    # JavaScript
    'new\s+Function\s*\(|Function constructor - code execution'
    'child_process\.(exec|execSync)\s*\(|shell command execution'
    'child_process\.spawn\s*\([^)]*shell:\s*true|spawn with shell option'
    'require\s*\(\s*['"'"'"]child_process|importing child_process'
    'fs\.(readFileSync|readFile)\s*\([^)]*(/etc/|~/.ssh|~/.aws)|reading sensitive files'
    # Bash
    'rm\s+-rf\s+/|rm -rf on root path'
    'rm\s+-rf\s+\*|rm -rf with wildcard'
    'curl\s+[^|]+\|\s*(ba)?sh|curl piped to shell'
    'wget\s+[^|]+\|\s*(ba)?sh|wget piped to shell'
    '\beval\s+|bash eval command'
    'cat\s+/etc/passwd|reading /etc/passwd'
    'cat\s+/etc/shadow|reading /etc/shadow'
    'cat\s+~/.ssh/id_|reading SSH private key'
    '\$\([^)]*curl|command substitution with curl'
    '`[^`]*curl|backtick execution with curl'
    # Sensitive paths
    '['"'"'"]/etc/|access to /etc/ system directory'
    '['"'"'"]/root/|access to /root/ directory'
    '['"'"'"]~/.ssh/|access to SSH keys'
    '['"'"'"]~/.aws/|access to AWS credentials'
    '['"'"'"]~/.config/|access to user config'
    '\.env['"'"'"\\s]|access to .env file'
)

MEDIUM_RISK_PATTERNS=(
    'pickle\.load|pickle deserialization'
    'yaml\.load|unsafe yaml.load'
    'chmod\s+777|insecure permissions'
    '\bsudo\b|sudo usage'
)

# Globals
SKILL_PATH=""
FILES_SCANNED=0
HIGH_COUNT=0
MEDIUM_COUNT=0
FINDINGS=""

usage() {
    echo "Usage: $0 /path/to/skill" >&2
    exit 2
}

# Check if file should be scanned based on extension
should_scan() {
    local file="$1"
    case "$file" in
        *.py|*.js|*.mjs|*.ts|*.sh|*.bash)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# Escape string for JSON
json_escape() {
    local str="$1"
    str="${str//\\/\\\\}"
    str="${str//\"/\\\"}"
    str="${str//$'\n'/\\n}"
    str="${str//$'\r'/\\r}"
    str="${str//$'\t'/\\t}"
    echo "$str"
}

# Add finding to results
add_finding() {
    local file="$1"
    local line="$2"
    local pattern="$3"
    local severity="$4"
    local content="$5"
    
    # Truncate content
    content="${content:0:100}"
    content=$(json_escape "$content")
    pattern=$(json_escape "$pattern")
    
    if [ -n "$FINDINGS" ]; then
        FINDINGS="$FINDINGS,"
    fi
    
    FINDINGS="$FINDINGS
    {
      \"file\": \"$file\",
      \"line\": $line,
      \"pattern\": \"$pattern\",
      \"severity\": \"$severity\",
      \"content\": \"$content\"
    }"
}

# Scan a single file
scan_file() {
    local filepath="$1"
    local relative_path="${filepath#$SKILL_PATH/}"
    
    ((FILES_SCANNED++)) || true
    
    # Check high-risk patterns
    for entry in "${HIGH_RISK_PATTERNS[@]}"; do
        local pattern="${entry%%|*}"
        local desc="${entry#*|}"
        
        # Use grep to find matches with line numbers
        while IFS=: read -r linenum content; do
            if [ -n "$linenum" ]; then
                add_finding "$relative_path" "$linenum" "$desc" "HIGH" "$content"
                ((HIGH_COUNT++)) || true
            fi
        done < <(grep -n -E "$pattern" "$filepath" 2>/dev/null || true)
    done
    
    # Check medium-risk patterns
    for entry in "${MEDIUM_RISK_PATTERNS[@]}"; do
        local pattern="${entry%%|*}"
        local desc="${entry#*|}"
        
        while IFS=: read -r linenum content; do
            if [ -n "$linenum" ]; then
                add_finding "$relative_path" "$linenum" "$desc" "MEDIUM" "$content"
                ((MEDIUM_COUNT++)) || true
            fi
        done < <(grep -n -E "$pattern" "$filepath" 2>/dev/null || true)
    done
}

# Main scan function
scan_skill() {
    local scripts_dir="$SKILL_PATH/scripts"
    
    if [ ! -d "$scripts_dir" ]; then
        # No scripts directory - pass
        cat << EOF
{
  "skill_path": "$SKILL_PATH",
  "scan_type": "static",
  "files_scanned": 0,
  "passed": true,
  "note": "No scripts/ directory found",
  "findings": [],
  "summary": {"high": 0, "medium": 0, "low": 0}
}
EOF
        return 0
    fi
    
    # Find and scan all relevant files
    while IFS= read -r -d '' file; do
        if should_scan "$file"; then
            scan_file "$file"
        fi
    done < <(find "$scripts_dir" -type f -print0 2>/dev/null)
    
    # Determine pass/fail
    local passed="true"
    if [ "$HIGH_COUNT" -gt 0 ]; then
        passed="false"
    fi
    
    # Output JSON
    cat << EOF
{
  "skill_path": "$SKILL_PATH",
  "scan_type": "static",
  "files_scanned": $FILES_SCANNED,
  "passed": $passed,
  "findings": [$FINDINGS
  ],
  "summary": {
    "high": $HIGH_COUNT,
    "medium": $MEDIUM_COUNT,
    "low": 0
  }
}
EOF
    
    if [ "$passed" = "true" ]; then
        return 0
    else
        return 1
    fi
}

# Main
main() {
    if [ $# -lt 1 ]; then
        usage
    fi
    
    SKILL_PATH="$1"
    
    if [ ! -d "$SKILL_PATH" ]; then
        echo "Error: Path does not exist: $SKILL_PATH" >&2
        exit 2
    fi
    
    # Remove trailing slash
    SKILL_PATH="${SKILL_PATH%/}"
    
    scan_skill
}

main "$@"
