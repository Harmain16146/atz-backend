import { PDFDocument } from "pdf-lib";
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

    const expiryDate = "31-12-2025";
    const serial = "RP/2059/L/S/86";

    // Define input PDF path
    const inputPath = path.join(process.cwd(), "public", "atz.pdf");

    // Load PDF
    const existingPdfBytes = await readFile(inputPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Get form fields
    const form = pdfDoc.getForm();

    // Define text field values
    const fieldValues = {
      Name: memberName,
      "Business Name": businessName,
      "Business Category": businessCategory,
      CNIC: cnicNumber,
      Membership: membershipNumber,
      "Member Since": memberSince,
      "Expiry Date": expiryDate,
      Serial: serial,
    };

    // Update text fields
    Object.entries(fieldValues).forEach(([fieldName, value]) => {
      const field = form.getField(fieldName);
      if (field && field.constructor.name === "PDFTextField") {
        field.setText(value);
        field.setFontSize(8);

        // Center align only the "Serial" field
        if (fieldName === "Serial") {
          field.setAlignment(1); // 1 = Center alignment
        }

        console.log(`✅ Updated text field: ${fieldName} -> ${value}`);
      } else {
        console.warn(`⚠️ Skipping non-text field: ${fieldName}`);
      }
    });

    // 📌 **Handling Member Profile Picture (PNG or JPG)**
    if (memberPic) {
      try {
        let imageBytes;
        let image;

        // Check if the image is PNG or JPG
        if (memberPic.startsWith("data:image/png;base64,")) {
          imageBytes = Buffer.from(
            memberPic.replace("data:image/png;base64,", ""),
            "base64"
          );
          image = await pdfDoc.embedPng(imageBytes); // Embed PNG
          console.log("✅ PNG image detected and embedded.");
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
          image = await pdfDoc.embedJpg(imageBytes); // Embed JPG
          console.log("✅ JPG image detected and embedded.");
        } else {
          throw new Error(
            "Invalid image format. Only PNG and JPG are supported."
          );
        }

        // Draw Image on First Page (Adjust Position)
        const page = pdfDoc.getPages()[0];
        page.drawImage(image, {
          x: 180, // Adjust x position
          y: 45, // Adjust y position
          width: 59,
          height: 74,
        });

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

        // Draw QR Code on First Page (Adjust Position)
        const page = pdfDoc.getPages()[0];
        page.drawImage(qrImage, {
          x: 440, // Adjust x position (Right Side)
          y: 14, // Adjust y position
          width: 68,
          height: 68,
        });

        console.log("✅ QR Code added successfully.");
      } catch (qrError) {
        console.error("❌ Error embedding QR Code:", qrError.message);
      }
    }

    // Save modified PDF
    const pdfBytes = await pdfDoc.save();

    console.log("🎉 PDF modified successfully!");

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=modified.pdf",
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
