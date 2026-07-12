import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || 'no-reply@transitops.com';

let transporter: nodemailer.Transporter | null = null;

// Initialize Nodemailer if SMTP configurations are present
if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
  console.log('Nodemailer initialized with SMTP host:', SMTP_HOST);
} else {
  console.log('Nodemailer SMTP details missing. Email notifications will be printed to server console.');
}

async function sendMail(to: string, subject: string, text: string, html: string) {
  try {
    if (transporter) {
      await transporter.sendMail({
        from: SMTP_FROM,
        to,
        subject,
        text,
        html
      });
      console.log(`[Email] Mail sent successfully to ${to} (Subject: "${subject}")`);
    } else {
      // Simulation mode
      console.log(`
========================================================================
[EMAIL SIMULATION] TO: ${to}
SUBJECT: ${subject}
------------------------------------------------------------------------
${text}
========================================================================
      `);
    }
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err);
  }
}

export async function sendWelcomeEmail(to: string, name: string, tenantId: string) {
  const subject = 'Welcome to TransitOps! Your SaaS Tenant Account is Ready';
  const text = `Hi ${name},

Welcome to TransitOps! Your SaaS company account has been successfully registered.

Your login details:
Tenant ID (Company Code): ${tenantId}
Email: ${to}

Log in at http://localhost:3000/login to access your company dashboard.

Best regards,
TransitOps SaaS Team`;

  const html = `
    <h3>Welcome to TransitOps!</h3>
    <p>Hi <strong>${name}</strong>,</p>
    <p>Your SaaS company account has been successfully registered.</p>
    <p><strong>Your login details:</strong><br/>
    Tenant ID (Company Code): <code>${tenantId}</code><br/>
    Email: <code>${to}</code></p>
    <p>Log in at <a href="http://localhost:3000/login">http://localhost:3000/login</a> to access your company dashboard.</p>
    <br/>
    <p>Best regards,<br/>TransitOps SaaS Team</p>
  `;

  await sendMail(to, subject, text, html);
}

export async function sendLoginAlertEmail(to: string, name: string) {
  const subject = 'Security Alert: New Login Detected';
  const timestamp = new Date().toLocaleString();
  const text = `Hi ${name},

A new login was detected on your TransitOps account at ${timestamp}.

If this was you, no action is required. If you did not log in, please reset your password immediately.

Best regards,
TransitOps Security Team`;

  const html = `
    <h3>Security Alert: New Login</h3>
    <p>Hi <strong>${name}</strong>,</p>
    <p>A new login was detected on your TransitOps account at <strong>${timestamp}</strong>.</p>
    <p>If this was you, no action is required. If you did not log in, please reset your password immediately.</p>
    <br/>
    <p>Best regards,<br/>TransitOps Security Team</p>
  `;

  await sendMail(to, subject, text, html);
}

export async function sendCredentialsEmail(to: string, name: string, role: string, pass: string, tenantId: string) {
  const subject = 'Your TransitOps Account Credentials';
  const text = `Hi ${name},

An administrator has created a new account for you on TransitOps with the role: ${role.replace('_', ' ')}.

Your login credentials:
Tenant ID (Company Code): ${tenantId}
Email: ${to}
Temporary Password: ${pass}

Please log in at http://localhost:3000/login and reset your password on your first sign-in.

Best regards,
TransitOps Admin Service`;

  const html = `
    <h3>Your TransitOps Credentials</h3>
    <p>Hi <strong>${name}</strong>,</p>
    <p>An administrator has created a new account for you with the role: <strong>${role.replace('_', ' ')}</strong>.</p>
    <p><strong>Your login credentials:</strong><br/>
    Tenant ID (Company Code): <code>${tenantId}</code><br/>
    Email: <code>${to}</code><br/>
    Temporary Password: <code>${pass}</code></p>
    <p>Please log in at <a href="http://localhost:3000/login">http://localhost:3000/login</a> and change your password on your first sign-in.</p>
    <br/>
    <p>Best regards,<br/>TransitOps Admin Service</p>
  `;

  await sendMail(to, subject, text, html);
}
