// import PDFDocument from "pdfkit";

// /**
//  * Generate Membership PDF
//  */
// export const generateMemberPDF = (member) => {
//   return new Promise((resolve, reject) => {
//     try {
//       const doc = new PDFDocument();
//       const buffers = [];

//       doc.on("data", buffers.push.bind(buffers));
//       doc.on("end", () => resolve(Buffer.concat(buffers)));

//       // ===== PDF DESIGN =====
//       doc
//         .fontSize(20)
//         .text("Janhit Party Membership Card", { align: "center" });

//       doc.moveDown();

//       doc.fontSize(14).text(`Name: ${member.name}`);
//       doc.text(`Email: ${member.email}`);
//       doc.text(`Mobile: ${member.mobile}`);
//       doc.text(`City: ${member.city}`);

//       doc.moveDown();

//       doc.text("Status: Approved ✅", { align: "left" });

//       doc.moveDown();
//       doc.text("Welcome to Janhit Party!", { align: "center" });

//       doc.end();
//     } catch (err) {
//       reject(err);
//     }
//   });
// };

import PDFDocument from "pdfkit";
import path from "path";

/**
 * Generate Membership PDF with full styling and Hindi support
 * @param {Object} member - Member object from MongoDB
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generateMemberPDF = (member) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // ===== Register Fonts =====
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

      // ===== Colors =====
      const saffron = "#FF9933";
      const white = "#FFFFFF";
      const green = "#138808";
      const navy = "#000080";
      const gold = "#FFD700";

      // ===== Page Background =====
      doc.rect(0, 0, doc.page.width, doc.page.height).fill(white);

      // ===== Header Saffron Band =====
      doc.rect(0, 0, doc.page.width, 120).fill(saffron);

      // ===== Card Body =====
      doc
        .roundedRect(30, 30, doc.page.width - 60, 260, 10)
        .fill(white)
        .stroke(saffron, 3);

      // ===== Title =====
      doc
        .font("Helvetica-Bold")
        .fontSize(24)
        .fill(navy)
        .text("Janhit Party Membership Card", 0, 45, { align: "center" });

      // ===== Party Name =====
      doc
        .font("Helvetica-Bold")
        .fontSize(18)
        .fill(green)
        .text("Janhit Party", 0, 75, { align: "center" });

      // ===== Member Details =====
      let startY = 140;
      const lineGap = 25;

      const drawLabelValue = (label, value) => {
        doc
          .font("Helvetica-Bold")
          .fontSize(14)
          .fill(navy)
          .text(label, 60, startY);

        doc
          .font("Helvetica")
          .fontSize(14)
          .fill("#333")
          .text(value || "-", 180, startY);

        startY += lineGap;
      };

      drawLabelValue("Name:", member.name);
      drawLabelValue("Email:", member.email);
      drawLabelValue("Mobile:", member.mobile);
      drawLabelValue("City:", member.city);
      drawLabelValue("Address:", member.address || "-");
      drawLabelValue("Age:", member.age || "-");
      drawLabelValue("Occupation:", member.occupation || "-");
      drawLabelValue("Member ID:", member.memberId || "Pending");

      // ===== Status Badge =====
      doc
        .roundedRect(60, startY + 10, 120, 25, 5)
        .fill(green)
        .stroke(green);

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fill(white)
        .text("APPROVED", 70, startY + 15);

      // ===== Footer =====
      const footerY = 280;
      doc.rect(0, footerY, doc.page.width, 50).fill(green);

      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fill(white)
        .text("Welcome to Janhit Party!", 0, footerY + 10, { align: "center" });

      // Hindi slogan
      doc
        .font("Helvetica")
        .fontSize(9)
        .fill(gold)
        .text(
          "For the People, By the People, For the People",
          0,
          footerY + 25,
          {
            align: "center",
          },
        );

      // ===== Decorative Elements =====
      doc.circle(50, 50, 15).fill(gold);
      doc.circle(doc.page.width - 50, 50, 15).fill(gold);

      // ===== Finish PDF =====
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
