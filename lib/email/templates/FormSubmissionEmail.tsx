import * as React from "react";

interface FormSubmissionEmailProps {
  formType: string;
  submitterName: string;
  submitterEmail: string;
  formData: Record<string, any>;
  submittedAt: string;
}

export const FormSubmissionEmail: React.FC<FormSubmissionEmailProps> = ({
  formType,
  submitterName,
  submitterEmail,
  formData,
  submittedAt,
}) => (
  <html>
    <head>
      <style>{`
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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
        .header {
          text-align: center;
          margin-bottom: 32px;
        }
        .logo {
          font-size: 28px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        h1 {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 16px 0;
        }
        p {
          font-size: 16px;
          color: #475569;
          margin: 0 0 16px 0;
        }
        .info-box {
          background-color: #f8fafc;
          border-left: 4px solid #0f172a;
          padding: 16px;
          margin: 24px 0;
          border-radius: 4px;
        }
        .info-row {
          margin-bottom: 12px;
        }
        .info-label {
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 4px;
        }
        .info-value {
          color: #475569;
        }
        .data-section {
          margin: 24px 0;
          padding: 24px;
          background-color: #f8fafc;
          border-radius: 8px;
        }
        .data-item {
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e2e8f0;
        }
        .data-item:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }
        .footer {
          text-align: center;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 14px;
        }
      `}</style>
    </head>
    <body>
      <div className="container">
        <div className="card">
          <div className="header">
            <h1 className="logo">Perpetual Core</h1>
          </div>

          <h1>New {formType} Submission 📋</h1>

          <p>You've received a new form submission from your website.</p>

          <div className="info-box">
            <div className="info-row">
              <div className="info-label">Submitted By:</div>
              <div className="info-value">{submitterName}</div>
            </div>
            <div className="info-row">
              <div className="info-label">Email:</div>
              <div className="info-value">{submitterEmail}</div>
            </div>
            <div className="info-row">
              <div className="info-label">Submitted At:</div>
              <div className="info-value">{new Date(submittedAt).toLocaleString()}</div>
            </div>
          </div>

          <div className="data-section">
            <h2 style={{ fontSize: '18px', marginTop: 0, marginBottom: '16px' }}>Form Data</h2>
            {Object.entries(formData).map(([key, value]) => (
              <div key={key} className="data-item">
                <div className="info-label">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</div>
                <div className="info-value">{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</div>
              </div>
            ))}
          </div>

          <div className="footer">
            <p>
              © {new Date().getFullYear()} Perpetual Core. All rights reserved.<br />
              This is an automated notification from your website's form system.
            </p>
          </div>
        </div>
      </div>
    </body>
  </html>
);

export default FormSubmissionEmail;
