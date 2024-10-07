const constant = require('../../constant');
const utils = require('../../utils');

module.exports = function (app) {

  return {
    notifier: async function (type, user) {
      //Company
      const companyDetail = user?.company;
      //Member
      const userId = user?._id;
      const contactNumber = user?.contactNumber;
      //Token verification
      const verifyToken = user?.verifyToken;
      const verifyShortToken = user?.verifyShortToken;
      const userStatus = user?.status;
      const userIsVerified = user?.isVerified;
      const resetToken = user?.resetToken;
      const resetShortToken = user?.resetShortToken;

      switch (type) {

      //sending the user Member the verification SMS
      case 'resendVerifySignup':
        
        //check role Member only
        if (user?.role === constant.roleMember) {
          //Send OTP to member ONLY (if it is not active, normal registration). status active means it is from whatsapp bot
          if (userStatus === constant.userStatusActive && userIsVerified === true) {
            //already activated
          } 
          else {
            const smsContent = `${constant.companyBrandNameSMS}: (Registration) Your verification code is:${verifyShortToken}`;
            await utils.checkCompanySMSAndSendSMS(app, companyDetail, smsContent, contactNumber, true);
          }
        }

        //sending the user the verification email

        // tokenLink = getLink('verify', user.verifyToken)
        // email = {
        //    from: app.get('emailSender'),
        //    to: user.email,
        //    subject: 'Verify Sign Up',
        //    html: `<p>Thank you for signing up the app. Please click the link below for verification purpose:</p><p>${tokenLink}</p>`
        // }
        // return sendEmail(email)
        break;

        //sending the user the verification SMS successful
      case 'verifySignup':
        //sending the user the verification email

        // tokenLink = getLink('verify', user.verifyToken)
        // email = {
        //    from: app.get('emailSender'),
        //    to: user.email,
        //    subject: 'Confirm Sign Up',
        //    html: `<p>Thank you for verification.</p>`
        // }
        // return sendEmail(email)
        break;

        //sending the user Member the verification SMS
      case 'sendResetPwd':
        //check role Member only
        if (user?.role === constant.roleMember) {

          const smsContent = `${constant.companyBrandNameSMS}: (Reset) Your verification code is:${resetShortToken}`;

          await utils.checkCompanySMSAndSendSMS(app, companyDetail, smsContent, contactNumber, true);
        }

        //sending the user the reset password email

        // tokenLink = getLink('reset', user.resetToken)
        // email = {
        //   from: app.get('emailSender'),
        //    to: user.email,
        //    subject: 'Reset New Password',
        //    html: `<p>Please click the link below to reset a new password.</p><p>${tokenLink}</p>`
        // }
        // return sendEmail(email)
        break;

        //Sending the user the reset password SMS successfully
      case 'resetPwd':
        //sending the user the reset password email successfully

        // tokenLink = getLink('reset', user.resetToken)
        // email = {
        //   from: app.get('emailSender'),
        //   to: user.email,
        //   subject: 'New Password has changed',
        //   html: '<p>You have changed new password</p>'
        // }
        // return sendEmail(email)
        break;

        // case 'passwordChange':
        //   email = {}
        //   return sendEmail(email)
        //   break

        // case 'identityChange':
        //   tokenLink = getLink('verifyChanges', user.verifyToken)
        //   email = {}
        //   return sendEmail(email)
        //   break

      default:
        break;
      }
    }
  };
};