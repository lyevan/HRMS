const InvitationTemplate = ({
  company_name = "Your Company",
  email = "emplorehr@gmail.com",
  url,
}) => {
  return `
      <!DOCTYPE html>
      <html>

      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>You are invited to ${company_name}</title>
      </head>

      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                  <td style="padding: 0;">
                      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">

                          <!-- Header -->
                          <div style="background-color: #1a368b; padding: 40px 20px; text-align: center;">
                              <img src="cid:companylogo" alt="${company_name} Logo" style="width: 180px; height: auto; margin-bottom: 20px;">
                              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">You're Invited!</h1>
                          </div>

                          <!-- Content -->
                          <div style="padding: 40px 30px;">
                              <h2 style="color: #333333; margin-top: 0;">Hello there!</h2>

                              <p style="color: #666666; line-height: 1.6; font-size: 16px;">
                                  First of all, congratulations on passing the interview! We are thrilled to invite you to join our team at ${company_name}.
                              </p>

                              <p style="color: #666666; line-height: 1.6; font-size: 16px;">
                                  To start your onboarding process, please click the link below to accept your invitation.
                              </p>

                              <p style="color: #666666; line-height: 1.6; font-size: 16px;">
                                  Upon clicking the link, you will be redirected to a page where you can set up your account and complete the necessary onboarding steps.
                              </p>


                              <p style="color: #666666; line-height: 1.6; font-size: 16px;">
                                  Fill out the required information and follow the instructions provided.
                              </p>


                              <!-- CTA Button -->
                              <div style="text-align: center; margin: 30px 0;">
                                  <a href="${url}" target="_blank" style="background-color: #1a368b; 
                                  color: #ffffff; 
                                  text-decoration: none; 
                                  padding: 15px 30px; 
                                  border-radius: 5px; 
                                  display: inline-block;
                                  font-weight: bold;">
                                      Accept Invitation
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

export default InvitationTemplate;
