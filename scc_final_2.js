/**
 * Utility file
 */
const moment = require('moment');
const os = require('os');
const { environment } = require('../config/index');
const path = require('path');
const Logger = require('./logger');

/**
 * returns the IP address of the server instance
 *
 * @function GetInstanceHost
 * @returns {String} - IP string
 * @author dev-team
 */

const GetInstanceHost = () => {
  const hostname = os.hostname();
  Logger.log('info', `The instance hostname is ${hostname}`);
  return hostname;
};

/**
 * returns status code with success response
 *
 * @function SuccessResponse
 * @param {object} data
 * @returns {object} - object for success response
 * @author dev-team
 */

const SuccessResponse = data => {
  try {
    return { status: 'success', statusCode: '200', data };
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

const ErrorResponse = data => {
  try {
    return { status: 'error', statusCode: data.statusCode, data: data.response.body.message };
  } catch (exc) {
    Logger.log('error', `Error in ErrorResponse in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * returns url
 *
 * @function GetUrl
 * @param {string} orgName
 * @param {string} repoName
 * @param {string} metrics
 * @param {string} value
 * @returns {string} - url
 * @author dev-team
 */

const GetUrl = (orgName, repoName, metrics, value) => {
  try {
    return `https://${environment.hostName}/${orgName}/${repoName}/${metrics}/${value}`;
  } catch (exc) {
    Logger.log('error', `Error in GetUrl in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * returns time
 *
 * @function GetTime
 * @param {number} time
 * @param {string} type - like hours or minutes
 * @returns {object} - object for success response
 * @author dev-team
 */

const GetTime = (time, type) => {
  try {
    return moment()
      .add(time, type)
      .utc()
      .format('YYYY-MM-DDTHH:mm:ss[Z]');
  } catch (exc) {
    Logger.log('error', `Error in GetTime in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

module.exports = {
  SuccessResponse,
  ErrorResponse,
  GetUrl,
  GetTime,
  GetInstanceHost
};
