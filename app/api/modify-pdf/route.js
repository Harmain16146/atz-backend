import { PDFDocument, rgb } from "pdf-lib";
import { readFile } from "fs/promises";
import path from "path";

export async function POST(req) {
  try {
    console.log("Processing PDF modification...");

    const {
      memberName,
      businessName,
      businessCategory,
      cnicNumber,
      membershipNumber,
      memberPic,
      qrCodeBase64,
      memberSince,
    } = await req.json();

    const expiryDate = "Exp: 31-01-2026";
    const serial = "RP/2059/L/S/86";

    const inputPath = path.join(process.cwd(), "public", "atz.pdf");

    const existingPdfBytes = await readFile(inputPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const page = pdfDoc.getPages()[0];

    const textFields = [
      { text: memberName?.trim() || "No Data", x: 75, y: 84 },
      { text: businessName?.trim() || "No Data", x: 75, y: 71 },
      { text: businessCategory?.trim() || "No Data", x: 75, y: 59 },
      { text: cnicNumber?.trim() || "No Data", x: 75, y: 47 },
      { text: membershipNumber?.trim() || "No Data", x: 75, y: 34 },
      { text: memberSince?.trim() || "No Data", x: 75, y: 22 },
      { text: serial?.trim() || "No Data", x: 370, y: 140 },
    ];

    textFields.forEach(({ text, x, y }) => {
      page.drawText(text, { x, y, size: 7.5 });
    });

    page.drawText(expiryDate, { x: 188, y: 25, size: 6, color: rgb(1, 1, 1) });

    console.log("✅ Text added successfully.");

    // Handle Member Picture
    if (memberPic) {
      try {
        let imageBytes;
        let image;

        if (memberPic.startsWith("data:image/png;base64,")) {
          imageBytes = Buffer.from(
            memberPic.replace("data:image/png;base64,", ""),
            "base64"
          );
          image = await pdfDoc.embedPng(imageBytes);
        } else if (
          memberPic.startsWith("data:image/jpeg;base64,") ||
          memberPic.startsWith("data:image/jpg;base64,")
        ) {
          imageBytes = Buffer.from(
            memberPic.replace(
              /^data:image\/jpeg;base64,|^data:image\/jpg;base64,/,
              ""
            ),
            "base64"
          );
          image = await pdfDoc.embedJpg(imageBytes);
        } else {
          throw new Error(
            "Invalid image format. Only PNG and JPG are supported."
          );
        }

        page.drawImage(image, { x: 180, y: 45, width: 59, height: 74 });
        console.log("✅ Member image added successfully.");
      } catch (imageError) {
        console.error("❌ Error embedding member image:", imageError.message);
      }
    }

    // Handle QR Code
    if (qrCodeBase64) {
      try {
        if (!qrCodeBase64.startsWith("data:image/png;base64,")) {
          throw new Error("Invalid QR Code format. Only PNG is supported.");
        }

        const qrBytes = Buffer.from(
          qrCodeBase64.replace("data:image/png;base64,", ""),
          "base64"
        );
        const qrImage = await pdfDoc.embedPng(qrBytes);

        page.drawImage(qrImage, { x: 440, y: 14, width: 68, height: 68 });
        console.log("✅ QR Code added successfully.");
      } catch (qrError) {
        console.error("❌ Error embedding QR Code:", qrError.message);
      }
    }

    // Save the modified PDF
    const pdfBytes = await pdfDoc.save();
    console.log("🎉 PDF modified successfully!");

    // 🚀 Return correct response (No Buffer.from)
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=modified.pdf",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
    });
  } catch (error) {
    console.error("❌ Error modifying PDF:", error);
    return new Response(
      JSON.stringify({ message: "Error modifying PDF", error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
