import { useState } from "react";
import toast from "react-hot-toast";
import CodeEditor from "../components/CodeEditor.jsx";
import LanguageSelector from "../components/LanguageSelector.jsx";
import { reviewCode } from "../services/codeService.js";
import { DEMO_PRESETS } from "../constants/demoPresets.js";
import "../styles/review.css";

function CodeReviewPage() {
  const [code, setCode] = useState(DEMO_PRESETS[0].code);
  const [language, setLanguage] = useState(DEMO_PRESETS[0].language);
  const [selectedPreset, setSelectedPreset] = useState(DEMO_PRESETS[0].id);

  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState(null);

  // Handle preset change
  const handlePresetSelect = (presetId) => {
    setSelectedPreset(presetId);
    if (!presetId) return;
    const preset = DEMO_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setCode(preset.code);
      setLanguage(preset.language);
      setAuditResult(null);
      toast.success(`Loaded preset: ${preset.label}`);
    }
  };

  // Handle Clear
  const handleClear = () => {
    setCode("");
    setSelectedPreset("");
    setAuditResult(null);
  };

  // Execute Analysis
  const handleAnalyze = async () => {
    if (!code.trim()) {
      toast.error("Please enter or paste source code to analyze.");
      return;
    }

    setLoading(true);
    setAuditResult(null);

    try {
      const data = await reviewCode(code, language);
      setAuditResult(data);
      toast.success("Security & Bug Audit completed!");
    } catch (err) {
      console.error("Audit error:", err);
      const msg = err.response?.data?.message || "Audit failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-page">
      {/* Page Header */}
      <div className="review-header">
        <div className="review-header-title">
          <h1>🛡️ AI Code Review & Vulnerability Detection Agent</h1>
          <p>
            Static scanning & Gemini 3.6 Flash deep security audit for bugs,
            vulnerabilities, and code smells.
          </p>
        </div>

        {/* Preset Selector Dropdown */}
        <div className="preset-selector-container">
          <label htmlFor="preset-select" className="preset-label">
            💡 Quick Demo Presets:
          </label>
          <select
            id="preset-select"
            className="preset-dropdown"
            value={selectedPreset}
            onChange={(e) => handlePresetSelect(e.target.value)}
          >
            <option value="">-- Select Test Preset --</option>
            {DEMO_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="review-grid">
        {/* Left Column: Code Input Editor */}
        <div className="review-input-card">
          <div className="card-header">
            <div className="card-header-left">
              <span className="card-title">Source Code Input</span>
              <LanguageSelector
                value={language}
                onChange={(langId) => setLanguage(langId)}
              />
            </div>
            <div className="card-header-right">
              <button
                className="review-btn btn-secondary"
                onClick={handleClear}
                title="Clear Editor"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="card-editor-body">
            <CodeEditor
              code={code}
              onChange={setCode}
              language={language}
            />
          </div>

          <div className="card-footer">
            <button
              className="review-btn btn-primary"
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div
                    className="spinner"
                    style={{ width: "16px", height: "16px", borderWidth: "2px" }}
                  />
                  Auditing Code...
                </>
              ) : (
                "Run Security & Bug Audit"
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Audit Results & Summary */}
        <div className="review-output-card">
          <div className="card-header">
            <span className="card-title">Audit Results & Vulnerability Report</span>
            {auditResult && (
              <span className="audit-total-badge">
                {auditResult.issues?.length || 0} Total Finding(s)
              </span>
            )}
          </div>

          <div className="card-output-body">
            {loading ? (
              <div className="review-loading-state">
                <div className="spinner-large" />
                <h3>Analyzing Source Code</h3>
                <p>Running static pattern scans & Gemini 3.6 Flash deep security inspection...</p>
              </div>
            ) : !auditResult ? (
              <div className="review-empty-state">
                <div className="empty-shield-icon">🛡️</div>
                <h3>No Audit Results Yet</h3>
                <p>
                  Paste code in the left editor or select a demo preset above, then click{" "}
                  <strong>Run Security & Bug Audit</strong> to evaluate bugs and vulnerabilities.
                </p>
              </div>
            ) : (
              <div className="audit-report">
                {/* Summary Counter Grid */}
                <div className="summary-grid">
                  <div className="summary-card critical">
                    <span className="summary-count">
                      {auditResult.summary?.critical || 0}
                    </span>
                    <span className="summary-label">Critical</span>
                  </div>
                  <div className="summary-card high">
                    <span className="summary-count">
                      {auditResult.summary?.high || 0}
                    </span>
                    <span className="summary-label">High</span>
                  </div>
                  <div className="summary-card medium">
                    <span className="summary-count">
                      {auditResult.summary?.medium || 0}
                    </span>
                    <span className="summary-label">Medium</span>
                  </div>
                  <div className="summary-card low">
                    <span className="summary-count">
                      {auditResult.summary?.low || 0}
                    </span>
                    <span className="summary-label">Low</span>
                  </div>
                </div>

                {/* Clean Code Banner if no issues */}
                {auditResult.issues?.length === 0 ? (
                  <div className="clean-code-banner">
                    <div className="banner-icon">✨</div>
                    <div className="banner-text">
                      <h4>Clean Code Detected</h4>
                      <p>No critical bugs, security vulnerabilities, or code smells were found in this source file.</p>
                    </div>
                  </div>
                ) : (
                  <div className="issues-list">
                    {auditResult.issues.map((issue, idx) => (
                      <div
                        className={`issue-card severity-${(
                          issue.severity || "medium"
                        ).toLowerCase()}`}
                        key={idx}
                      >
                        <div className="issue-card-header">
                          <div className="issue-header-meta">
                            <span
                              className={`severity-badge badge-${(
                                issue.severity || "medium"
                              ).toLowerCase()}`}
                            >
                              {issue.severity || "Medium"}
                            </span>
                            <span className="type-badge">{issue.type || "Bug"}</span>
                            {issue.line && (
                              <span className="line-badge">Line {issue.line}</span>
                            )}
                          </div>
                          <h4 className="issue-title">{issue.title}</h4>
                        </div>

                        <div className="issue-body">
                          {/* Explanation */}
                          <div className="issue-block">
                            <span className="block-label">📖 Explanation:</span>
                            <p className="block-content">{issue.explanation}</p>
                          </div>

                          {/* Impact */}
                          {issue.impact && (
                            <div className="issue-block">
                              <span className="block-label">⚠️ Potential Impact:</span>
                              <p className="block-content impact-text">{issue.impact}</p>
                            </div>
                          )}

                          {/* Suggested Improvement */}
                          {issue.suggestion && (
                            <div className="issue-block">
                              <span className="block-label">💡 Suggested Improvement:</span>
                              <p className="block-content fix-text">{issue.suggestion}</p>
                            </div>
                          )}

                          {/* Code Snippet */}
                          {issue.codeSnippet && (
                            <div className="issue-snippet-box">
                              <span className="block-label">🔧 Corrected Code Example:</span>
                              <pre className="snippet-code">
                                <code>{issue.codeSnippet}</code>
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodeReviewPage;
