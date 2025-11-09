import * as React from "react";

interface SalesDay1Props {
  firstName: string;
}

export const SalesDay1: React.FC<SalesDay1Props> = ({ firstName }) => (
  <html>
    <head>
      <style>{`
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #1e293b;
          margin: 0;
          padding: 0;
          background-color: #f8fafc;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .card {
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        h1 {
          font-size: 28px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 24px 0;
        }
        h2 {
          font-size: 20px;
          font-weight: 600;
          color: #0f172a;
          margin: 24px 0 12px 0;
        }
        p {
          font-size: 16px;
          color: #475569;
          margin: 0 0 16px 0;
        }
        .button {
          display: inline-block;
          background-color: #0f172a;
          color: white;
          text-decoration: none;
          padding: 16px 32px;
          border-radius: 8px;
          font-weight: 600;
          margin: 24px 0;
          font-size: 16px;
        }
        .stat-box {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 24px;
          border-radius: 8px;
          margin: 24px 0;
          text-align: center;
        }
        .stat-number {
          font-size: 48px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .stat-label {
          font-size: 14px;
          color: #64748b;
          margin: 8px 0 0 0;
        }
        .feature {
          display: flex;
          gap: 16px;
          margin: 16px 0;
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
        }
        .feature-icon {
          font-size: 24px;
          flex-shrink: 0;
        }
      `}</style>
    </head>
    <body>
      <div className="container">
        <div className="card">
          <h1>Your AI transformation starts here, {firstName}</h1>

          <p>
            You downloaded our guide because you're smart enough to know that AI isn't just hype - it's the future of how work gets done.
          </p>

          <p>
            But here's the truth most people don't tell you:
          </p>

          <p style={{ fontWeight: 600, fontSize: 18, color: '#0f172a' }}>
            Having access to AI tools and <em>knowing how to use them effectively</em> are two completely different things.
          </p>

          <div className="stat-box">
            <p className="stat-number">73%</p>
            <p className="stat-label">
              of businesses struggle to implement AI effectively<br />
              <span style={{ fontSize: 12 }}>(Harvard Business Review, 2024)</span>
            </p>
          </div>

          <p>
            That's where Perpetual Core comes in. We've built the <strong>only platform</strong> that combines:
          </p>

          <div className="feature">
            <div className="feature-icon">🤖</div>
            <div>
              <strong>Advanced AI Models</strong><br />
              <span style={{ fontSize: 14, color: '#64748b' }}>
                Access GPT-4, Claude, Gemini, and more in one place
              </span>
            </div>
          </div>

          <div className="feature">
            <div className="feature-icon">📚</div>
            <div>
              <strong>Your Knowledge Base</strong><br />
              <span style={{ fontSize: 14, color: '#64748b' }}>
                Train AI on your documents, data, and processes
              </span>
            </div>
          </div>

          <div className="feature">
            <div className="feature-icon">👥</div>
            <div>
              <strong>Team Collaboration</strong><br />
              <span style={{ fontSize: 14, color: '#64748b' }}>
                Work together with AI-powered conversations and workflows
              </span>
            </div>
          </div>

          <div className="feature">
            <div className="feature-icon">⚡</div>
            <div>
              <strong>Automation Engine</strong><br />
              <span style={{ fontSize: 14, color: '#64748b' }}>
                Automate repetitive tasks and save 20+ hours per week
              </span>
            </div>
          </div>

          <p style={{ marginTop: 32 }}>
            <strong>Here's what I want you to do next:</strong>
          </p>

          <div style={{ textAlign: 'center' }}>
            <a href="https://www.perpetualcore.com/demo" className="button">
              📅 Book a 15-Minute Demo
            </a>
          </div>

          <p style={{ fontSize: 14, color: '#64748b', textAlign: 'center' }}>
            See exactly how Perpetual Core can transform your workflow
          </p>

          <p style={{ marginTop: 32 }}>
            Tomorrow, I'll show you a 2-minute demo video that breaks down exactly how this works.
          </p>

          <p>
            Talk soon,<br />
            <strong>The Perpetual Core Team</strong>
          </p>

          <div style={{
            marginTop: 40,
            paddingTop: 24,
            borderTop: '1px solid #e2e8f0',
            textAlign: 'center',
            fontSize: 14,
            color: '#64748b'
          }}>
            <p>
              Perpetual Core • AI-Powered Productivity Platform<br />
              © {new Date().getFullYear()} All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </body>
  </html>
);

export default SalesDay1;
