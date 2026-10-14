const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Create a transporter using Gmail service explicitly 🟢
  const transporter = nodemailer.createTransport({
    service: 'gmail', // 👈 Host aur Port ki zaroorat nahi, Nodemailer khud handle karega
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // 2. Define the email options
  const mailOptions = {
    from: `"Kavera Admin System" <${process.env.SMTP_USER}>`, 
    to: options.email,
    subject: options.subject,
    text: options.message, 
    html: options.html || `<p>${options.message.replace(/\n/g, '<br>')}</p>`,
  };

  // 3. Actually send the email over the internet
  await transporter.sendMail(mailOptions);
  
  console.log("✅ REAL Email Sent successfully to:", options.email);
};

module.exports = sendEmail;