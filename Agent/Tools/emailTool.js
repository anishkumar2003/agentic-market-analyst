// agent/tools/emailTool.js

const nodemailer = require("nodemailer");

async function sendEmail({ report }) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });


    const formattedReport =
      typeof report === "string"
        ? report
        : JSON.stringify(report, null, 2);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "📊 Daily Market Report",
      text: formattedReport,
    });

    return {
      status: "success",
      message: "Email sent successfully",
    };
  } catch (err) {
    console.error("Email Error:", err.message);

    return {
      status: "error",
      message: err.message,
    };
  }
}

module.exports = { sendEmail };