const nodemailer = require("nodemailer");

function createAccountTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const emailEnabled = process.env.ENABLE_ACCOUNT_EMAIL === "true";

  if (!emailEnabled || !user || !pass || pass === "REPLACE_WITH_GMAIL_APP_PASSWORD" || pass.length < 16) {
    return null;
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
    auth: {
      user,
      pass
    }
  });
}

function createOrderTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const emailEnabled = process.env.ENABLE_ORDER_EMAIL === "true";

  if (!emailEnabled || !user || !pass || pass === "REPLACE_WITH_GMAIL_APP_PASSWORD" || pass.length < 16) {
    return null;
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
    auth: {
      user,
      pass
    }
  });
}

async function sendAccountEmail({ to, subject, text }) {
  const transporter = createAccountTransporter();
  if (!transporter) {
    return { skipped: true };
  }

  await Promise.race([
    transporter.sendMail({
      from: `"Ramji Bakery" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text
    }),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Account email timed out")), 10000);
    })
  ]);

  return { skipped: false };
}

async function sendOrderEmail({ to, subject, text }) {
  const transporter = createOrderTransporter();
  if (!transporter) {
    return { skipped: true };
  }

  await Promise.race([
    transporter.sendMail({
      from: `"Ramji Bakery Orders" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text
    }),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Order email timed out")), 10000);
    })
  ]);

  return { skipped: false };
}

module.exports = {
  sendAccountEmail,
  sendOrderEmail
};
