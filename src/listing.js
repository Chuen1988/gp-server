const constant = require('./constant');

/**
 * getValue
 * @param {*} listing 
 * @param {*} key 
 * @returns 
 */
function getValue(listing, key) {

  let value = '';

  for (const object of listing) {

    if (object[constant.listKey] === key) {
      value = object[constant.listValue];
      break;
    }
  }

  return value;

}

/**
 * getKey
 * @param {*} listing 
 * @param {*} value 
 * @returns 
 */
function getKey(listing, value) {

  let key = '';

  for (const object of listing) {

    if (object[constant.listValue] === value) {
      key = object[constant.listKey];
      break;
    }
  }

  return key;

}

/**
 * Key: can be num or string for FE
 * Value: always string
 */

const any = {
  //999 means ANY
  [constant.listKey]: constant.listANY,
  [constant.listValue]: 'Any'
};

function userStatus(isBO) {
  //Hard code userStatus
  let userStatus = [];

  const active = {
    [constant.listKey]: constant.userStatusActive,
    [constant.listValue]: 'Active'
  };

  const emergency = {
    [constant.listKey]: constant.userStatusEmergency,
    [constant.listValue]: 'Emergency'
  };

  const suspended = {
    [constant.listKey]: constant.userStatusSuspended,
    [constant.listValue]: 'Suspended'
  };

  const inActive = {
    [constant.listKey]: constant.userStatusInactive,
    [constant.listValue]: 'Inactive'
  };

  userStatus.push(active);
  userStatus.push(suspended);

  if (isBO) {
    userStatus.push(emergency);
  }

  userStatus.push(inActive);

  return userStatus;
}

function status() {
  return [
    {
      //ACTIVE
      [constant.listKey]: constant.statusActive,
      [constant.listValue]: 'Active'
    },
    {
      //INACTIVE
      [constant.listKey]: constant.statusInactive,
      [constant.listValue]: 'Inactive'
    }
  ];
}

function currencies() {
  //Hard code currencies
  return [
    {
      [constant.listKey]: constant.defaultCurrencyCode,
      [constant.listValue]: 'MYR'
    },
    {
      [constant.listKey]: constant.currencyCodeTHB,
      [constant.listValue]: 'THB'
    },
    {
      [constant.listKey]: constant.currencyCodeVND,
      [constant.listValue]: 'VND'
    },
    {
      [constant.listKey]: constant.currencyCodeSGD,
      [constant.listValue]: 'SGD'
    },
    {
      [constant.listKey]: constant.currencyCodeIDR,
      [constant.listValue]: 'IDR'
    },
    {
      [constant.listKey]: constant.currencyCodeUSD,
      [constant.listValue]: 'USD'
    },
    {
      [constant.listKey]: constant.currencyCodeBDT,
      [constant.listValue]: 'BDT'
    },
    {
      [constant.listKey]: constant.currencyCodeINR,
      [constant.listValue]: 'INR'
    },
    {
      [constant.listKey]: constant.currencyCodeMMK,
      [constant.listValue]: 'MMK'
    },
    {
      [constant.listKey]: constant.currencyCodeAUD,
      [constant.listValue]: 'AUD'
    },
    {
      [constant.listKey]: constant.currencyCodeBND,
      [constant.listValue]: 'BND'
    }
  ];
}

function countries() {
  //Hard code countries
  return [
    {
      [constant.listKey]: constant.defaultCountryCode,
      [constant.listValue]: 'MY'
    },
    {
      [constant.listKey]: constant.countryCodeTH,
      [constant.listValue]: 'TH'
    },
    {
      [constant.listKey]: constant.countryCodeVN,
      [constant.listValue]: 'VN'
    },
    {
      [constant.listKey]: constant.countryCodeSG,
      [constant.listValue]: 'SG'
    },
    {
      [constant.listKey]: constant.countryCodeID,
      [constant.listValue]: 'ID'
    },
    {
      [constant.listKey]: constant.countryCodeUS,
      [constant.listValue]: 'US'
    },
    {
      [constant.listKey]: constant.countryCodeKH,
      [constant.listValue]: 'KH'
    },
    {
      [constant.listKey]: constant.countryCodeBD,
      [constant.listValue]: 'BD'
    },
    {
      [constant.listKey]: constant.countryCodeIN,
      [constant.listValue]: 'IN'
    },
    {
      [constant.listKey]: constant.countryCodeMM,
      [constant.listValue]: 'MM'
    },
    {
      [constant.listKey]: constant.countryCodeAU,
      [constant.listValue]: 'AU'
    },
    {
      [constant.listKey]: constant.countryCodeBN,
      [constant.listValue]: 'BN'
    }
  ];
}

function langauges() {
  //Hard code languages
  return [
    {
      [constant.listKey]: constant.localeEn,
      [constant.listValue]: 'English'
    },
    {
      [constant.listKey]: constant.localeZh,
      [constant.listValue]: '中文'
    },
    {
      [constant.listKey]: constant.localeMs,
      [constant.listValue]: 'Bahasa Melayu'
    },
    {
      [constant.listKey]: constant.localeBn,
      [constant.listValue]: 'Bengali'
    },
    {
      [constant.listKey]: constant.localeTh,
      [constant.listValue]: 'Thai'
    },
    {
      [constant.listKey]: constant.localeKh,
      [constant.listValue]: 'Khmer'
    },
    {
      [constant.listKey]: constant.localeId,
      [constant.listValue]: 'Indonesia'
    }
  ];
}

function roles() {
  //Hard code roles
  return [
    {
      [constant.listKey]: constant.roleMCAdmin,
      [constant.listValue]: 'MCAdmin'
    },
    {
      [constant.listKey]: constant.roleMCManager,
      [constant.listValue]: 'MCManager'
    },
    {
      [constant.listKey]: constant.roleMCCS,
      [constant.listValue]: 'MCCS'
    },
    {
      [constant.listKey]: constant.roleBOAdmin,
      [constant.listValue]: 'Admin'
    },
    {
      [constant.listKey]: constant.roleBOStaff,
      [constant.listValue]: 'Staff'
    },
    {
      [constant.listKey]: constant.roleBOAgent,
      [constant.listValue]: 'Agent'
    },
    {
      [constant.listKey]: constant.roleBOCS,
      [constant.listValue]: 'CS'
    },
    {
      [constant.listKey]: constant.roleBOKounter,
      [constant.listValue]: 'Kounter'
    },
    {
      [constant.listKey]: constant.roleBOHelper,
      [constant.listValue]: 'Helper'
    },
    {
      [constant.listKey]: constant.roleMember,
      [constant.listValue]: 'Member'
    },
  ];
}

module.exports = {
  getValue, getKey, any, userStatus, status, currencies, countries, langauges, roles
};