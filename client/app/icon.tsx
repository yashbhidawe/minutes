import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#171717",
          borderRadius: "112px",
          color: "#fafafa",
          fontSize: "300px",
          fontWeight: 800,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        M
      </div>
    ),
    {
      ...size,
    }
  );
}
