import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Minutes — Install the Chrome extension in 2 minutes.";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "96px",
          backgroundColor: "#1c1917",
          color: "#fafaf9",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "36px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "16px",
              backgroundColor: "#fafaf9",
              color: "#1c1917",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "44px",
              fontWeight: 800,
            }}
          >
            M
          </div>
          <div style={{ fontSize: "28px", letterSpacing: "8px", color: "#a8a29e" }}>
            minutes
          </div>
        </div>
        <div style={{ fontSize: "80px", lineHeight: 1.05, fontWeight: 300 }}>
          Install in <span style={{ fontWeight: 700 }}>2 minutes.</span>
        </div>
        <div style={{ marginTop: "32px", fontSize: "30px", color: "#a8a29e" }}>
          Free manual setup for Chrome, Edge and Brave.
        </div>
      </div>
    ),
    { ...size }
  );
}
