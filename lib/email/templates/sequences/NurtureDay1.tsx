import * as React from "react";

interface NurtureDay1Props {
  firstName: string;
  leadMagnetName: string;
  leadMagnetUrl: string;
}

export const NurtureDay1: React.FC<NurtureDay1Props> = ({
  firstName,
  leadMagnetName,
  leadMagnetUrl,
}) => (
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
        .highlight-box {
          background-color: #f8fafc;
          border-left: 4px solid #0f172a;
          padding: 20px;
          margin: 24px 0;
          border-radius: 4px;
        }
        ul {
          margin: 16px 0;
          padding-left: 20px;
        }
        li {
          margin: 8px 0;
          color: #475569;
        }
      `}</style>
    </head>
    <body>
      <div className="container">
        <div className="card">
          <h1>Welcome, {firstName}! 👋</h1>

          <p>
            Thank you for downloading <strong>{leadMagnetName}</strong>! I'm excited to help you discover how AI can transform your workflow.
          </p>

          <div style={{ textAlign: 'center', margin: '32px 0' }}>
            <a href={leadMagnetUrl} className="button">
              📥 Download {leadMagnetName}
            </a>
          </div>

          <div className="highlight-box">
            <p style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>What to expect next:</p>
            <ul style={{ marginBottom: 0 }}>
              <li>Practical AI tips you can implement today</li>
              <li>Real-world case studies and success stories</li>
              <li>Exclusive tools and templates</li>
              <li>No fluff, just actionable insights</li>
            </ul>
          </div>

          <p>
            Over the next week, I'll share strategies that have helped thousands of businesses like yours save time, reduce costs, and scale with AI.
          </p>

          <p>
            <strong>Quick question:</strong> What's your biggest challenge with AI right now?
          </p>

          <p>
            Hit reply and let me know - I read every response personally.
          </p>

          <p style={{ marginTop: 32 }}>
            To your success,<br />
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

export default NurtureDay1;
