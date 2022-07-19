/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
/* eslint-disable no-return-await */
/* eslint-disable no-case-declarations */
/* eslint-disable no-restricted-syntax */
/**
 * Utility file
 */
const moment = require('moment');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const Logger = require('./logger');

const saltRounds = 10;

dotenv.config();

/**
 * returns status code with success response
 *
 * @function SuccessResponse
 * @param {object} data
 * @returns {object} - object for success response
 * @author dev-team
 */
const SuccessResponse = async data => {
  try {
    const success = { status: 'success', statusCode: '200', data };
    return success;
  } catch (exc) {
    Logger.log('error', `Error in SuccessResponse in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * returns status code with error response
 *
 * @function ErrorResponse
 * @param {object} data
 * @returns {object} - object for error response
 * @author dev-team
 */
const ErrorResponse = async data => {
  try {
    const error = {
      status: 'error',
      statusCode: data && data.statusCode ? data.statusCode : '200',
      data: data && data.response ? data.response.body.message : 'No Data'
    };
    return error;
  } catch (exc) {
    Logger.log('error', `Error in ErrorResponse in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * returns status code with error response
 *
 * @function ValidatioErrorResponse
 * @param {object} data
 * @returns {object} - object for error response
 * @author dev-team
 */
const ValidationErrorResponse = async data => {
  try {
    const error = {
      status: 'validation-error',
      statusCode: data && data.statusCode ? data.statusCode : '204',
      data: data && data.error ? data.error.details[0].message : 'Data missing'
    };
    return error;
  } catch (exc) {
    Logger.log('error', `Error in ErrorResponse in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * returns status code with Invalid response
 *
 * @function InvalidResponse
 * @returns {object} - object for Invalid response
 * @author dev-team
 */
const InvalidResponse = () => {
  return { status: 'invalid', statusCode: '403', message: 'Token expired' };
};

/**
 * returns status code with Invalid Token response
 *
 * @function InvalidToken
 * @returns {object} - object for Invalid Token response
 * @author dev-team
 */
const InvalidToken = () => {
  return { status: 'invalid', statusCode: '403', message: 'Invalid token' };
};

/**
 * returns status code with Invalid User response
 *
 * @function InvalidUser
 * @returns {object} - object for Invalid User response
 * @author dev-team
 */
const InvalidUser = () => {
  return { status: 'error', statusCode: '404', message: 'Not found' };
};

/**
 * returns status code with User not found response
 *
 * @function UserNotFound
 * @returns {object} - object for User Not found response
 * @author dev-team
 */
const UserNotFound = () => {
  return { status: 'error', statusCode: 404, message: 'User not found' };
};

/**
 * returns status code with Unauthorized user response
 *
 * @function UnauthorizedUser
 * @returns {object} - object for Unauthorized user response
 * @author dev-team
 */
const UnauthorizedUser = () => {
  return { status: 'error', statusCode: 401, message: 'Unauthorized user' };
};

/**
 * returns status code with User Data Exist response
 *
 * @function UserDataExistSSO
 * @returns {object} - object for User Data Exist response
 * @author dev-team
 */
const UserDataExistSSO = () => {
  return { status: 'error', statusCode: 409, message: 'User already registered using Github account' };
};

/**
 * returns status code with User name or mail Exist response
 *
 * @function UserNameOrMailExist
 * @returns {object} - object for User name or mail Exist response
 * @author dev-team
 */
const UserNameOrMailExist = () => {
  return { status: 'error', statusCode: 409, message: 'Username or Usermail already exist' };
};

/**
 * Encrypts password
 *
 * @function EncryptPassword
 * @param {string} password
 * @returns {string} - encrypted password
 * @author dev-team
 */
const EncryptPassword = async password => {
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
  } catch (exc) {
    Logger.log('error', `Error in EncryptPassword in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Decrypts password
 *
 * @function DecryptPassword
 * @param {string} hash
 * @param {string} password
 * @returns {string} - decrypted password
 * @author dev-team
 */
const DecryptPassword = async (hash, password) => {
  try {
    const match = await bcrypt.compare(password, hash);
    return match;
  } catch (exc) {
    Logger.log('error', `Error in DecryptPassword in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Decrypts token
 *
 * @function DecryptPassword
 * @param {string} token
 * @returns {object} - decrypted token
 * @author dev-team
 */
const DecryptToken = async token => {
  try {
    const decoded = jwt.verify(token, process.env.KEY);
    return decoded;
  } catch (exc) {
    Logger.log('error', `Error in DecryptToken in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Signs token
 *
 * @function SignToken
 * @param {object} data
 * @returns {string} - signed token
 * @author dev-team
 */
const SignToken = async data => {
  try {
    const token = await jwt.sign(data, process.env.KEY);
    return token;
  } catch (exc) {
    Logger.log('error', `Error in SignToken in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Validates token
 *
 * @function ValidateToken
 * @param {string} token
 * @returns {boolean} - returns flag (true if token is valid and false if token is not valid)
 * @author dev-team
 */
const ValidateToken = async token => {
  try {
    let flag = true;
    jwt.verify(token, process.env.KEY, err => {
      if (err) {
        flag = false;
      }
    });
    return flag;
  } catch (exc) {
    Logger.log('error', `Error in ValidateToken in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * returns round number for given input
 *
 * @function RoundOf
 * @param {number} hours
 * @param {number} length
 * @returns {number} - round number for the given input
 * @author dev-team
 */
const RoundOf = (hours, length) => {
  try {
    if (hours > 0 && hours < 0.5) return 0.5;
    return hours === 0 ? 0 : Math.round(hours / length);
  } catch (exc) {
    Logger.log('error', `Error in RoundOf in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Difference between current and previous counts
 *
 * @function CountDiffCalculation
 * @param {array} data
 * @returns {array} - returns an array with count which is the difference of current and previous counts
 * @author dev-team
 */
const CountDiffCalculation = async data => {
  try {
    let prev = 0;
    data.forEach(item => {
      const curr = item.count;
      item.count = curr - prev;
      prev = curr;
    });
    return data;
  } catch (exc) {
    Logger.log('error', `Error in CountDiffCalculation in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Count from Object
 *
 * @function CalculateCountFromObject
 * @param {array} data
 * @param {string} startDate
 * @param {string} endDate
 * @returns {object} - returns respective count from the object passed
 * @author dev-team
 */
const CalculateCountFromObject = async (data, startDate, endDate) => {
  try {
    const resData = data.filter(dd => dd.date && dd.date >= startDate && dd.date <= endDate);
    return resData.reduce((acc, curr) => acc + curr.count, 0);
  } catch (exc) {
    Logger.log('error', `Error in CalculateCountFromObject in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Get Count for given APIs
 *
 * @function GetCount
 * @param {array} data
 * @param {string} api
 * @returns {number} - returns count for given APIs
 * @author dev-team
 */
const GetCount = async (data, api) => {
  try {
    let count = 0;

    switch (api.toUpperCase()) {
      case 'GETVISITORS':
        data.forEach(view => {
          count += view.uniques;
        });
        return count;
      case 'GETVISITS':
        data.forEach(view => {
          count += view.count;
        });
        return count;
      case 'GETRELEASES':
      case 'GETWATCHERS':
        const totalCount = [];
        data.forEach(dat => {
          totalCount.push(dat.count);
        });
        if (totalCount.length) count += Math.max(...totalCount);
        return count;
      case 'GETCLONES':
        data.forEach(clone => {
          count += clone.count;
        });
        return count;
      case 'GETFORKS':
        count = data.length;
        data.forEach(fork => {
          if (fork.count > 0) {
            count += fork.count;
          }
        });
        return count;
      case 'GETCONTRIBUTORS':
        const uniqueData = [...new Map(data.map(item => [item.email, item])).values()];
        return uniqueData.length;
      default:
        return data.length;
    }
  } catch (exc) {
    Logger.log('error', `Error in GetCount in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Difference of current (week or month) count and previous (week or month) count for Cards API
 *
 * @function StatDataBasedOnDuration
 * @param {array} data
 * @param {object} opts
 * @param {string} type
 * @param {string} api
 * @returns {number} - returns the difference of current count and previous count for given APIs
 * @author dev-team
 */
const StatDataBasedOnDuration = async (data, opts, api, type) => {
  try {
    const currentWeekOrMonthData = data.filter(el => el.date && el.date >= opts.since && el.date <= opts.until);
    const currentWeekOrMonthCount = await GetCount(currentWeekOrMonthData, api);

    // eslint-disable-next-line prettier/prettier
    const startOfPreviousWeekOrMonth = moment(new Date(opts.since)).add(-1, type).utc().format("YYYY-MM-DDTHH:mm:ss[Z]");
    // eslint-disable-next-line prettier/prettier
    const endOfPreviousWeekOrMonth = moment(new Date(opts.until)).add(-1, type).utc().format("YYYY-MM-DDTHH:mm:ss[Z]");

    const previousWeekOrMonthData = data.filter(el => el.date !== null && el.date >= startOfPreviousWeekOrMonth && el.date <= endOfPreviousWeekOrMonth);
    const previousWeekOrMonthCount = await GetCount(previousWeekOrMonthData, api);

    return currentWeekOrMonthCount - previousWeekOrMonthCount;
  } catch (exc) {
    Logger.log('error', `Error in StatDataBasedOnDuration in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Difference of current day count and previous day count for Cards API
 *
 * @function StatDataForDays
 * @param {array} data
 * @param {object} opts
 * @param {string} api
 * @returns {number} - returns the difference of current count and previous count for given APIs
 * @author dev-team
 */
const StatDataForDays = async (data, opts, api) => {
  try {
    // eslint-disable-next-line prettier/prettier
  const beforeDayStart = moment(new Date(opts.since)).add(-1, 'day').utc().format("YYYY-MM-DDTHH:mm:ss[Z]");
    const beforeDayEnd = moment(new Date(opts.until))
      .add(-1, 'day')
      .utc()
      .format('YYYY-MM-DDTHH:mm:ss[Z]');

    const selectedDayData = data.filter(el => el.date && el.date >= opts.since && el.date <= opts.until);
    const beforeDayData = data.filter(el => el.date && el.date >= beforeDayStart && el.date <= beforeDayEnd);

    const [todayCount, beforeDayCount] = await Promise.all([GetCount(selectedDayData, api), GetCount(beforeDayData, api)]);
    return todayCount - beforeDayCount;
  } catch (exc) {
    Logger.log('error', `Error in StatDataForDays in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Compares data based on selected time range
 *
 * @function StatisticalDataComparison
 * @param {array} data
 * @param {object} opts
 * @param {string} timeRange
 * @param {string} api
 * @returns {number} - returns the difference of current count and previous count for given APIs
 * @author dev-team
 */
const StatisticalDataComparison = async (data, opts, timeRange, api = '') => {
  try {
    switch (timeRange) {
      case 'day':
        return await StatDataForDays(data, opts, api);
      case 'week':
        return await StatDataBasedOnDuration(data, opts, api, 'week');
      default:
        return await StatDataBasedOnDuration(data, opts, api, 'month');
    }
  } catch (exc) {
    Logger.log('error', `Error in StatisticalDataComparison in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Finds selected option duration
 *
 * @function GetCustomDuration
 * @param {object} opts
 * @returns {string} - returns selected option duration according to the input days
 * @author dev-team
 */
const GetSelectedOption = async opts => {
  try {
    const days = (Date.parse(opts.until) - Date.parse(opts.since)) / 86400000;
    switch (true) {
      case days > 7:
        return 'month';
      case days <= 1:
        return 'day';
      default:
        return 'week';
    }
  } catch (exc) {
    Logger.log('error', `Error in GetSelectedOption in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Get average time taken to close
 *
 * @function GetAverageTimeTakenToClose
 * @param {array} data
 * @param {string} startDate
 * @param {string} endDate
 * @returns {number} - returns average time taken to close
 * @author dev-team
 */
const GetAverageTimeTakenToClose = async (data, startDate, endDate) => {
  try {
    let hours = 0;
    data = data.filter(el => el.closed_at && el.closed_at >= startDate && el.closed_at <= endDate);
    data.forEach(dat => {
      hours += (Date.parse(dat.closed_at) - Date.parse(dat.created_at)) / 36e5;
    });
    return RoundOf(hours, data.length);
  } catch (exc) {
    Logger.log('error', `Error in GetAverageTimeTakenToClose in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Get average time taken to create
 *
 * @function GetAverageTimeTakenToCreate
 * @param {array} data
 * @returns {number} - returns average time taken to create
 * @author dev-team
 */
const GetAverageTimeTakenToCreate = async data => {
  try {
    let hours = 0;
    data.sort((a, b) => {
      return a.number - b.number;
    });
    if (data.length > 1) {
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < data.length; i++) {
        const currCreatedAt = data[i].created_at;
        if (i + 1 < data.length) {
          const nextCreatedAt = data[i + 1].created_at;
          hours += (Date.parse(nextCreatedAt) - Date.parse(currCreatedAt)) / 36e5;
        }
      }
    }
    return RoundOf(hours, data.length);
  } catch (exc) {
    Logger.log('error', `Error in GetAverageTimeTakenToCreate in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Get average time taken to review
 *
 * @function GetAverageTimeTakenToReview
 * @param {array} data
 * @returns {number} - returns average time taken to review
 * @author dev-team
 */
const GetAverageTimeTakenToReview = async data => {
  try {
    let hours = 0;
    let dataCount = 0;
    data.forEach(dat => {
      if (dat.reviewers && dat.reviewers.length) {
        const approvedData = dat.reviewers.filter(item => item.status === 'APPROVED');
        approvedData.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
        if (approvedData.length) {
          dataCount += 1;
          hours += (Date.parse(approvedData[0].submitted_at) - Date.parse(dat.created_at)) / 36e5;
        }
      }
    });
    return RoundOf(hours, dataCount);
  } catch (exc) {
    Logger.log('error', `Error in GetAverageTimeTakenToReview in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Checks token expiry
 *
 * @function TokenExpirationCheck
 * @param {string} expirationTime
 * @returns {boolean} - returns flag for token expiry
 * @author dev-team
 */
const TokenExpirationCheck = async expirationTime => {
  try {
    const today = `${
      moment()
        .toISOString()
        .split('.')[0]
    }Z`;
    return moment(expirationTime) > moment(today);
  } catch (exc) {
    Logger.log('error', `Error in TokenExpirationCheck in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

module.exports = {
  SuccessResponse,
  ErrorResponse,
  InvalidResponse,
  InvalidUser,
  UserNotFound,
  UnauthorizedUser,
  UserDataExistSSO,
  UserNameOrMailExist,
  InvalidToken,
  EncryptPassword,
  DecryptPassword,
  SignToken,
  DecryptToken,
  ValidateToken,
  CalculateCountFromObject,
  CountDiffCalculation,
  StatisticalDataComparison,
  GetAverageTimeTakenToClose,
  GetAverageTimeTakenToCreate,
  GetAverageTimeTakenToReview,
  GetSelectedOption,
  TokenExpirationCheck,
  ValidationErrorResponse
};
