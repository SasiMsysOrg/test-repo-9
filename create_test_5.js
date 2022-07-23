/**
 * Utility file
 */
const bcrypt = require('bcrypt');
const path = require('path');
const jwt = require('jsonwebtoken');
const Logger = require('./logger');
const { Environment } = require('../config/index');

const saltRounds = 10;

const SuccessResponse = data => {
  const success = { status: 'success', statusCode: '200', data };
  return success;
};

const SuccessResponseMsg = message => {
  const success = { status: 'success', statusCode: '200', message };
  return success;
};

const NotFoundResponse = data => {
  const error = { status: 'error', statusCode: 404, message: `${data} not found` };
  return error;
};

const InvalidResponse = () => {
  const invalid = { status: 'invalid', statusCode: '403', message: 'Token expired' };
  return invalid;
};

const InvalidToken = () => {
  const invalid = { status: 'invalid', statusCode: '403', message: 'Invalid token' };
  return invalid;
};

const InvalidUser = () => {
  const invalid = { status: 'error', statusCode: '404', message: 'Not found' };
  return invalid;
};

const UnauthorizedUser = () => {
  return { status: 'error', statusCode: 401, message: 'Unauthorized user' };
};

const EncryptPassword = async password => {
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
  } catch (exc) {
    Logger.log('error', `Error in EncryptPassword in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

const DecryptPassword = async (hash, password) => {
  const match = await bcrypt.compare(password, hash);
  return match;
};

const DecryptToken = async token => {
  try {
    const decoded = jwt.verify(token, Environment.key);
    return decoded;
  } catch (exc) {
    Logger.log('error', `Error in DecryptToken in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

const CountDiffCalculation = async data => {
  let prev = 0;
  data.forEach(item => {
    const curr = item.count;
    item.count = curr - prev;
    prev = curr;
  });
  return data;
};

const CalculateCountFromObject = async (data, startDate, endDate) => {
  const resData = data.filter(dd => dd.date !== null && dd.date >= startDate && dd.date <= endDate);
  return resData.reduce((acc, curr) => acc + curr.count, 0);
};

module.exports = {
  SuccessResponse,
  NotFoundResponse,
  InvalidResponse,
  InvalidUser,
  UnauthorizedUser,
  InvalidToken,
  DecryptPassword,
  DecryptToken,
  CalculateCountFromObject,
  CountDiffCalculation,
  SuccessResponseMsg,
  EncryptPassword
};
