/**
 * Static vulnerability and pattern analyzer.
 * Scans code for common OWASP vulnerabilities, hardcoded credentials, and obvious code smells.
 */
export const runStaticAnalysis = (code, language = "") => {
  const issues = [];
  const lines = code.split("\n");

  lines.forEach((lineText, index) => {
    const lineNum = index + 1;
    const line = lineText.trim();

    // 1. Hardcoded API Keys / Secrets / Passwords
    if (
      /(api[_-]?key|secret[_-]?key|aws[_-]?secret|password|passwd|auth[_-]?token)\s*=\s*["'][A-Za-z0-9_\-\.\/+=]{8,}["']/i.test(
        line
      ) &&
      !line.includes("process.env") &&
      !line.includes("os.environ") &&
      !line.includes("System.getenv")
    ) {
      issues.push({
        type: "Security",
        severity: "Critical",
        title: "Hardcoded Secret / Credentials",
        line: lineNum,
        explanation:
          "Hardcoded API keys, tokens, or passwords detected in source code.",
        impact:
          "Attackers extracting code or viewing repositories can gain unauthorized access to cloud services or backend APIs.",
        suggestion:
          "Store secrets in environment variables or a secure key management system (e.g. process.env or dotenv).",
        codeSnippet: `// Preferred:
const apiKey = process.env.API_KEY;`,
      });
    }

    // 2. SQL Injection
    if (
      /(SELECT|INSERT|UPDATE|DELETE|DROP)\s+.*(\+|\%|\.format|\$\{).*(FROM|WHERE|INTO|VALUES)/i.test(
        line
      ) ||
      /execute\s*\(\s*f["'].*(SELECT|INSERT|UPDATE|DELETE)/i.test(line)
    ) {
      issues.push({
        type: "Security",
        severity: "High",
        title: "SQL Injection Vulnerability",
        line: lineNum,
        explanation:
          "User input is directly concatenated or formatted into a raw SQL query string.",
        impact:
          "An attacker can manipulate the query logic to bypass authentication or extract sensitive database tables.",
        suggestion:
          "Use parameterized queries, prepared statements, or an ORM instead of string concatenation.",
        codeSnippet: `// Example: Use parameterized query
cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))`,
      });
    }

    // 3. Unsafe Eval Execution
    if (/\beval\s*\(/.test(line)) {
      issues.push({
        type: "Security",
        severity: "Critical",
        title: "Unsafe Code Execution (eval)",
        line: lineNum,
        explanation:
          "Use of eval() executes arbitrary input as code within the execution context.",
        impact:
          "Arbitrary Code Execution (ACE) allowing attackers to run malicious code or compromise system memory.",
        suggestion:
          "Avoid eval(). Use safe data parsing libraries like JSON.parse() or dedicated evaluation engines.",
        codeSnippet: `// Safe alternative:
const data = JSON.parse(jsonString);`,
      });
    }

    // 4. DOM XSS via innerHTML
    if (/\.innerHTML\s*=/.test(line)) {
      issues.push({
        type: "Security",
        severity: "High",
        title: "DOM Cross-Site Scripting (XSS)",
        line: lineNum,
        explanation:
          "Directly assigning unsanitized strings to innerHTML enables script injection.",
        impact:
          "Malicious scripts can run in the user's browser, hijacking sessions or stealing cookies.",
        suggestion:
          "Use textContent or innerText, or sanitize HTML with DOMPurify before inserting.",
        codeSnippet: `// Safe alternative:
element.textContent = userInput;`,
      });
    }

    // 5. Command Injection / Process Execution
    if (
      /Runtime\.getRuntime\(\)\.exec\(|subprocess\.call\(.*shell\s*=\s*True|os\.system\(/.test(
        line
      )
    ) {
      issues.push({
        type: "Security",
        severity: "Critical",
        title: "Command Injection Risk",
        line: lineNum,
        explanation:
          "Spawning shell processes with unescaped input strings allows command injection.",
        impact:
          "An attacker can inject OS shell commands (e.g. '; rm -rf /') with the privileges of the app.",
        suggestion:
          "Pass arguments as array vectors without shell execution, or sanitize input using strict allowlists.",
        codeSnippet: `// Safe alternative (array arguments):
execFile('ls', ['-la', userDir]);`,
      });
    }

    // 6. Bare Exception / Ignored Error Handling
    if (
      /except\s*:|catch\s*\([^)]*\)\s*\{\s*\}/.test(line) ||
      (line.startsWith("except:") && lines[index + 1]?.trim() === "pass")
    ) {
      issues.push({
        type: "Code Smell",
        severity: "Medium",
        title: "Empty or Ignored Exception Handler",
        line: lineNum,
        explanation:
          "Swallowing errors without logging or handling hides runtime failures.",
        impact:
          "Makes system failures difficult to debug and can leave the application in an unstable state.",
        suggestion:
          "Catch specific exceptions and log error context properly before gracefully degrading.",
        codeSnippet: `try {
  // operation
} catch (error) {
  console.error("Operation failed:", error);
}`,
      });
    }

    // 7. Weak Hashing / Cryptography
    if (/MessageDigest\.getInstance\s*\(\s*["']MD5["']\)|hashlib\.md5\(/.test(line)) {
      issues.push({
        type: "Security",
        severity: "High",
        title: "Weak Password Hashing Algorithm (MD5)",
        line: lineNum,
        explanation:
          "MD5 is cryptographically broken and vulnerable to collision and rainbow table attacks.",
        impact:
          "Hashed passwords can easily be reversed using precomputed lookup tables.",
        suggestion:
          "Use modern password hashing algorithms such as bcrypt, Argon2, or PBKDF2.",
        codeSnippet: `// Recommended:
const hash = await bcrypt.hash(password, 10);`,
      });
    }
  });

  return issues;
};
