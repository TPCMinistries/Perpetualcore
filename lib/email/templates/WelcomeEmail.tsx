import * as React from "react";

interface WelcomeEmailProps {
  userName: string;
  userEmail: string;
  loginUrl: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  userName,
  userEmail,
  loginUrl,
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
        .button {
          display: inline-block;
          background-color: #0f172a;
          color: white;
          text-decoration: none;
          padding: 14px 32px;
          border-radius: 8px;
          font-weight: 600;
          margin: 24px 0;
        }
        .features {
          margin: 32px 0;
          padding: 24px;
          background-color: #f8fafc;
          border-radius: 8px;
        }
        .feature {
          margin-bottom: 16px;
        }
        .feature-title {
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 4px;
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

          <h1>Welcome to Perpetual Core! 🎉</h1>

          <p>Hi {userName},</p>

          <p>
            We're thrilled to have you join Perpetual Core! Your account has been successfully created,
            and you now have access to our powerful AI-powered platform.
          </p>

          <div style={{ textAlign: 'center' }}>
            <a href={loginUrl} className="button">
              Get Started
            </a>
          </div>

          <div className="features">
            <div className="feature">
              <div className="feature-title">🤖 AI Assistant</div>
              <p style={{ margin: 0, fontSize: '14px' }}>
                Chat with advanced AI models to boost your productivity
              </p>
            </div>

            <div className="feature">
              <div className="feature-title">📄 Document Management</div>
              <p style={{ margin: 0, fontSize: '14px' }}>
                Upload, analyze, and generate documents with AI assistance
              </p>
            </div>

            <div className="feature">
              <div className="feature-title">👥 Team Collaboration</div>
              <p style={{ margin: 0, fontSize: '14px' }}>
                Work together with your team in AI-powered conversations
              </p>
            </div>

            <div className="feature">
              <div className="feature-title">📊 Analytics & Insights</div>
              <p style={{ margin: 0, fontSize: '14px' }}>
                Track your usage and gain insights from your AI interactions
              </p>
            </div>
          </div>

          <p>
            <strong>Your account details:</strong><br />
            Email: {userEmail}
          </p>

          <p>
            If you have any questions or need assistance, don't hesitate to reach out to our support team.
          </p>

          <div className="footer">
            <p>
              © {new Date().getFullYear()} Perpetual Core. All rights reserved.<br />
              You're receiving this email because you created an account at Perpetual Core.
            </p>
          </div>
        </div>
      </div>
    </body>
  </html>
);

export default WelcomeEmail;
