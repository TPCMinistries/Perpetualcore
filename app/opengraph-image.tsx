import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Perpetual Core - AI-Powered Knowledge Platform";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
        }}
      >
        {/* Grid pattern background */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />

        {/* Glowing orb */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            right: "15%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            position: "relative",
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100px",
              height: "100px",
              borderRadius: "24px",
              background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
              marginBottom: "40px",
              boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)",
            }}
          >
            <span
              style={{
                fontSize: "48px",
                fontWeight: "bold",
                color: "white",
              }}
            >
              AI
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: "72px",
              fontWeight: "bold",
              color: "white",
              margin: "0 0 20px 0",
              letterSpacing: "-2px",
            }}
          >
            Perpetual Core
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "32px",
              color: "#94a3b8",
              margin: "0 0 40px 0",
              maxWidth: "900px",
              lineHeight: "1.4",
            }}
          >
            AI-Powered Knowledge Platform with Persistent Memory
          </p>

          {/* Feature badges */}
          <div
            style={{
              display: "flex",
              gap: "16px",
            }}
          >
            {["RAG Search", "AI Agents", "Multi-Model AI", "Team Collaboration"].map((feature) => (
              <div
                key={feature}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 24px",
                  borderRadius: "100px",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <span
                  style={{
                    fontSize: "18px",
                    color: "#e2e8f0",
                    fontWeight: "500",
                  }}
                >
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom gradient */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "200px",
            background: "linear-gradient(to top, rgba(15, 23, 42, 0.8) 0%, transparent 100%)",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
