const OTPTemplate = ({
  company_name = "Your Company",
  email = "emplorehr@gmail.com",
  otp,
}) => {
  return `
      <!DOCTYPE html>
      <html>

      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Here is your OTP</title>
      </head>

      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                  <td style="padding: 0;">
                      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">

                          <!-- Header -->
                          <div style="background-color: #1a368b; padding: 40px 20px; text-align: center;">
                              <img src="cid:companylogo" alt="${company_name} Logo" style="width: 180px; height: auto; margin-bottom: 20px;">
                              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Here is your OTP</h1>
                          </div>

                          <!-- Content -->
                          <div style="padding: 40px 30px;">
                              <h2 style="color: #333333; margin-top: 0;">${otp}</h2>

                              <p style="color: #666666; line-height: 1.6; font-size: 16px;">
                                  Please use the above OTP to complete your login.
                              </p>

                              <p style="color: #666666; line-height: 1.6; font-size: 16px;">
                                  The OTP is valid for a limited time. Do not share this OTP with anyone. If you did not request this, please ignore this email.
                              </p>



                          </div>

                          <!-- Footer -->
                          <div style="background-color: #333333; color: #ffffff; padding: 20px; text-align: center;">
                              <p style="margin: 0; font-size: 14px;">
                                  © ${new Date().getFullYear()} ${company_name}. All rights reserved.
                              </p>
                              <p style="margin: 10px 0 0 0; font-size: 12px; color: #cccccc;">
                                  If you have any questions, contact HR at ${email}
                              </p>
                          </div>

                      </div>
                  </td>
              </tr>
          </table>
      </body>

      </html>
  `;
};

export default OTPTemplate;
