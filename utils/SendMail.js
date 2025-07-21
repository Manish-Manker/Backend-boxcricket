
import nodemailer from 'nodemailer';


const mailType = {
    resetPassword: (link) => `
        <div  style="margin: 50px auto 0; padding: 30px; background-color: #f5f5f5; font-family: Arial, sans-serif; width: fit-content; border-radius: 5px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 0; ">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0"
                        style="background-color: #ffffff; padding: 40px; text-align: center; border-radius: 5px;">
                        <!-- Logo -->
                        <tr>
                            <td style="padding-bottom: 30px;">
                                
                            </td>
                        </tr>
 
 
                        <tbody>
                            <tr>
                                <td>
                                    <h4 style="font-size:26px; font-weight:700; margin:0 0 10px; color:#444a64;">
                                        Password Reset</h4>
                                    <p style="font-size:17px; font-weight:400; margin:15px 40px 20px; color:#69767A; line-height: 24px;">If you’ve lost your password or wish to
                                        reset it, use the link below to get started.</p>
 
                                    <div> <a href="http://localhost:3000/resetPassword?${link}" target="_blank"
                                            style="display:inline-block; background:#ff9c4a; color:#fff; padding:12px 24px; border-radius:30px; text-decoration:none; font-weight:bold; font-size:16px;">Reset
                                            Your Password</a></div>
                                    <p style="font-size:15px; font-weight:400; color:#69767A; margin:20px 0 20px; line-height: 24px;">If
                                        you did not request a password
                                        reset, you can safely ignore this email. Only
                                        a person with access to your email can reset your account password.</p>
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td
                                    style=" text-align:center; color:#444a64; font-size:14px; font-weight: 600; padding:15px 0px 0px ;">
                                    © 2025 PixaScore. All Rights Reserved.
                                </td>
                            </tr>
                        </tfoot> 
                    </table>
                </td>
            </tr>
        </table>
    </div>
    `,
    verifyEmail: (link) => `
    <div
        style="margin: 50px auto 0; padding: 30px; background-color: #f5f5f5; font-family: Arial, sans-serif; width: fit-content; border-radius: 5px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 0; ">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0"
                        style="background-color: #ffffff; padding: 40px; text-align: center; border-radius: 5px;">
                        <tr>
                            <td>
 
                            </td>
                        </tr>
                        <tbody>
                            <tr>
                                <td>
                                    <h4 style=" font-size:26px; font-weight:700; margin:0 0 10px; color:#444a64;">
                                        Verify your email address</h4>
                                    <p style="font-size:15px; font-weight:400; margin:15px 40px 20px; color:#69767A; line-height: 24px;">
                                         Please confirm that you want to use this as your Pixascore account
                                        email address. Once it's done you will be able to login !
                                    </p>

                                    <div> <a href=http://localhost:3000/verifyemail?${link} target="_blank" style="display:inline-block; background:#ff9c4a; color:#fff; padding:12px 24px; border-radius:30px; text-decoration:none; font-weight:bold; font-size:16px;">
                                            Verify my email</a></div>
                                    
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td
                                    style=" text-align:center; color:#444a64; font-size:14px; font-weight: 600; padding:15px 0px 0px ;">
                                    © 2025 PixaScore. All Rights Reserved. 
                                </td>
                            </tr>
                        </tfoot>
 
                    </table>
                </td>
            </tr>
        </table>
    </div>
    `,
}

export const sendEmail = async (type, to, subject, link) => {
    let mailHtml = '';

    switch (type) {
        case 'resetPassword':
            mailHtml = mailType.resetPassword(link);
            if (!link) {
                throw new Error('Link is required for reset password mail');
            }
            break;
        case 'verifyEmail':
            mailHtml = mailType.verifyEmail(link);
            if (!link) {
                throw new Error('Link is required for verify email mail');
            }
            break;    
        default:
            throw new Error('Invalid mail type');
    }

    try {
        var transport = nodemailer.createTransport({
            host: process.env.MandrillHost,
            port: 587,
            secure: false,
            auth: {
                user: process.env.MandrillUser,
                pass: process.env.MandrillPass,
            },
        })
        const mailOptions = {
            from: 'support@pixascore.com',
            to: 'manish.manker@pixelnx.com',
            subject: subject,
            html: mailHtml,
        };

        const info = await transport.sendMail(mailOptions);
        console.log('Email sent successfully:', info);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

