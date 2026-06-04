import nodemailer from "nodemailer";

export async function handler(event, context) {
  // Allow OPTIONS method for preflight and CORS troubleshooting if any, although same-domain rewrite avoids this.
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method is niet toegestaan. Gebruik POST." }),
    };
  }

  try {
    const { contactEmail, companyName, proposalSector, challengeText, proposalResult } = JSON.parse(event.body || "{}");

    if (!contactEmail) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "E-mailadres is verplicht." })
      };
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM_EMAIL || "no-reply@letstwin.nl";

    const mailOptions = {
      from: `"Let's-Twin AI-CoPilot" <${smtpFrom}>`,
      to: contactEmail,
      subject: `📋 Jouw Digital Twin Pilot Voorstel: ${companyName}`,
      text: `Beste ${companyName} team,\n\nHier is het op maat gemaakte Digital Twin Pilot projectvoorstel dat door onze AI Co-pilot Leta is voorbereid.\n\n` + 
            `Bedrijfsnaam: ${companyName}\nSector: ${proposalSector}\n\nUitdaging:\n${challengeText || "Niet gespecificeerd"}\n\n` +
            `--- DOCUMENT ---\n\n${proposalResult}\n\n---\n\nMet vriendelijke groet,\nLet's-Twin Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.6;">
          <h2 style="color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">Let's-Twin Digital Twin Blueprint</h2>
          <p>Beste team van <strong>\${companyName}</strong>,</p>
          <p>Dank u voor uw interesse in een Digital Twin & realtime SCADA dashboard pilot project! Onze AI Co-pilot <strong>Leta</strong> heeft op basis van uw ingevulde gegevens een op maat gemaakte blauwdruk gegenereerd.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc;">
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Bedrijf:</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">\${companyName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Sector / Branche:</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">\${proposalSector}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Ingediende Uitdaging:</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-style: italic;">\${challengeText || "Algemene digitalisering en optimalisatie."}</td>
            </tr>
          </table>

          <div style="background: #1e293b; color: #f1f5f9; padding: 20px; border-radius: 8px; font-size: 14px; white-space: pre-wrap; margin-top: 20px;">
            \${proposalResult.replace(/\\n/g, '<br />')}
          </div>

          <p style="margin-top: 30px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px;">
            Heeft u vragen of wilt u een live demo boeken? Neem direct contact op met Let's-Twin Agency.
          </p>
        </div>
      `
    };

    if (smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      await transporter.sendMail(mailOptions);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ success: true, mode: "real" })
      };
    } else {
      try {
        const testAccount = await nodemailer.createTestAccount();
        const transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        const info = await transporter.sendMail(mailOptions);
        const testUrl = nodemailer.getTestMessageUrl(info);
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ 
            success: true, 
            mode: "simulated", 
            testUrl: testUrl,
            message: "De SMTP criteria zijn niet ingesteld. We hebben het e-mailbericht gesimuleerd verzonden via een beveiligde testomgeving." 
          })
        };
      } catch (errTest) {
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ 
            success: true, 
            mode: "logged", 
            message: "U heeft geen live SMTP-credentials geconfigureerd (SMTP_HOST, SMTP_USER, etc.). De e-mail is succesvol gesimuleerd!" 
          })
        };
      }
    }
  } catch (error) {
    console.error("Netlify send-email error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message || "Interne fout bij verzenden van e-mail op Netlify." }),
    };
  }
}
