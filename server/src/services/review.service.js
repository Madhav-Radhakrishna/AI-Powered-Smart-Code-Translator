import { askGemini } from "./gemini.service.js";
import { CODE_REVIEW_PROMPT } from "../constants/prompts.js";
import { parseGeminiJSON } from "../utils/prompts.utils.js";
import { getLanguageName } from "../constants/languages.js";
import { runStaticAnalysis } from "../utils/staticAnalyzer.js";

export const reviewCode = async (code, language) => {
  const langName = getLanguageName(language) || language;

  // 1. Run deterministic static checks
  const staticIssues = runStaticAnalysis(code, language);

  // 2. Call Gemini AI for contextual deep review
  let aiResult = { summary: { critical: 0, high: 0, medium: 0, low: 0 }, issues: [] };
  try {
    const prompt = CODE_REVIEW_PROMPT(code, langName);
    const rawResponse = await askGemini(prompt);
    aiResult = parseGeminiJSON(rawResponse);
  } catch (err) {
    console.warn("Gemini review failed, falling back to static analysis:", err.message);
  }

  const mergedIssues = [...(aiResult.issues || [])];

  // Merge static analysis results avoiding duplicate titles on the same line
  for (const sIssue of staticIssues) {
    const isDuplicate = mergedIssues.some(
      (aiIssue) =>
        aiIssue.title?.toLowerCase() === sIssue.title?.toLowerCase() &&
        (aiIssue.line === sIssue.line || !sIssue.line)
    );

    if (!isDuplicate) {
      mergedIssues.unshift(sIssue);
    }
  }

  // Normalize issue fields
  const normalizedIssues = mergedIssues.map((issue) => ({
    type: issue.type || "Bug",
    severity: ["Critical", "High", "Medium", "Low"].includes(issue.severity)
      ? issue.severity
      : "Medium",
    title: issue.title || issue.issue || "Code Issue Detected",
    line: typeof issue.line === "number" ? issue.line : null,
    explanation: issue.explanation || issue.issue || "No detailed explanation provided.",
    impact: issue.impact || "May cause unhandled errors or quality degradation.",
    suggestion: issue.suggestion || issue.fix || "Review and refactor code logic.",
    codeSnippet: issue.codeSnippet || null,
  }));

  // Recalculate summary counts
  const summary = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  normalizedIssues.forEach((item) => {
    const sev = item.severity.toLowerCase();
    if (summary[sev] !== undefined) {
      summary[sev] += 1;
    } else {
      summary.medium += 1;
    }
  });

  return {
    summary,
    issues: normalizedIssues,
  };
};
