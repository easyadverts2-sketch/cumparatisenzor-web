import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "52px 60px",
          background:
            "linear-gradient(120deg, #6f2147 0%, #a22d53 45%, #df5b42 100%)",
          color: "#fff",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 34,
            fontWeight: 700,
          }}
        >
          <div
            style={{
              height: 56,
              width: 56,
              borderRadius: 999,
              background: "rgba(255,255,255,0.92)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#a22d53",
              fontWeight: 800,
            }}
          >
            SL
          </div>
          <span>Senzori Libre Romania</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 62,
              lineHeight: 1.06,
              fontWeight: 800,
              letterSpacing: -1.1,
              maxWidth: 980,
            }}
          >
            FreeStyle Libre 2 Plus
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.28,
              color: "rgba(255, 236, 224, 0.96)",
              maxWidth: 980,
            }}
          >
            Comanda online, livrare in Romania, plata ramburs, transfer sau card.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
