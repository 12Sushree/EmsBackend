const nodemailer = require("nodemailer");

exports.sendMail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: `"EMS System" <sushreeta4112@gmail.com>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("Mail Error:", err.message);
    throw new Error("Email could not be sent");
  }
};
