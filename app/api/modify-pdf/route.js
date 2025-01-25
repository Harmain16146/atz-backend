import { PDFDocument } from "pdf-lib";
import { readFile, writeFile } from "fs/promises";
import path from "path";

export async function POST(req) {
  try {
    // Extract data from the request body
    const {
      memberName,
      businessName,
      phoneNumber,
      membershipNumber,
      cnicNumber,
      qrCodeUrl,
    } = await req.json();

    console.log("====================================");
    console.log("data in backend is", memberName, businessName, phoneNumber);
    console.log("====================================");

    // Define the path to the input PDF
    const inputPath = path.join(process.cwd(), "public", "input.pdf");
    const outputPath = path.join(process.cwd(), "public", "output.pdf");

    // Read the existing PDF
    const existingPdfBytes = await readFile(inputPath);

    // Load the PDFDocument
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Modify the PDF (example: adding the data to the PDF)
    const page = pdfDoc.getPage(0); // Assuming you're modifying the first page

    // Add text or modify fields with member data
    page.drawText(`Member Name: ${memberName}`, { x: 50, y: 500 });
    page.drawText(`Business Name: ${businessName}`, { x: 50, y: 480 });
    page.drawText(`Membership No: ${membershipNumber}`, { x: 50, y: 440 });
    page.drawText(`CNIC No: ${cnicNumber}`, { x: 50, y: 420 });

    // Optionally, add QR code if needed (using the provided URL)
    // Assuming QR code rendering functionality (this would be more complex, like using a library to draw the QR code image)

    // Serialize the PDFDocument to bytes
    const pdfBytes = await pdfDoc.save();

    // Write the modified PDF to a new file
    await writeFile(outputPath, pdfBytes);

    return new Response(
      JSON.stringify({
        message: "PDF modified successfully",
        path: "/output.pdf",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Error modifying PDF", error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
