const OnboardingTemplate = ({
  first_name,
  employee_id,
  username,
  position,
  company_name = "Your Company",
  email = "emplorehr@gmail.com",
  portal_url = "http://localhost:5173",
}) => {
  return `
      <!DOCTYPE html>
      <html>

      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ${company_name}</title>
      </head>

      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                  <td style="padding: 0;">
                      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">

                          <!-- Header -->
                          <div style="background-color:#1a368b; padding: 40px 20px; text-align: center;">
                              <img src="cid:companylogo" alt="${company_name} Logo" style="width: 180px; height: auto; margin-bottom: 20px;">
                              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to the Team!</h1>
                          </div>

                          <!-- Content -->
                          <div style="padding: 40px 30px;">
                              <h2 style="color: #333333; margin-top: 0;">Hello ${first_name}!</h2>

                              <p style="color: #666666; line-height: 1.6; font-size: 16px;">
                                  We're excited to welcome you to <strong>${company_name}</strong>! Your journey with us starts now,
                                  and we're here to support you every step of the way.
                              </p>

                              <p style="color: #666666; line-height: 1.6; font-size: 16px;">
                                  To get started, please use the credentials below to access our employee portal.
                              </p>

                              <p style="color: #666666; line-height: 1.6; font-size: 16px;">
                                  Your <strong>Employee ID number</strong> serves as your default password. We highly recommend updating it upon your first login for security.
                              </p>

                              <p style="color: #666666; line-height: 1.6; font-size: 16px;">
                                  If you encounter any issues, feel free to contact our HR team at <strong>${email}</strong>.
                              </p>

                              <!-- Employee Details Card -->
                              <div style="background-color: #f8f9fa; border-left: 4px solid #1a368b; padding: 20px; margin: 20px 0;">
                                  <h3 style="color: #333333; margin-top: 0;">Your Employee Details</h3>
                                  <table style="width: 100%; border-collapse: collapse;">
                                      <tr>
                                          <td style="padding: 8px 0; color: #666666; font-weight: bold;">Employee ID:</td>
                                          <td style="padding: 8px 0; color: #333333;">${employee_id}</td>
                                      </tr>
                                      <tr>
                                          <td style="padding: 8px 0; color: #666666; font-weight: bold;">Username:</td>
                                          <td style="padding: 8px 0; color: #333333;">${username}</td>
                                      </tr>
                                      <tr>
                                          <td style="padding: 8px 0; color: #666666; font-weight: bold;">Position:</td>
                                          <td style="padding: 8px 0; color: #333333;">${position}</td>
                                      </tr>
                                  </table>
                              </div>

                              <!-- Next Steps -->
                              <div style="background-color: #ececef; padding: 20px; margin: 20px 0;">
                                  <h3 style="color: #333333; margin-top: 0;">Next Steps</h3>
                                  <ul style="color: #666666; line-height: 1.6; padding-left: 20px;">
                                      <li>Log in using the credentials provided above</li>
                                      <li>Complete your onboarding checklist</li>
                                      <li>Schedule a welcome meeting with your manager</li>
                                  </ul>
                              </div>

                              <!-- CTA Button -->
                              <div style="text-align: center; margin: 30px 0;">
                                  <a href="${portal_url}" style="background-color:#1a368b; 
                    color: #ffffff; 
                    text-decoration: none; 
                    padding: 15px 30px; 
                    border-radius: 5px; 
                    display: inline-block;
                    font-weight: bold;">
                                      Access Employee Portal
                                  </a>
                              </div>
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

export default OnboardingTemplate;
