import * as React from "react";

interface ContactFormEmailProps {
  name: string;
  email: string;
  subject?: string;
  message: string;
  phone?: string;
  company?: string;
}

export const ContactFormEmail: React.FC<ContactFormEmailProps> = ({
  name,
  email,
  subject,
  message,
  phone,
  company,
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
        .badge {
          display: inline-block;
          background-color: #0f172a;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        .info-box {
          background-color: #f8fafc;
          border-radius: 8px;
          padding: 20px;
          margin: 24px 0;
        }
        .info-row {
          display: flex;
          margin-bottom: 12px;
        }
        .info-row:last-child {
          margin-bottom: 0;
        }
        .info-label {
          font-weight: 600;
          color: #0f172a;
          min-width: 100px;
        }
        .info-value {
          color: #475569;
          flex: 1;
        }
        .message-box {
          background-color: #f8fafc;
          border-left: 4px solid #0f172a;
          padding: 20px;
          margin: 24px 0;
          border-radius: 4px;
        }
        .message-label {
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 8px;
        }
        .message-content {
          color: #475569;
          white-space: pre-wrap;
          word-wrap: break-word;
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

          <div className="badge">NEW CONTACT</div>
          <h1>{subject || "New Contact Form Submission"}</h1>

          <div className="info-box">
            <div className="info-row">
              <div className="info-label">Name:</div>
              <div className="info-value">{name}</div>
            </div>
            <div className="info-row">
              <div className="info-label">Email:</div>
              <div className="info-value">
                <a href={`mailto:${email}`} style={{ color: '#0f172a', textDecoration: 'none' }}>
                  {email}
                </a>
              </div>
            </div>
            {phone && (
              <div className="info-row">
                <div className="info-label">Phone:</div>
                <div className="info-value">
                  <a href={`tel:${phone}`} style={{ color: '#0f172a', textDecoration: 'none' }}>
                    {phone}
                  </a>
                </div>
              </div>
            )}
            {company && (
              <div className="info-row">
                <div className="info-label">Company:</div>
                <div className="info-value">{company}</div>
              </div>
            )}
            <div className="info-row">
              <div className="info-label">Received:</div>
              <div className="info-value">{new Date().toLocaleString()}</div>
            </div>
          </div>

          <div className="message-box">
            <div className="message-label">Message:</div>
            <div className="message-content">{message}</div>
          </div>

          <div style={{
            background: '#f8fafc',
            padding: '16px',
            borderRadius: '8px',
            marginTop: '24px'
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
              💡 <strong>Quick Actions:</strong><br />
              Reply to {email} to start the conversation
            </p>
          </div>

          <div className="footer">
            <p>
              © {new Date().getFullYear()} Perpetual Core. All rights reserved.<br />
              This message was sent from your website's contact form.
            </p>
          </div>
        </div>
      </div>
    </body>
  </html>
);

export default ContactFormEmail;
