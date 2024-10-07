const { FeathersError } = require('@feathersjs/errors');

//Token is revoked
const customErrorCode445 = 445;
//Whatsapp QR expired
const customErrorCode446 = 446;
//MFA enabled
const customErrorCode447 = 447;
//OTP required
const customErrorCode448 = 448;
//Room not found
const customErrorCode449 = 449;
//Registration OTP required
const customErrorCode450 = 450;
//API Rate limit
const customErrorCode455 = 455;

//Custom Error Header
const customErrorHeader = 'Error!';
//Custom Warning Header
const customWarningHeader = 'Warning!';
//Custom Oops Header
const customOopsHeader = 'Oops!';

class CustomError extends FeathersError {
  constructor(name, message, code, className, data) {
    super(message, name, code, className, data);
  }
}

function show(name, message, code, className, data) {
  throw new CustomError(name, message, code, className, data);
}

module.exports = {
  customErrorCode445, customErrorCode446, customErrorCode447, customErrorCode448, customErrorCode449, customErrorCode450, customErrorCode455,
  customErrorHeader, customWarningHeader, customOopsHeader,
  show
};