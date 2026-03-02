const axios = require("axios");

exports.sendMail = async ({ to, subject, html }) => {
  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "EMS System",
          email: "sushreeta4112@gmail.com", // must be verified in Brevo
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.BREVO_API_KEY,
        },
      },
    );

    console.log("Email sent successfully");
  } catch (error) {
    console.error("Mail Error:", error.response?.data || error.message);
    throw new Error("Email could not be sent");
  }
};
