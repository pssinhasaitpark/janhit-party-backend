import PDFDocument from "pdfkit";
import path from "path";
import https from "https";
import http from "http";

const fetchImageBuffer = (url) =>
  new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client
      .get(url, (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      })
      .on("error", reject);
  });

export const generateMemberPDF = async (member) => {
  return new Promise(async (resolve, reject) => {
    try {
      const LOGO_URL =
        "https://res.cloudinary.com/dvgzhmz7x/image/upload/v1775728862/logo_official_lqpcar.png";

      const doc = new PDFDocument({ size: "A4", margin: 0 });
      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      const regularFont = path.join(
        process.cwd(),
        "fonts",
        "NotoSansDevanagari-Regular.ttf",
      );
      const boldFont = path.join(
        process.cwd(),
        "fonts",
        "NotoSansDevanagari-Bold.ttf",
      );
      doc.registerFont("NotoRegular", regularFont);
      doc.registerFont("NotoBold", boldFont);

      let logoBuffer = null;
      try {
        logoBuffer = await fetchImageBuffer(LOGO_URL);
      } catch (_) {}

      // ── Palette (from reference card) ───────────────────────
      const cream = "#FFFBEA";
      const creamDark = "#FFF3C4";
      const saffron = "#E8610A";
      const saffronLt = "#FF9933";
      const green = "#2E7D32";
      const white = "#FFFFFF";
      const darkText = "#1A1A1A";
      const mutedText = "#666666";
      const labelColor = "#7B3F00";

      const PW = doc.page.width;
      const PH = doc.page.height;

      // ── Card geometry ────────────────────────────────────────
      const MARGIN = 36;
      const CX = MARGIN;
      const CY = 50;
      const CW = PW - MARGIN * 2;
      const RADIUS = 18;

      // ── Photo (top-left) ─────────────────────────────────────
      const PHOTO_R = 52; // radius
      const PHOTO_CX = CX + 28 + PHOTO_R;
      const PHOTO_CY = CY + 28 + PHOTO_R;

      // ── Header text area (top-right) ─────────────────────────
      const HDR_X = PHOTO_CX + PHOTO_R + 22;
      const HDR_Y = CY + 18;
      const HDR_W = CX + CW - HDR_X - 18;

      // ── Divider ──────────────────────────────────────────────
      const DIVIDER_Y = PHOTO_CY + PHOTO_R + 20;

      // ── Fields ───────────────────────────────────────────────
      const FIELD_START = DIVIDER_Y + 18;
      const FIELD_GAP = 38;
      const fields = [
        { label: "नाम", value: member.name || "—" },
        { label: "सदस्य ID", value: member.memberId || "Pending" },
        { label: "मोबाइल", value: member.mobile || "—" },
        { label: "आयु", value: member.age ? `${member.age} वर्ष` : "—" },
        { label: "व्यवसाय", value: member.occupation || "—" },
        {
          label: "शहर / राज्य",
          value: [member.city, member.state].filter(Boolean).join(", ") || "—",
        },
        { label: "ईमेल", value: member.email || "—" },
        { label: "पता", value: member.address || "—" },
      ];
      const FIELDS_END = FIELD_START + fields.length * FIELD_GAP;

      // ── Footer sweep + bottom bar ────────────────────────────
      const SWEEP_H = 48;
      const BOT_BAR_H = 10;
      const CARD_BOTTOM = FIELDS_END + 32 + SWEEP_H + BOT_BAR_H;
      const CARD_H = CARD_BOTTOM - CY;

      // ════════════════════════════════════════════════════════
      // PAGE BG
      // ════════════════════════════════════════════════════════
      doc.rect(0, 0, PW, PH).fill("#EDE8DC");

      // ── Shadow ───────────────────────────────────────────────
      doc.roundedRect(CX + 4, CY + 4, CW, CARD_H, RADIUS).fill("#00000018");

      // ── Card base ────────────────────────────────────────────
      doc.roundedRect(CX, CY, CW, CARD_H, RADIUS).fill(cream);

      // ── Cream-dark top band (clipped) ────────────────────────
      doc.save();
      doc.roundedRect(CX, CY, CW, CARD_H, RADIUS).clip();
      doc.rect(CX, CY, CW, DIVIDER_Y - CY).fill(creamDark);

      // ── Diagonal saffron sweep — bottom-right  ─
      const sweepY = CARD_BOTTOM - SWEEP_H - BOT_BAR_H;
      const sweepTipX = CX + CW * 0.35;
      // lighter layer
      doc
        .moveTo(sweepTipX, CARD_BOTTOM)
        .lineTo(CX + CW, sweepY)
        .lineTo(CX + CW, CARD_BOTTOM)
        .fill(saffronLt);
      // darker overlay
      doc
        .moveTo(sweepTipX + 36, CARD_BOTTOM)
        .lineTo(CX + CW, sweepY + 20)
        .lineTo(CX + CW, CARD_BOTTOM)
        .fill(saffron);

      // ── Green bottom bar ──────────────────────────────────────
      doc.rect(CX, CARD_BOTTOM - BOT_BAR_H, CW, BOT_BAR_H).fill(green);

      doc.restore();

      // ── Green top accent bar (clipped) ───────────────────────
      doc.save();
      doc.roundedRect(CX, CY, CW, CARD_H, RADIUS).clip();
      doc.rect(CX, CY, CW, 8).fill(green);
      doc.restore();

      // ── Card border ───────────────────────────────────────────
      doc
        .roundedRect(CX, CY, CW, CARD_H, RADIUS)
        .stroke("#D4B85A")
        .lineWidth(1.8);

      // ════════════════════════════════════════════════════════
      // PHOTO CIRCLE
      // ════════════════════════════════════════════════════════
      // Outer saffron ring
      doc.circle(PHOTO_CX, PHOTO_CY, PHOTO_R + 5).fill(saffronLt);
      // Green ring
      doc.circle(PHOTO_CX, PHOTO_CY, PHOTO_R + 2).fill(green);
      // White photo area
      doc.circle(PHOTO_CX, PHOTO_CY, PHOTO_R).fill(white);

      if (member.photoBuffer) {
        // Member photo — clipped to circle
        doc.save();
        doc.circle(PHOTO_CX, PHOTO_CY, PHOTO_R - 1).clip();
        doc.image(
          member.photoBuffer,
          PHOTO_CX - PHOTO_R + 1,
          PHOTO_CY - PHOTO_R + 1,
          {
            width: (PHOTO_R - 1) * 2,
            height: (PHOTO_R - 1) * 2,
            cover: [(PHOTO_R - 1) * 2, (PHOTO_R - 1) * 2],
          },
        );
        doc.restore();
      } else if (logoBuffer) {
        const LR = PHOTO_R - 8;
        doc.save();
        doc.circle(PHOTO_CX, PHOTO_CY, PHOTO_R - 1).clip();
        doc.image(logoBuffer, PHOTO_CX - LR, PHOTO_CY - LR, {
          width: LR * 2,
          height: LR * 2,
        });
        doc.restore();
      } else {
        doc
          .font("NotoBold")
          .fontSize(14)
          .fill("#BBAA88")
          .text("JP", PHOTO_CX - 10, PHOTO_CY - 9);
      }

      // ════════════════════════════════════════════════════════
      // PARTY NAME + LOGO (top-right)
      // ════════════════════════════════════════════════════════
      doc
        .font("NotoBold")
        .fontSize(27)
        .fill(saffron)
        .text("जनहित पार्टी", HDR_X, HDR_Y + 8, { width: HDR_W });

      doc
        .font("NotoRegular")
        .fontSize(8.5)
        .fill(mutedText)
        .text("JANHIT PARTY", HDR_X, HDR_Y + 44, { characterSpacing: 2 });

      doc
        .font("NotoRegular")
        .fontSize(8)
        .fill(mutedText)
        .text("MEMBERSHIP CARD", HDR_X, HDR_Y + 57, {
          characterSpacing: 1,
        });

      // ── Green divider ─────────────────────────────────────────
      doc
        .moveTo(CX + 18, DIVIDER_Y)
        .lineTo(CX + CW - 18, DIVIDER_Y)
        .stroke(green)
        .lineWidth(2);
      // Saffron accent dot in centre
      doc.circle(CX + CW / 2, DIVIDER_Y, 4).fill(saffron);
      doc.circle(CX + 18, DIVIDER_Y, 3).fill(green);
      doc.circle(CX + CW - 18, DIVIDER_Y, 3).fill(green);

      // ════════════════════════════════════════════════════════
      // FIELDS  (label : value)
      // ════════════════════════════════════════════════════════
      const LABEL_X = CX + 22;
      const COLON_X = LABEL_X + 112;
      const VALUE_X = COLON_X + 12;
      const VALUE_W = CX + CW - VALUE_X - 24;

      fields.forEach((f, i) => {
        const fy = FIELD_START + i * FIELD_GAP;
        const isId = i === 1;

        // Label
        doc
          .font("NotoBold")
          .fontSize(11)
          .fill(labelColor)
          .text(f.label, LABEL_X, fy, {
            width: COLON_X - LABEL_X,
            align: "left",
          });

        // Colon
        doc
          .font("NotoBold")
          .fontSize(11)
          .fill(labelColor)
          .text(":", COLON_X, fy);

        // Value
        if (isId) {
          const bW = Math.min(VALUE_W * 0.65, 155);
          doc.roundedRect(VALUE_X - 3, fy - 2, bW, 20, 5).fill(saffron);
          doc
            .font("NotoBold")
            .fontSize(11)
            .fill(white)
            .text(f.value, VALUE_X + 5, fy + 1, {
              width: bW - 10,
              ellipsis: true,
            });
        } else {
          doc
            .font("NotoRegular")
            .fontSize(11)
            .fill(darkText)
            .text(f.value, VALUE_X, fy, { width: VALUE_W, ellipsis: true });
        }

        // Row separator (skip last)
        if (i < fields.length - 1) {
          doc
            .moveTo(LABEL_X, fy + FIELD_GAP - 7)
            .lineTo(CX + CW - 22, fy + FIELD_GAP - 7)
            .stroke("#E8D8A0")
            .lineWidth(0.6);
        }
      });

      // ════════════════════════════════════════════════════════
      // BOTTOM ROW — issued date + approved badge
      // ════════════════════════════════════════════════════════
      const BTM_Y = FIELDS_END + 10;
      const today = new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      doc
        .font("NotoRegular")
        .fontSize(8.5)
        .fill(mutedText)
        .text(`Issued: ${today}`, LABEL_X, BTM_Y + 2);

      // Approved badge
      const BDG_X = LABEL_X + 120;
      doc.roundedRect(BDG_X, BTM_Y - 1, 96, 19, 9).fill(green);
      doc.circle(BDG_X + 13, BTM_Y + 9, 3.5).fill("#A5D6A7");
      doc
        .font("NotoRegular")
        .fontSize(8.5)
        .fill(white)
        .text("APPROVED", BDG_X + 21, BTM_Y + 3, { characterSpacing: 0.8 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
