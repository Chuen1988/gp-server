const localeEn = 'en';
const localeZh = 'zh';
const localeMs = 'ms';
const localeBn = 'bn';
const localeTh = 'th';
const localeKh = 'kh';
const localeId = 'id';

//Default code for companies
const defaultPhoneCode = '60';

//ISO3166
const defaultCountryCode = 'MY'; //Malaysia
const countryCodeTH = 'TH'; //Thailand
const countryCodeVN = 'VN'; //Vietnam
const countryCodeSG = 'SG'; //Singapore
const countryCodeID = 'ID'; //Indonesia
const countryCodeUS = 'US'; //United States
const countryCodeKH = 'KH'; //Cambodia
const countryCodeBD = 'BD'; //Bangladesh
const countryCodeIN = 'IN'; //India
const countryCodeMM = 'MM'; //Myanmar
const countryCodeAU = 'AU'; //Australia
const countryCodeBN = 'BN'; //Brunei

//ISO4217
//Currency Code
const defaultCurrencyCode = 'MYR'; //Malaysia 
const currencyCodeTHB = 'THB'; //Thailand
const currencyCodeVND = 'VND'; //Vietnam
const currencyCodeSGD = 'SGD'; //Singapore
const currencyCodeIDR = 'IDR'; //Indonesia
const currencyCodeUSD = 'USD'; //US/Cambodia
const currencyCodeBDT = 'BDT'; //Bangladesh
const currencyCodeINR = 'INR'; //India
const currencyCodeMMK = 'MMK'; //Myanmar
const currencyCodeAUD = 'AUD'; //Australia
const currencyCodeBND = 'BND'; //Brunei
const currencyCodePHP = 'PHP'; //Philippine Peso

//socket connection provider server
const connectionProviderServer = 'SERVER';
const userAgent = 'user-agent';

//provider
const providerRest = 'rest';
const providerSocketIO = 'socketio';

//subnet prefix
const subnetPrefix = '::ffff:';

//default name
const defaultName = 'default';

//Whitelist mongoose
const whiteListMongoose = ['$populate', '$push', '$pull', '$in', '$ne', '$text', '$regex', '$options', '$search', '$caseSensitive', '$select', '$inc', '$nin'];
const fuzzySearchExcludedFields = ['dummyField'];

//Users verification attempts and reset password attempts
const verifyAttempts = 2;
const resetAttempts = 2;
//Users verification and reset password otp resend
const smsResendLimitDefault = 3;

//Secret key for front end
const secretKey = 'thebestsecretkey';

//API Rate Limit
const apiRateLimitThreshold = 1;

//List
const listKey = 'key';
const listValue = 'value';
const listANY = 999;

//MC
const roleMCAdmin = 1;
const roleMCManager = 2;
const roleMCCS = 3;
//BO
const roleBOAdmin = 4;
const roleBOStaff = 5;
const roleBOAgent = 6;
const roleBOCS = 7;
const roleBOKounter = 8;
const roleBOHelper = 9;
//Member
const roleMember = 10;

//User status
const userStatusActive = 1;
const userStatusEmergency = 2;
const userStatusSuspended = 3;
const userStatusInactive = 4;

//Status
const statusActive = 1;
const statusInactive = 2;

//HTTP Request Method
const httpRequestGET = 'GET';
const httpRequestPOST = 'POST';

//TODO Populate
const usersPopulateQuery = ['rooms', 'company', 'createdBy'];
const companiesPopulateQuery = ['createdBy'];
const roomsPopulateQuery = ['user', 'company', 'lastMessage'];
const messagesPopulateQuery = ['user', 'room', 'company'];

//CompanyID
const companyIDFormat = 'GP';
//Company brand name SMS
const companyBrandNameSMS = 'GP';
//Environment for Production and Staging (Naming for game to differentiate Production and Staging)
const environmentName = process.env.NODE_ENV === 'production' ? 'P' : 'S';

const crudApiMaxRetry = 5;

//Select fields
const usersPlayerNotifierSelectFields = ['_id', 'contactNumber', 'company'];

//5 minutes (300000ms)
const axiosTimeout = 300000;

//Ginota
//TODO SMS Vendor
const smsVendorGinota = 1;

//Ginota
//TODO SMS Vendor
const smsVendorGinotaUrl = 'https://www.ginota.com';
//TODO Invalid ApiKey
const smsVendorGinotaApiKey = '9VAnL2T%2Bv6lAwakSpyZST4Fqu3i5dxMS';
const smsVendorGinotaApiSecret = 'Un%jU530A$';

module.exports = {
  localeEn, localeZh, localeMs, localeBn, localeTh, localeKh, localeId,
  defaultCountryCode, countryCodeTH, countryCodeVN, countryCodeSG, countryCodeID, countryCodeUS, countryCodeKH, countryCodeBD,
  countryCodeIN, countryCodeMM, countryCodeAU, countryCodeBN,
  defaultPhoneCode, defaultCurrencyCode, currencyCodeTHB, currencyCodeVND, currencyCodeSGD, currencyCodeIDR, currencyCodeUSD,
  currencyCodeBDT, currencyCodeINR, currencyCodeMMK, currencyCodeAUD, currencyCodeBND, currencyCodePHP,
  roleMCAdmin, roleMCManager, roleMCCS, roleBOAdmin, roleBOStaff, roleBOAgent, roleBOCS, roleBOKounter, roleBOHelper, roleMember,
  connectionProviderServer, userAgent, providerRest, providerSocketIO, subnetPrefix, defaultName,
  whiteListMongoose, fuzzySearchExcludedFields,
  verifyAttempts, resetAttempts, smsResendLimitDefault, secretKey,
  apiRateLimitThreshold, userStatusActive, userStatusEmergency, userStatusSuspended, userStatusInactive,
  listKey, listValue, listANY, statusActive, statusInactive, httpRequestGET, httpRequestPOST,
  usersPopulateQuery, companiesPopulateQuery, roomsPopulateQuery, messagesPopulateQuery,
  companyIDFormat, companyBrandNameSMS, environmentName, crudApiMaxRetry, usersPlayerNotifierSelectFields, axiosTimeout,
  smsVendorGinota, smsVendorGinotaUrl, smsVendorGinotaApiKey, smsVendorGinotaApiSecret
};