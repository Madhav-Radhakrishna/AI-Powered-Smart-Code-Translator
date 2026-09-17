export const DEMO_PRESETS = [
  {
    id: "python-security",
    label: "🐍 Python: Vulnerability & Bug Preset",
    language: "python",
    code: `import sqlite3

# 1. Hardcoded Secret / Key
AWS_SECRET_KEY = "AKIAIOSFODNN7EXAMPLE_SECRET_DO_NOT_COMMIT"
DB_PASSWORD = "SuperSecretAdminPassword123!"

def get_user_profile(user_id):
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    
    # 2. SQL Injection Vulnerability
    query = "SELECT * FROM users WHERE id = '" + str(user_id) + "'"
    cursor.execute(query)
    user = cursor.fetchone()

    # 3. Bug & Bare Exception Handling
    try:
        score = user[10] / 0 # Division by zero bug & index error
    except:
        pass # Swallowing errors silently

    return user
`,
  },
  {
    id: "js-xss-eval",
    label: "⚡ JavaScript: DOM XSS & Unsafe Eval",
    language: "javascript",
    code: `// 1. Hardcoded API Secret
const API_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret123";

function renderComment(userInput) {
  // 2. DOM Cross-Site Scripting (XSS)
  const container = document.getElementById("comments");
  container.innerHTML = "<div>" + userInput + "</div>";
}

function calculateDynamicExpr(userFormula) {
  // 3. Unsafe Eval Execution
  const result = eval(userFormula);
  return result;
}

// 4. Code Smell: Unused variable & empty catch
let unusedCounter = 0;
try {
  calculateDynamicExpr("2 + 2");
} catch(e) {}
`,
  },
  {
    id: "java-cmd-injection",
    label: "☕ Java: Command Injection & Weak Password Hashing",
    language: "java",
    code: `import java.security.MessageDigest;
import java.io.IOException;

public class SecurityDemo {
    // 1. Hardcoded DB Credentials
    private static final String DB_PASS = "AdminPass2026!";

    public static void executeBackup(String userFolder) throws IOException {
        // 2. Command Injection Vulnerability
        String command = "tar -czf backup.tar.gz " + userFolder;
        Runtime.getRuntime().exec(command);
    }

    public static String hashPassword(String password) throws Exception {
        // 3. Weak Cryptography (MD5)
        MessageDigest md = MessageDigest.getInstance("MD5");
        md.update(password.getBytes());
        byte[] bytes = md.digest();
        return new String(bytes);
    }
}
`,
  },
];
