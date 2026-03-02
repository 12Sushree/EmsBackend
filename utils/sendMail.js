const brevo = require("@getbrevo/brevo");

exports.sendMail = async ({ to, subject, html }) => {
  try {
    const apiInstance = new brevo.TransactionalEmailsApi();

    apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY,
    );

    await apiInstance.sendTransacEmail({
      sender: {
        name: "EMS System",
        email: "sushreeta4112@gmail.com", // must be verified in Brevo
      },
      to: [{ email: to }],
      subject: subject,
      htmlContent: html,
    });

    console.log("Email sent successfully");
  } catch (error) {
    console.error("Mail Error:", error.response?.body || error.message);
    throw new Error("Email could not be sent");
  }
};
