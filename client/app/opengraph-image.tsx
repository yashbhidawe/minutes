import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Minutes — Meeting notes, automatically.";

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
          backgroundColor: "#171717",
          color: "#fafafa",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "36px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "16px",
              backgroundColor: "#fafafa",
              color: "#171717",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "44px",
              fontWeight: 800,
            }}
          >
            M
          </div>
          <div style={{ fontSize: "28px", letterSpacing: "8px", color: "#a3a3a3" }}>
            minutes
          </div>
        </div>
        <div style={{ fontSize: "84px", lineHeight: 1.05, fontWeight: 300 }}>
          Meeting notes,
          <br />
          <span style={{ fontWeight: 700 }}>automatically.</span>
        </div>
        <div style={{ marginTop: "32px", fontSize: "30px", color: "#a3a3a3" }}>
          Summaries, decisions &amp; action items for Google Meet.
        </div>
      </div>
    ),
    { ...size }
  );
}
