const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const generateInvoice = async ({
  userName,
  email,
  courseTitle,
  amount,
  paymentId
}) => {

  const invoiceName = `invoice-${paymentId}.pdf`;
  const invoicePath = path.join(__dirname, "../invoices", invoiceName);

  const doc = new PDFDocument();

  doc.pipe(fs.createWriteStream(invoicePath));

  doc.fontSize(22).text("EarnProjectAcademy Invoice", { align: "center" });

  doc.moveDown();

  doc.fontSize(14).text(`Student: ${userName}`);
  doc.text(`Email: ${email}`);
  doc.text(`Course: ${courseTitle}`);
  doc.text(`Amount Paid: ₹${amount}`);
  doc.text(`Payment ID: ${paymentId}`);
  doc.text(`Date: ${new Date().toDateString()}`);

  doc.moveDown();

  doc.text("Thank you for enrolling in EarnProjectAcademy.", {
    align: "center",
  });

  doc.end();

  return invoicePath;
};

module.exports = generateInvoice;