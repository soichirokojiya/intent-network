import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "musu.world - ひとりだけど、ひとりじゃない。";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              backgroundColor: "#4A99E9",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              viewBox="0 0 40 40"
              width="40"
              height="40"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            >
              <path d="M12 28c0-8 4-14 8-14s8 6 8 14" />
            </svg>
          </div>
          <span style={{ fontSize: "48px", fontWeight: 800, color: "#111" }}>
            musu
          </span>
        </div>
        <h1
          style={{
            fontSize: "64px",
            fontWeight: 800,
            color: "#111",
            textAlign: "center",
            lineHeight: 1.3,
            margin: 0,
          }}
        >
          ひとりだけど、ひとりじゃない。
        </h1>
        <p
          style={{
            fontSize: "28px",
            color: "#9ca3af",
            marginTop: "24px",
          }}
        >
          AIが、あなたの仕事仲間になる。
        </p>
      </div>
    ),
    { ...size }
  );
}
