import * as React from "react";

/**
 * Day-1 nurture email. Fires when a lead is captured via /lead-magnet,
 * /newsletter capture, or any /api/leads/capture entry point with a magnet.
 *
 * Voice: Lorenzo, direct, no emoji, no exclamation theater. Tone matches
 * the studio register on the marketing site so the first email doesn't
 * feel like a different company wrote it.
 */

interface NurtureDay1Props {
  firstName: string;
  leadMagnetName: string;
  leadMagnetUrl: string;
}

const SITE_BASE = "https://www.perpetualcore.com";

export const NurtureDay1: React.FC<NurtureDay1Props> = ({
  firstName,
  leadMagnetName,
  leadMagnetUrl,
}) => {
  const fullGuideUrl = leadMagnetUrl.startsWith("http")
    ? leadMagnetUrl
    : `${SITE_BASE}${leadMagnetUrl}`;

  return (
    <html>
      <head>
        <style>{`
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.65;
            color: #0f1115;
            margin: 0;
            padding: 0;
            background-color: #fafaf9;
          }
          .container {
            max-width: 580px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .card {
            background: #ffffff;
            border: 1px solid #e7e5e4;
            padding: 40px;
          }
          .eyebrow {
            font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
            font-size: 10px;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: #78716c;
            margin: 0 0 24px 0;
          }
          h1 {
            font-size: 22px;
            font-weight: 600;
            color: #0f1115;
            margin: 0 0 24px 0;
            letter-spacing: -0.01em;
          }
          p {
            font-size: 15px;
            color: #44403c;
            margin: 0 0 18px 0;
          }
          a {
            color: #0f1115;
            text-decoration: underline;
          }
          .button {
            display: inline-block;
            background-color: #0f1115;
            color: #ffffff;
            text-decoration: none;
            padding: 12px 24px;
            font-weight: 500;
            font-size: 14px;
            border-radius: 6px;
            margin: 8px 0;
          }
          .button:hover {
            background-color: #2a2a2a;
          }
          .divider {
            border: none;
            border-top: 1px solid #e7e5e4;
            margin: 32px 0;
          }
          .meta {
            font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
            font-size: 11px;
            color: #78716c;
            margin: 24px 0 0 0;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="card">
            <p className="eyebrow">Perpetual Core · Welcome</p>

            <h1>Welcome, {firstName}.</h1>

            <p>
              Thanks for picking up <strong>{leadMagnetName}</strong>. I wrote
              it because the same conversations kept repeating on my own first
              sales calls — operators trying to figure out whether $5K, $75K,
              or $500K was the real number for what they were quoted.
            </p>

            <p>If you haven't opened it yet:</p>

            <p style={{ margin: "20px 0" }}>
              <a href={fullGuideUrl} className="button">
                Read the guide →
              </a>
            </p>

            <hr className="divider" />

            <p>
              <strong>What I'd do if I were you:</strong>
            </p>

            <p>
              Read sections 1 and 2 first — cost buckets and outcome-eval.
              They're the load-bearing parts. The rest you can skim. Use it
              to evaluate any vendor — me included.
            </p>

            <p>
              If you're already at the point where you want a written
              outcome-eval scope for your specific install, that's what{" "}
              <a href={`${SITE_BASE}/products/atlas-discovery`}>
                Atlas Discovery
              </a>{" "}
              is — from $25K, two to three weeks, a real document your CFO can co-sign.
              The discovery fee credits back if you proceed to a full
              engagement.
            </p>

            <p>
              If the right answer for you is &ldquo;not yet&rdquo; — section 5
              of the guide names four signals — that&apos;s a real outcome too.
              I&apos;d rather you defer than hire us at the wrong moment.
            </p>

            <hr className="divider" />

            <p>
              You&apos;ll get a few more emails over the next week with
              specific angles — outcome-eval in practice, what a working
              vendor proposal looks like, how to negotiate a kill clause.
              Unsubscribe any time; no offense taken.
            </p>

            <p>
              Reply to this one with the workflow you&apos;re considering and
              I&apos;ll tell you, frankly, what it should cost.
            </p>

            <p style={{ marginTop: 28 }}>
              — Lorenzo
              <br />
              <span style={{ color: "#78716c", fontSize: 13 }}>
                Founder, Perpetual Core
              </span>
            </p>

            <p className="meta">
              <a href={SITE_BASE} style={{ color: "#78716c" }}>
                perpetualcore.com
              </a>{" "}
              ·{" "}
              <a href={`${SITE_BASE}/engine`} style={{ color: "#78716c" }}>
                10–15% of every dollar funds IHA
              </a>
            </p>
          </div>

          <div
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "#78716c",
              marginTop: 24,
              padding: "0 20px",
              lineHeight: 1.6,
            }}
          >
            <p style={{ margin: 0, color: "#78716c", fontSize: 12 }}>
              Perpetual Core LLC · Studio, fund, and institute
              <br />
              An AI-first studio under Lorenzo Daughtry-Chambers
            </p>
          </div>
        </div>
      </body>
    </html>
  );
};

export default NurtureDay1;
