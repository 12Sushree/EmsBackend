const SibApiV3Sdk = require("@getbrevo/brevo");

exports.sendMail = async ({ to, subject, html }) => {
  try {
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    const apiKey = SibApiV3Sdk.ApiClient.instance.authentications["api-key"];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    const sendSmtpEmail = {
      sender: {
        name: "EMS System",
        email: "sushreeta4112@gmail.com",
      },
      to: [
        {
          email: to,
        },
      ],
      subject: subject,
      htmlContent: html,
    };

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log("Email sent successfully");
  } catch (error) {
    console.error("Mail Error:", error.response?.body || error.message);
    throw new Error("Email could not be sent");
  }
};
