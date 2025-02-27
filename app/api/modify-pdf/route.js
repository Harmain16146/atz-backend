import { PDFDocument, rgb } from "pdf-lib";
import { readFile } from "fs/promises";
import path from "path";

export async function POST(req) {
  try {
    console.log("Processing PDF modification...");

    // Extract data from request
    const {
      memberName,
      businessName,
      businessCategory,
      cnicNumber,
      membershipNumber,
      memberPic, // Base64 Image
      qrCodeBase64, // Base64 QR Code
      memberSince,
    } = await req.json();

    const expiryDate = "31-03-2026";
    const serial = "RP/2059/L/S/86";

    // Define input PDF path
    const inputPath = path.join(process.cwd(), "public", "atz.pdf");

    // Load PDF
    const existingPdfBytes = await readFile(inputPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const page = pdfDoc.getPages()[0];

    // Define text positions
    const textFields = [
      { text: memberName?.trim() ? memberName : "No Data", x: 75, y: 84 },
      { text: businessName?.trim() ? businessName : "No Data", x: 75, y: 71 },
      {
        text: businessCategory?.trim() ? businessCategory : "No Data",
        x: 75,
        y: 59,
      },
      { text: cnicNumber?.trim() ? cnicNumber : "No Data", x: 75, y: 47 },
      {
        text: membershipNumber?.trim() ? membershipNumber : "No Data",
        x: 75,
        y: 34,
      },
      { text: memberSince?.trim() ? memberSince : "No Data", x: 75, y: 22 },
      { text: serial?.trim() ? serial : "No Data", x: 370, y: 140 },
    ];

    // Draw text on PDF with small font size
    textFields.forEach(({ text, x, y }) => {
      page.drawText(text, { x, y, size: 7.5 });
    });

    // Draw expiry date with white color
    page.drawText(expiryDate, { x: 190, y: 24, size: 8, color: rgb(1, 1, 1) });

    console.log("✅ Text added successfully.");

    // 📌 **Handling Member Profile Picture (PNG or JPG)**
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
        console.log("✅ Image added successfully.");
      } catch (imageError) {
        console.error("❌ Error embedding image:", imageError.message);
      }
    }

    // 📌 **Handling QR Code (PNG Only)**
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

    // Save modified PDF
    const pdfBytes = await pdfDoc.save();
    console.log("🎉 PDF modified successfully!");

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=modified.pdf",
        "Access-Control-Allow-Origin": "*", // Allow all origins (for debugging)
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
