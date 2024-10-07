const crypto = require('crypto');
const mongoose = require('mongoose');
const Promise = require('bluebird');
const axios = require('axios');
const AES256 = require('aes-everywhere');
const { BadRequest } = require('@feathersjs/errors');
const createIORedisClient = require('./redis-client');
const constant = require('./constant');
const logger = require('./logger');

//Encryption Key
const ENCRYPTION_KEY = 'ezsdeQeKrkzJNEH9ZEj9NxAHRu43Xy73'; // Must be 256 bits (32 characters)
//IV
let IV = Buffer.alloc(16);
IV.fill('0');

/**
 * Get random string in number
 * @param {*} length 
 * @returns 
 */
function getRandomStringNumber(length) {
  let randomChars = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
  }
  return result;
}

/**
 * getRandomNumeric
 * @param {*} length
 * @returns
 */
function getRandomNumeric(length) {
  return parseInt(getRandomStringNumber(length));
}

/**
 * Get Random Alphanumeric with given length
 * @param {*} length 
 * @returns 
 */
function getRandomAplhanumeric(length) {
  let randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnostuvwxyzpqr0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
  }

  return result;
}

/**
 * Encryption
 * @param {*} text
 * @param {*} text
 * @param {*} text
 */
function encrypt(text, keyValue = ENCRYPTION_KEY, ivValue = IV, encoding = 'hex') {
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(keyValue), ivValue);
  let encrypted = cipher.update(text);

  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return encrypted.toString(encoding);
}

/**
 * Decryption
 * @param {*} text
 * @param {*} text
 * @param {*} text
 */
function decrypt(text, keyValue = ENCRYPTION_KEY, ivValue = IV) {
  let encryptedText = Buffer.from(text, 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(keyValue), ivValue);
  let decrypted = decipher.update(encryptedText);

  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}

/**
 * Check duplicate string in array
 * @param {*} array 
 * @returns 
 */
function hasDuplicates(array) {
  let newArray = [];
  let isDuplicate = false;

  if (array?.length > 0) {
    loopArray:
    for (const item of array) {

      loopNewArray:
      for (const newItem of newArray) {

        if (item === newItem) {
          isDuplicate = true;
          break loopNewArray;
        }
      }

      if (isDuplicate) {
        break loopArray;
      }
      else {
        newArray.push(item);
      }
    }
  }

  return isDuplicate;
}

/**
 * getSplitCommaColonValue
 * @param {*} originalText 
 * @param {*} key 
 */
function getSplitCommaColonValue(originalText, key) {
  let filterString = replaceAll(originalText, '{', '');
  filterString = replaceAll(filterString, '}', '');

  const result1 = filterString.split(/[:,]/);
  const result1Split = result1.toString().split(',');

  let index = 0;

  for (let i = 0; i < result1Split.length; i++) {

    if (result1Split[i].includes(key)) {
      index = i + 1;
      break;
    }
  }

  return result1Split[index];
}

// this function filters source keys (one level deep) according to whitelist
/**
 * 
 * @param {*} source 
 * @param {*} whiteList 
 * @returns 
 */
function filterObj(source, whiteList) {
  return whiteList.reduce(
    (result, key) =>
      source[key] !== undefined
        ? Object.assign(result, { [key]: source[key] })
        : result,
    {}
  );
}

/**
 * The maximum is exclusive and the minimum is inclusive
 * @param {*} min 
 * @param {*} max 
 * @returns 
 */
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

/**
 * The maximum is inclusive and the minimum is inclusive
 * @param {*} min 
 * @param {*} max 
 * @param {*} decimalPlaces 
 * @returns Number
 */
function getRandomDecimal(min, max, decimalPlaces) {
  return Number((Math.random() * (max - min) + min).toFixed(decimalPlaces) * 1);
}

/**
 * Check valid digit
 * @param {*} inputText 
 * @returns 
 */
function isValidDigit(inputText) {
  //valid digit on phone number
  return /^\d+$/.test(inputText);
}

/**
 * Check valid OTP
 * @param {*} inputText 
 */
function isValidOTP(inputText) {
  if (inputText.length === 6 && isValidDigit(inputText)) {
    return true;
  }
  else {
    return false;
  }
}


/**
 * Convert Array String to Array Number
 * @param {*} arrayString 
 * @returns 
 */
function convertArrayStringtoNumber(arrayString) {
  let arrayNumber = arrayString;
  return arrayNumber.map(function (x) {
    return parseInt(x, 10);
  });
}

/**
 * Convert Array String to Array ObjectId
 * @param {*} arrayString 
 * @returns 
 */
function convertArrayStringtoObjectId(arrayString) {
  let arrayObjectId = arrayString;
  return arrayObjectId.map(function (x) {
    return new mongoose.Types.ObjectId(x);
  });
}

/**
 * convert to number
 * @param {*} number 
 * @returns 
 */
function convertToNumber(number) {

  if (number) {
    if (typeof number == 'number') {
      return Number(number);
    }
    else {
      /* eslint-disable no-useless-escape */
      const numberInString = number.match(/\d|\.|\-/g).join('');
      return Number(numberInString);
    }
  }
  else {
    return 0;
  }
}

/**
 * Convert to two decimal in float(number) type
 * @param {*} number 
 * @returns 
 */
function twoDecimalConversionFloat(number) {

  if (number == null)
    return null;

  return Math.round(Number(number) * 100) / 100;

}

/**
 * Convert to two decimal in String type
 * @param {*} number 
 * @returns 
 */
function twoDecimalConversionString(number) {

  if (number == null)
    return null;

  return Number(number).toFixed(2);
}

/**
 * Generate Unique Code based on Time Stamp
 */
function generateUniqueCodeTimeStamp() {
  return (Math.round(Date.now())).toString(36);
}

/**
 * Check is the object empty
 * @param {*} obj 
 * @returns 
 */
function isEmptyObject(obj) {
  return JSON.stringify(obj) === '{}';
}

/**
 * Get Object Id
 * @param {*} object 
 * @returns 
 */
function getObjectId(object) {

  if (object) {

    let objectId;

    if (mongoose.Types.ObjectId.isValid(object)) {

      //Check is valid object id
      if ((String)(new mongoose.Types.ObjectId(object)) === object) {
        objectId = object;
      }
      else {
        objectId = object._id;
      }
    }
    else {
      objectId = object._id;
    }

    return objectId;
  }
  else {
    return null;
  }
}

/**
 * Convert Object to String and return string if it is not object
 * @param {*} data 
 * @returns 
 */
function objectToString(data) {
  try {
    if (typeof data !== 'object') {
      return data;
    } else {
      return JSON.stringify(data);
    }
  } catch (e) {
    return data;
  }
}

/**
 * Remove duplicate from arraylist
 * @param {*} arrayList 
 * @returns 
 */
function removeDuplicateFromList(arrayList) {
  return arrayList.filter(function (elem, pos) {
    return arrayList.indexOf(elem) == pos;
  });
}

/**
 * For xml2json
 * @param {*} value 
 * @param {*} parentElement 
 */
function xml2jsonRemoveJsonTextAttribute(value, parentElement) {
  try {
    const parentOfParent = parentElement._parent;
    const pOpKeys = Object.keys(parentElement._parent);
    const keyNo = pOpKeys.length;
    const keyName = pOpKeys[keyNo - 1];
    const arrOfKey = parentElement._parent[keyName];
    const arrOfKeyLen = arrOfKey.length;
    if (arrOfKeyLen > 0) {
      const arr = arrOfKey;
      const arrIndex = arrOfKey.length - 1;
      arr[arrIndex] = value;
    } else {
      parentElement._parent[keyName] = value;
    }
  } catch (error) {
    logger.custom.error(`[utils.js] ###xml2jsonRemoveJsonTextAttribute error - ${error}###`);
  }
}

/**
 * Promise map
 * @param {*} arrayPromise 
 * @returns 
 */
//NOTES!!! not guaranteed in order
async function promiseMap(arrayPromise) {

  let resultPromiseMap = [];

  if (arrayPromise.length > 0) {

    resultPromiseMap = await Promise.map(arrayPromise, function (object) {
      // Promise.map awaits for returned promises as well.
      return object;
    }, { concurrency: 10 });

  }

  return resultPromiseMap;
}

/**
 * Promise all by pool
 * @param {*} arrayPromise 
 * @returns 
 */
async function promiseAllByPool(arrayPromise) {
  let resultPromiseAll = [];

  if (arrayPromise.length > 0) {

    const concurrentPool = 10;
    let currentPool = 1;

    let arrayPromiseAll = [];

    for (let i = 0; i < arrayPromise.length; i++) {

      const nextPool = concurrentPool * currentPool;

      if (i >= nextPool) {
        arrayPromiseAll.push(arrayPromise[i]);
        const result = await Promise.all(arrayPromiseAll);
        resultPromiseAll = resultPromiseAll.concat(result);

        //Update for next pool
        currentPool = currentPool + 1;
        //Clear array
        arrayPromiseAll = [];
      }
      else {
        arrayPromiseAll.push(arrayPromise[i]);
      }
    }

    if (arrayPromiseAll.length > 0) {
      const result = await Promise.all(arrayPromiseAll);
      resultPromiseAll = resultPromiseAll.concat(result);
    }

  }

  return resultPromiseAll;
}

/**
 * sleep
 * @param {*} ms 
 * @returns 
 */
async function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

/**
 * 
 * @param {*} str 
 * @returns 
 */
function isNumericOnly(str) {
  return str.match(/^[0-9]+$/) != null;
}

/**
 * encodeDESCBC
 * @param {*} encodeText
 * @param {*} key
 * @param {*} iv 
 * @returns 
 */
function encodeDESCBC(encodeText, key, iv) {
  let bufferKey = key.length >= 8 ? key.slice(0, 8) : key.concat('0'.repeat(8 - key.length));
  let bufferIv = iv.length >= 8 ? iv.slice(0, 8) : iv.concat('0'.repeat(8 - iv.length));

  const finalKey = Buffer.from(bufferKey);
  const finalIv = Buffer.from(bufferIv);

  const encipher = crypto.createCipheriv('des-cbc', finalKey, finalIv);
  let encode = encipher.update(encodeText, 'utf8', 'base64');
  encode += encipher.final('base64');

  return encode;
}

/**
 * encodeDESECB
 * @param {*} encodeText
 * @param {*} key
 * @returns
 */
function encodeDESECB(encodeText, key) {
  let bufferKey = key.length >= 8 ? key.slice(0, 8) : key.concat('0'.repeat(8 - key.length));

  const finalKey = Buffer.from(bufferKey);
  const encipher = crypto.createCipheriv('des-ecb', finalKey, '');
  let encode = encipher.update(encodeText, 'utf8', 'base64');
  encode += encipher.final('base64');

  return encode;
}

/**
 * encodeAES128ECB
 * @param {*} encodeText
 * @param {*} key
 * @returns
 */
function encodeAES128ECB(encodeText, key) {
  const encipher = crypto.createCipheriv('aes-128-ecb', key, null);
  let encode = encipher.update(encodeText, 'utf8', 'base64');
  encode += encipher.final('base64');

  return encode;
}

/**
 * encodeAES128CBC
 * @param {*} encodeText
 * @param {*} key
 * @param {*} iv
 * @returns
 */
function encodeAES128CBC(encodeText, key, iv) {
  const encipher = crypto.createCipheriv('aes-128-cbc', key, iv);
  let encode = encipher.update(encodeText, 'utf8', 'base64');
  encode += encipher.final('base64');

  return encode;
}

/**
 * encryptAES256CBC
 * @param {*} dataToEncrypt
 * @param {*} encryptionKey
 * @returns 
 */
function encryptAES256CBC(dataToEncrypt, encryptionKey) {
  const encrypted = AES256.encrypt(dataToEncrypt, encryptionKey);

  return encrypted;
}

/**
 * replaceAll
 * @param {*} text 
 * @param {*} pattern 
 * @param {*} replaceValue 
 * @returns 
 */
function replaceAll(text, pattern, replaceValue) {
  let regex = new RegExp(pattern, 'g');
  return text.replace(regex, replaceValue);
}

/**
 * sortJSONObjectByKey
 * @param {*} jsonObject
 */
function sortJSONObjectByKey(jsonObject) {
  //Step 1: Get JSON Key and Sort
  let sortedJSONObject = Object.keys(jsonObject).sort();

  //Step 2: Iterate over the sorted array of keys and assign each key-value pair to an object.
  sortedJSONObject = sortedJSONObject.reduce((newObj, key) => {
    newObj[key] = jsonObject[key];
    return newObj;
  }, {});

  return sortedJSONObject;
}

/**
 * deleteKeysByPattern
 * @param {*} redisKey 
 * @returns 
 */
async function redisDeleteKeysByPattern(app, redisKey) {
  const redisClient = createIORedisClient(app);

  return new Promise((resolve, reject) => {
    const stream = redisClient.scanStream({
      match: redisKey
    });

    stream.on('data', (keys) => {
      if (keys.length) {
        const pipeline = redisClient.pipeline();
        keys.forEach((key) => {
          pipeline.del(key);
        });
        pipeline.exec();
      }
    });

    stream.on('end', () => {
      //quit redis connection
      redisClient.quit();
      resolve();
    });
    stream.on('error', (e) => {
      //quit redis connection
      redisClient.quit();
      reject(e);
    });
  });
}

/**
 * getIPAddress
 * @param {*} params
 */
function getIPAddress(params) {
  //Check IP Address
  let ipAddress = '';
  //REST
  if (params?.provider == constant.providerRest) {
    ipAddress = params?.ip || '';
  }
  //SocketIO
  else if (params?.provider == constant.providerSocketIO) {
    //Get ip address from Client with x-forwarded-for due to HAProxy
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
      ipAddress = params?.handshake?.headers['x-forwarded-for'] || '';
    } else {
      ipAddress = params?.handshake?.address || '';
    }
  }

  //Get ip address from Client with x-forwarded-for due to HAProxy
  //If found subnet prefix in front
  if (process.env.NODE_ENV !== 'production' && ipAddress.substring(0, constant.subnetPrefix.length) === constant.subnetPrefix) {
    ipAddress = ipAddress.substring(constant.subnetPrefix.length);
  }

  return ipAddress;
}

/**
 * Given a string, when it has zero-width spaces in it, then remove them
 *
 * @param {String} stringToTrim The string to be trimmed of unicode spaces
 *
 * @return the trimmed string
 *
 * Regex for zero-width space Unicode characters.
 *
 * U+200B zero-width space.
 * U+200C zero-width non-joiner.
 * U+200D zero-width joiner.
 * U+200E left-to-right mark.
 * U+200F right-to-left mark.
 * U+FEFF zero-width non-breaking space.
 * \s spaces and breaklines
 */
function zeroWidthTrim(stringToTrim) {
  const ZERO_WIDTH_SPACES_REGEX = /([\u200B]+|[\u200C]+|[\u200D]+|[\u200E]+|[\u200F]+|[\uFEFF]+|\s)/g;
  const trimmedString = stringToTrim.replace(ZERO_WIDTH_SPACES_REGEX, '');
  return trimmedString;
}

/**
 * isValidPhoneCodeInCompany
 * @param {*} contactNumber 
 * @param {*} companyPhoneCodes 
 * @returns 
 */
function isValidPhoneCodeInCompany(contactNumber, companyPhoneCodes) {

  let isValidPhoneCodeInCompany = false;

  loopCompanyPhoneCodes:
  for (let phoneCode of companyPhoneCodes) {
    if (contactNumber.startsWith(phoneCode)) {
      isValidPhoneCodeInCompany = true;
      break loopCompanyPhoneCodes;
    }
  }

  return isValidPhoneCodeInCompany;
}

/**
 * Check company SMS and Send SMS (Running in background then and catch)
 * @param {*} app 
 * @param {*} companyDetail 
 * @param {*} smsContent 
 * @param {*} contactNumber 
 * @param {*} throwError
 */
async function checkCompanySMSAndSendSMS(app, companyDetail, smsContent, contactNumber, throwError) {

  const companies = app.service('companies');

  //Check company sms credits
  if (companyDetail.smsCheckCredits) {

    if (companyDetail.smsCredits <= 0) {

      //Ignore sms action
      logger.custom.error(`[utils.js] Company - id: ${companyDetail._id} - name: ${companyDetail.name}, insufficient SMS Credits - ${companyDetail.smsCredits}`);

      if (throwError)
        throw new BadRequest('Please contact Customer Service.');
    }

    //update new smsCredits
    await companies.patch(companyDetail._id, {
      $inc: {
        //Decrease 1
        smsCredits: -1
      }
    }, {
      query: {
        $populate: constant.companiesPopulateQuery
      }
    });

  }

  //Fire sms to player
  //TODO Production Fire sms
  if (process.env.NODE_ENV === 'production') {
    sendSMS(companyDetail, contactNumber, smsContent);
  }
  //TODO Staging Fire sms
  else if (process.env.NODE_ENV === 'staging') {
    sendSMS(companyDetail, contactNumber, smsContent);
  }

}

/**
 * Send SMS
 * @param {*} companyDetail 
 * @param {*} contactNumber 
 * @param {*} content 
 */
function sendSMS(companyDetail, contactNumber, content) {

  let apiKey = companyDetail?.smsApiKey;
  let apiSecret = companyDetail?.smsApiSecret;
  let apiKeyUrlEncoded = encodeURIComponent(companyDetail?.smsApiKey);
  let apiSecretUrlEncoded = encodeURIComponent(companyDetail?.smsApiSecret);
  let contentUrlEncoded = encodeURIComponent(content);

  //Ginota
  if (companyDetail.smsVendor === constant.smsVendorGinota) {
    const getUrl = `${companyDetail.smsUrl}/gemp/sms/json?apiKey=${apiKey}&apiSecret=${apiSecretUrlEncoded}&srcAddr=${constant.companyBrandNameSMS}&dstAddr=${contactNumber}&content=${contentUrlEncoded}`;
    logger.custom.info(`[utils.js] ******Ginota GET url - ${getUrl}*****`);

    axios.get(getUrl, { timeout: constant.axiosTimeout })
      .then((response) => {
        logger.custom.info(`[utils.js] ******Ginota successful called - ${JSON.stringify(response.data)} *****`);
      })
      .catch((error) => {
        logger.custom.error(`[utils.js] ******Ginota failed to called error - ${error} *****`);

        if (error?.response?.data) {
          logger.custom.error(`[utils.js] error.response.data error:: ${JSON.stringify(error.response.data)}`);
        }
        else if (error?.request) {
          logger.custom.error(`[utils.js] error.request error:: ${error.request}`);
        }
        else if (error?.message) {
          logger.custom.error(`[utils.js] error.message error:: ${error.message}`);
        }
      });
  }
}

/**
 * Get Socket UniqueId
 * @param {*} handshake 
 * @returns 
 */
function getSocketUniqueId(handshake) {

  let uniqueId = 'N/A';

  //For FE flutter
  if (handshake?.headers['sec-websocket-key']) {
    uniqueId = handshake.headers['sec-websocket-key'];
  }
  //For FE Reactjs
  else if (handshake?.query?.t) {
    uniqueId = handshake.query.t;
  }

  return uniqueId;

}

module.exports = {
  getRandomStringNumber, getRandomNumeric, getRandomAplhanumeric, encrypt, decrypt, hasDuplicates, getSplitCommaColonValue, filterObj,
  getRandomInt, getRandomDecimal, isValidDigit, isValidOTP, convertArrayStringtoNumber, convertArrayStringtoObjectId, convertToNumber,
  twoDecimalConversionFloat, twoDecimalConversionString, generateUniqueCodeTimeStamp, isEmptyObject, getObjectId, objectToString, removeDuplicateFromList,
  xml2jsonRemoveJsonTextAttribute, promiseMap, promiseAllByPool, sleep, isNumericOnly, encodeDESCBC, encodeDESECB, encodeAES128ECB,
  encodeAES128CBC, encryptAES256CBC, replaceAll, sortJSONObjectByKey, redisDeleteKeysByPattern, getIPAddress, zeroWidthTrim, isValidPhoneCodeInCompany,
  checkCompanySMSAndSendSMS, sendSMS, getSocketUniqueId
};