/* eslint-disable no-use-before-define */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-case-declarations */
/* eslint-disable no-constant-condition */
const path = require('path');
const moment = require('moment');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const {
  constants: { WEEKENDS, DATES_FROMAT, DATE_CATEGORY, MONTHS, JIRA_STATUS_TO_GENERAL_STATUS, DAYS_IN_MONTH }
} = require('../constants');
const Logger = require('./logger');

dotenv.config();

const monthVal = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const currentDate = moment(new Date())
  .utc()
  .set('hours', 18)
  .set('minutes', 29)
  .set('seconds', 59)
  .format('YYYY-MM-DDTHH:mm:ss[Z]');
/**
 * returns the status code with success response
 *
 * @function SuccessResponse
 * @param {object} data
 * @returns {object} - object for success response
 * @author dev-team
 */
const SuccessResponse = async data => {
  return { status: 'success', statusCode: 200, data };
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
  return {
    status: 'error',
    statusCode: data && data.statusCode ? data.statusCode : 404,
    data: data && data.response ? data.response.body.message : 'No Data'
  };
};

/**
 * returns backlogs
 *
 * @async
 * @function GetBacklogCount
 * @param {object} issue
 * @returns {Number}
 * @author dev-team
 */

const GetBacklogCount = async params => {
  try {
    let backlog = 0;
    const { issue, since, until } = params;
    // backlog calculation
    const histories = issue.histories.filter(his => his.date && his.date >= since && his.date <= until).sort((a, b) => new Date(b.date) - new Date(a.date));
    const changeLogs = histories.reduce((acc, cur) => [...acc, cur.change_logs], []);
    const filteredChangeLogs = changeLogs.filter(his => his.field === 'Sprint');
    if (filteredChangeLogs.length) {
      const [recentHistory] = changeLogs;
      if (recentHistory.toString === '') backlog += 1;
      if (recentHistory.fromString === '') backlog -= 1;
    } else {
      const trans = issue.transitions.filter(tran => tran.date && tran.date >= since && tran.date <= until);
      if (!trans.length && !issue.custom_fields?.sprint) backlog += 1;
    }
    return backlog;
  } catch (exc) {
    Logger.log('error', `Error in GetBacklogCount in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * returns issue progression
 *
 * @function GetIssuesProgressionData
 * @param {object} issues and opts
 * @returns {object} - object
 * @author dev-team
 */

const GetIssuesProgressionData = async (issues, since, until, workflow) => {
  try {
    const issueProgression = {};
    let backlog = 0;
    const statuses = Object.values(JIRA_STATUS_TO_GENERAL_STATUS);
    statuses.forEach(status => {
      issueProgression[status] = 0;
    });
    const filteredIssues = issues.filter(iss => iss.created_at && iss.created_at <= until);
    for (const issue of filteredIssues) {
      const [transitions] = issue.transitions.filter(tran => tran.date >= since && tran.date <= until).sort((a, b) => new Date(b.date) - new Date(a.date));
      if (transitions) issueProgression[JIRA_STATUS_TO_GENERAL_STATUS[workflow[transitions.toString]]] += 1;

      backlog = await GetBacklogCount({ issue, since, until });
    }
    return { Backlog: backlog, ...issueProgression };
  } catch (exc) {
    Logger.log('error', `Error in GetIssuesProgressionData in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * To find the dates between two given dates
 *
 * @function GetDates
 * @param {object} data
 * @returns {Array} - array of dates
 * @author dev-team
 */

const GetDates = (startDate, endDate) => {
  const dates = [];
  let newStartDate = moment(startDate);

  while (newStartDate < moment(endDate)) {
    if (WEEKENDS.indexOf(newStartDate.format('dddd')) < 0) {
      dates.push({
        datetime: newStartDate
          .clone()
          .startOf('day')
          .utc()
          .format('YYYY-MM-DDTHH:mm:ss[Z]'),
        dateOnly: newStartDate.format('YYYY-MM-DD')
      });
    }
    newStartDate = moment(newStartDate).add(1, 'days');
  }

  return dates;
};

/**
 * calculate time diff
 *
 * @sync
 * @function GetTimeDifference
 * @param {String} until
 * @param {String} since
 * @param {String} type
 * @returns time diff
 * @author dev-team
 */

const GetTimeDifference = (until, since, type = '') => {
  try {
    switch (true) {
      case type.toUpperCase().includes('HOURS'):
        return Math.round(new Date(until) - new Date(since)) / 3600000;
      default:
        return Math.round((new Date(until) - new Date(since)) / (1000 * 60 * 60 * 24));
    }
  } catch (exc) {
    Logger.log('error', `Error in GetTimeDifference in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

const DateBasedOnCategory = opts => {
  try {
    const { startDate, endDate, category } = opts;

    switch (category.toUpperCase()) {
      case 'WEEK':
        return { startDate, endDate };
      case 'MONTH':
        return { date: `${monthVal[new Date(startDate).getMonth()]} - ${new Date(startDate).getFullYear()}` };
      case 'YEAR':
        return { date: moment(endDate).year() };
      default:
        return { weekend: !!(moment(startDate).day() === 0 || moment(startDate).day() === 6), date: startDate };
    }
  } catch (exc) {
    Logger.log('error', `Error in DateBasedOnCategory in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Data for APIs based on duration
 *
 * @function DataFormationBasedOnDuration
 * @param {object} data
 * @param {string} startDate
 * @param {string} endDate
 * @param {string} api
 * @param {object} opts
 * @returns {object} - returns data for given APIs based on duration
 * @author dev-team
 */
const DataFormationBasedOnDuration = async opts => {
  try {
    // eslint-disable-next-line no-new-object
    let res = {};
    const { data, startDate, endDate, api, workflow } = opts;
    res = { ...res, ...DateBasedOnCategory(opts) };

    switch (api.toUpperCase()) {
      case 'THROUGHPUT':
        res.count = data.filter(dat => dat.closed_at >= startDate && dat.closed_at <= endDate).length;
        break;
      case 'ISSUESPROGRESSION':
        const issueProgression = await GetIssuesProgressionData(data, startDate, endDate, workflow);
        res = { ...res, ...issueProgression };
        break;
      case 'BURNDOWN':
        const storyPoints = [];
        const totalStoryPoints = [];
        data.map(dat => {
          if (dat.date >= startDate && dat.date <= endDate && dat.closed_at) {
            if (dat.story_points) storyPoints.push(dat.story_points);
          }
          if (dat.date >= startDate && dat.date <= endDate) {
            if (dat.story_points) totalStoryPoints.push(dat.story_points);
          }
        }, 0);
        res.burned_sp = storyPoints.reduce((a, b) => a + b, 0);
        res.calculated_sp = totalStoryPoints.reduce((a, b) => a + b, 0);
        res.remaining_sp = res.calculated_sp - res.burned_sp;
        break;
      case 'BURNDOWNGRAPH':
        const graphStoryPoints = [];
        data.map(dat => {
          if (dat.closed_at >= startDate && dat.closed_at <= endDate) {
            if (dat.story_points) graphStoryPoints.push(dat.story_points);
          }
        }, 0);
        res.burned_sp = graphStoryPoints.reduce((a, b) => a + b, 0);
        break;
      case 'COMMENTS':
        res.date = startDate;
        res.count = 0;
        const commentsFiltered = data.filter(dd => dd.created_at >= startDate && dd.created_at <= endDate);
        if (commentsFiltered.length > 0) {
          res.count += commentsFiltered.length;
        }
        break;
      case 'PRIORITIES':
        res.date = startDate;
        const prioritiesFiltered = data.filter(dd => dd.date >= startDate && dd.date <= endDate);
        if (prioritiesFiltered.length > 0) {
          const result = [];
          prioritiesFiltered.reduce((datas, value) => {
            if (!datas[value.priority]) {
              datas[value.priority] = { priority: value.priority, storyPoints: 0 };
              result.push(datas[value.priority]);
            }
            datas[value.priority].storyPoints += value.storyPoints;
            return datas;
          }, {});
          res.priorities = result;
        }
        break;
      case 'USERACTIVITY':
        res.date = startDate;
        res.count = 0;
        res.activity = 'InActive';
        const dataFiltered = data.filter(dd => dd.date >= startDate && dd.date <= endDate);
        if (dataFiltered.length > 0) {
          res.count += dataFiltered.length;
          res.activity = 'Active';
        }
        break;
      default:
        break;
    }
    return res;
  } catch (exc) {
    Logger.log('error', `Error in DataFormationBasedOnDuration in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * This function is deprecated. Not in use
 * To catogorize the dates into days, weeks, months years between two given dates
 *
 * @function GetDateRange
 * @param {object} data
 * @returns {Array} - array of dates and date category
 * @author dev-team
 */

// eslint-disable-next-line no-unused-vars
const GetDateRangeOld = (startDate, endDate) => {
  let startDt = moment(startDate);
  const endDt = moment(endDate);
  const dateDiffInDays = Math.ceil(moment.duration(endDt.diff(startDt)).asDays());
  const dateRangeData = {
    category: '',
    dates: []
  };
  let nextDate = startDt;
  let start;
  let end;

  switch (true) {
    case dateDiffInDays > 0 && dateDiffInDays <= 31:
      dateRangeData.category = 'DAYS';
      break;
    case dateDiffInDays > 31 && dateDiffInDays <= 170:
      dateRangeData.category = 'WEEK';
      break;
    case dateDiffInDays > 170 && dateDiffInDays <= 600:
      dateRangeData.category = 'MONTH';
      break;
    case dateDiffInDays > 600:
      dateRangeData.category = 'YEAR';
      break;
    default:
  }

  while (nextDate <= endDt || end <= endDt) {
    start = nextDate.clone().startOf(DATE_CATEGORY[dateRangeData.category]);
    end = nextDate.clone().endOf(DATE_CATEGORY[dateRangeData.category]);

    if (moment(start).isBefore(moment(startDate))) start = startDate;
    if (moment(end).isAfter(moment(endDate))) end = endDate;

    dateRangeData.dates.push({
      startDate: moment(start)
        .utc()
        .format(DATES_FROMAT.UTC),
      endDate: moment(end)
        .utc()
        .format(DATES_FROMAT.UTC)
    });

    nextDate = moment(startDt).add(1, DATE_CATEGORY[dateRangeData.category]);
    startDt = nextDate;
  }

  return dateRangeData;
};

/**
 * Graph data based on duration
 *
 * @function GraphDataSplitUpByDuration
 * @param {object} data
 * @param {object} opts
 * @param {string} api
 * @returns {object} - returns graph data based on duration
 * @author dev-team
 */
const GraphDataSplitUpByDuration = async (data, opts, api = '', workflow) => {
  try {
    const { category, dates } = GetDateRange(opts.since, opts.until);
    const response = [];
    for (const date of dates) {
      const graphData = await DataFormationBasedOnDuration({ data, startDate: date.startDate, endDate: date.endDate, api, category, workflow });
      response.push(graphData);
    }
    return { category, response };
  } catch (exc) {
    Logger.log('error', `Error in GraphDataSplitUpByDuration in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

const DateMaking = async (date, format) => {
  const newDate = moment(new Date(date + format))
    .add(-1, 'day')
    .utc()
    .format('YYYY-MM-DDTHH:mm:ss[Z]');
  return newDate;
};

const DefaultDataMaker = async (opts, data, finalData) => {
  data.forEach(async element => {
    let formattedDate = new Date(element);
    const format = opts.since.substr(10);
    const returnDate = moment(new Date(element + format))
      .add(-1, 'day')
      .utc()
      .format('YYYY-MM-DDTHH:mm:ss[Z]');
    formattedDate = returnDate;
    if (finalData.findIndex(x => x.date === formattedDate) === -1) finalData.push({ avg_time: 0, date: formattedDate });
  });
  return finalData;
};

const DateDiff = async (startDate, endDate, api) => {
  const listDate = [];
  const dateMove = new Date(startDate);
  let strDate = startDate;

  while (strDate < endDate) {
    strDate = dateMove.toISOString().slice(0, 10);
    listDate.push(strDate);
    dateMove.setDate(dateMove.getDate() + 1);
  }
  if (api === 'cards') listDate.pop(listDate.length - 1);
  return listDate;
};

const DataMakerForElseCase = (dateRange, finalData, newFinalArray) => {
  dateRange.dates.forEach(async range => {
    const filteredArray = finalData.filter(dataset => range.startDate <= dataset.date && dataset.date <= range.endDate).map(x => x.avg_time);
    let newAvgTime = filteredArray.reduce((a, b) => a + b) / filteredArray.length || 0;
    newAvgTime = +newAvgTime.toFixed(2);
    newFinalArray.push({
      startDate: range.startDate,
      endDate: range.endDate,
      avg_time: newAvgTime
    });
  });
  return newFinalArray;
};

const SplitDataRangeWise = async (data, type) => {
  switch (true) {
    case type.toUpperCase() === 'MONTH':
      data.forEach(item => {
        const monthIndex = new Date(item.startDate).getMonth();
        const year = new Date(item.startDate).getFullYear();
        item.date = `${MONTHS[monthIndex].toUpperCase().substring(0, 3)} - ${year}`;
        delete item.startDate;
        delete item.endDate;
      });
      return data;
    case type.toUpperCase() === 'WEEK':
      data.forEach(item => {
        item.startDate = item.startDate;
        item.endDate = item.endDate;
      });
      return data;
    case type.toUpperCase() === 'DAYS':
      data.forEach(item => {
        item.date = item.startDate;
        delete item.startDate;
        delete item.endDate;
      });
      return data;
    case type.toUpperCase() === 'YEAR':
      data.forEach(item => {
        const year = new Date(item.startDate).getFullYear();
        item.date = String(year);
        delete item.startDate;
        delete item.endDate;
      });
      return data;

    default:
      return data;
  }
};

const SortAndSet = async (data, type) => {
  const array = new Set(
    data.sort((a, b) => {
      if (a.startDate) {
        return new Date(a.startDate) - new Date(b.startDate);
      }
      return new Date(a.date) - new Date(b.date);
    })
  );
  return SplitDataRangeWise(array, type.toUpperCase());
};

const CountAndSet = async (data, keys) => {
  const returnData = {};
  keys.forEach(key => {
    returnData[key] = data.filter(item => item.status === key).length;
  });
  return returnData;
};

const GetDataBasisOfDates = async ({ category, data, status, date }) => {
  const times = [];
  let avg_time = 0;
  let sum = 0;
  data.forEach(async item => {
    const inProgressData = item.transitions.filter(element => element.toString === status && date.startDate <= element.date && element.date <= date.endDate)[0];
    if (inProgressData) {
      const inProgressDate = inProgressData.date;
      const doneDate = item.closed_at;
      let timeDifferenceInHours = GetTimeDifference(doneDate, inProgressDate, 'hours');
      timeDifferenceInHours = timeDifferenceInHours > 0 ? timeDifferenceInHours : 0;
      times.push(timeDifferenceInHours);
    }
  });
  sum += times.reduce((a, b) => a + b, 0);
  avg_time = sum / times.length || 0;
  avg_time = +avg_time.toFixed(2);
  const finalOutcome = await SplitDataRangeWise([{ avg_time, startDate: date.startDate, endDate: date.endDate }], category);
  return finalOutcome[0];
};

const GetAvgClosedIssueDataDateBased = async (opts, data, totalIssuesCount, leadTimeSum, finalData, workflowStatus) => {
  const dateWiseData = data;
  totalIssuesCount += dateWiseData.length;
  const times = [];
  let avg_time = 0;
  let sum = 0;
  let dateValue = '';
  dateWiseData.forEach(async item => {
    const inProgressData = item.transitions.filter(
      element => element.toString === workflowStatus && opts.since <= element.date && element.date <= opts.until
    )[0];
    if (inProgressData) {
      const inProgressDate = inProgressData.date;
      const doneDate = item.closed_at;
      let timeDifferenceInHours = GetTimeDifference(doneDate, inProgressDate, 'hours');
      timeDifferenceInHours = timeDifferenceInHours > 0 ? timeDifferenceInHours : 0;
      leadTimeSum += GetTimeDifference(item.closed_at, item.created_at, 'hours');
      times.push(timeDifferenceInHours);
      const matchedValue = opts.since.substr(10);
      dateValue = moment(new Date(item.closed_at.substr(0, 10) + matchedValue))
        .add(-1, 'day')
        .utc()
        .format('YYYY-MM-DDTHH:mm:ss[Z]');
    }
  });
  sum += times.reduce((a, b) => a + b, 0);
  avg_time = sum / times.length || 0;
  avg_time = +avg_time.toFixed(2);
  finalData.push({ avg_time, date: dateValue });

  return finalData;
};

const findIndexForTransitions = (data, type) => {
  return data.reduce((a, trans, i) => {
    if (trans.toString === type) a.push(i);
    return a;
  }, []);
};
const statusWiseDataSpit = async (data, type) => {
  try {
    let closedTime = 0;
    data.forEach(item => {
      let transitions = item.transitions;
      transitions = transitions.sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
      });
      const closedDataIndex = findIndexForTransitions(transitions, type);
      if (transitions.length > 1 && closedDataIndex.length > 0) {
        closedDataIndex.forEach(index => {
          const date1 = transitions[index].date;
          const date2 = transitions[index + 1] ? transitions[index + 1].date : date1;
          let timeDifferenceInHours = GetTimeDifference(date2, date1 || date2, 'hours');
          timeDifferenceInHours = timeDifferenceInHours > 0 ? timeDifferenceInHours : 0;
          closedTime += timeDifferenceInHours;
        });
      }
    });
    closedTime = +closedTime.toFixed(2);
    let avg = closedTime / data.length;
    if (closedTime === 0) avg = 0;
    return +avg.toFixed(2);
  } catch (exc) {
    throw exc;
  }
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
 * returns status code with Invalid Token response
 *
 * @function UnauthorisedToken
 * @returns {object} - object for Invalid Token response
 * @author dev-team
 */
const UnauthorisedToken = () => {
  return { status: 'Unauthorised', statusCode: '403', message: 'Authenticate header' };
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
  const today = `${
    moment()
      .toISOString()
      .split('.')[0]
  }Z`;
  return moment(expirationTime) > moment(today);
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
    return null;
  }
};
const dataFOrmationForClosedIssues = async ({ opts, data, date, status, category }) => {
  const dataResult = await GetDataBasisOfDates({ opts, data, status, category, date });
  return dataResult;
};

/**
 * ClosedIssues data based on duration
 *
 * @function ClosedIssueSplitUpByDuration
 * @param {object} data
 * @param {object} opts
 * @param {string} api
 * @returns {object} - returns graph data based on duration
 * @author dev-team
 */
const ClosedIssueSplitUpByDuration = async (data, opts, api = '', status) => {
  try {
    const { category, dates } = GetDateRange(opts.since, opts.until);
    const graphs = [];
    for (const date of dates) {
      const graphData = await dataFOrmationForClosedIssues({ opts, data, date, status, category, api });
      graphs.push(graphData);
    }
    return {
      graphs,
      category
    };
  } catch (exc) {
    Logger.log('error', `Error in GraphDataSplitUpByDuration in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Checks if the given year is leap year or not
 *
 * @function isLeapYear
 * @param {string} token
 * @returns {object}
 * @author dev-team
 */

const isLeapYear = year => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

/**
 * Divides date range into day wise
 *
 * @function getDayWiseData
 * @param {string} token
 * @returns {object}
 * @author dev-team
 */

const getDayWiseData = (since, until) => {
  let startDate = new Date(since);
  const endDate = new Date(until);
  const nextDate = startDate;
  let start;
  let end;
  let addTime = 0;
  const dates = [];

  while (nextDate <= endDate || end < endDate) {
    start = startDate;
    addTime = start.getTime() + 86399000;
    end = new Date(addTime);
    dates.push({
      startDate: `${start.toISOString().split('.')[0]}Z`,
      endDate: `${end.toISOString().split('.')[0]}Z`
    });
    nextDate.setDate(nextDate.getDate() + 1);
    startDate = nextDate;
  }

  return dates;
};

/**
 * Divides date range into week wise
 *
 * @function getWeekWiseData
 * @param {string} token
 * @returns {object}
 * @author dev-team
 */

const getWeekWiseData = (since, until) => {
  const dates = [];
  const startDate = new Date(since);
  let endDate = new Date(until);
  const dateOnly = new Date(endDate.toISOString().split('T')[0]);
  // First day is the day of the month - the day of the week
  const endOfWeek = dateOnly.getDate() - dateOnly.getDay() + 6;
  // Getting end date of the week for until date
  let addTime = endDate.getTime() + (endOfWeek - dateOnly.getDate()) * 24 * 60 * 60 * 1000;
  endDate = new Date(addTime);
  let nextDate = endDate;
  let start;
  let end;
  let subtractTime = 0;

  while (nextDate >= startDate) {
    end = endDate;
    // subracting 6 days and 23 hours, 59 minuts and 59 seconds t0 get week start date
    subtractTime = end.getTime() - (6 * 24 * 60 * 60 + 86399) * 1000;
    start = new Date(subtractTime);

    dates.push({
      startDate: `${start.toISOString().split('.')[0]}Z`,
      endDate: `${end.toISOString().split('.')[0]}Z`
    });

    addTime = nextDate.getTime() - 7 * 24 * 60 * 60 * 1000;
    nextDate = new Date(addTime);
    endDate = nextDate;
  }

  dates.sort((a, b) => (new Date(a.start) > new Date(b.start) ? 1 : -1));
  // changing week range first start date to since and week range last end date to until
  if (dates.length) {
    dates[0].start = since;
    dates[dates.length - 1].end = until;
  }
  return dates;
};

/**
 * Divides date range into month wise
 *
 * @function getMonthWiseData
 * @param {string} token
 * @returns {object}
 * @author dev-team
 */

const getMonthWiseData = (since, until) => {
  const dates = [];
  const startDate = new Date(since);
  let endDate = new Date(until);
  let dateOnly = new Date(endDate.toISOString().split('T')[0]);
  let noOfDaysInMonth = DAYS_IN_MONTH[dateOnly.getMonth()];
  if (isLeapYear(dateOnly.getFullYear()) && dateOnly.getMonth() === 1) noOfDaysInMonth += 1;
  const addDays = noOfDaysInMonth - dateOnly.getDate();
  let addTime = endDate.getTime() + addDays * 24 * 60 * 60 * 1000;
  endDate = new Date(addTime);
  let nextDate = endDate;
  let start;
  let end;
  let subtractTime = 0;

  while (nextDate >= startDate) {
    end = endDate;
    dateOnly = new Date(end.toISOString().split('T')[0]);
    noOfDaysInMonth = DAYS_IN_MONTH[dateOnly.getMonth()];
    if (isLeapYear(dateOnly.getFullYear()) && dateOnly.getMonth() === 1) noOfDaysInMonth += 1;
    subtractTime = end.getTime() - ((noOfDaysInMonth - 1) * 24 * 60 * 60 + 86399) * 1000;
    start = new Date(subtractTime);
    dates.push({
      startDate: `${start.toISOString().split('.')[0]}Z`,
      endDate: `${end.toISOString().split('.')[0]}Z`
    });

    addTime = nextDate.getTime() - noOfDaysInMonth * 24 * 60 * 60 * 1000;
    nextDate = new Date(addTime);
    endDate = nextDate;
  }

  dates.sort((a, b) => (new Date(a.start) > new Date(b.start) ? 1 : -1));
  dates[0].start = since;
  dates[dates.length - 1].end = until;

  return dates;
};

/**
 * Divides date range into year wise
 *
 * @function getYearWiseData
 * @param {string} token
 * @returns {object}
 * @author dev-team
 */

const getYearWiseData = (since, until) => {
  const dates = [];
  const startDate = new Date(since);
  let endDate = new Date(until);
  let dateOnly = new Date(endDate.toISOString().split('T')[0]);
  let totalDaysSpentInYear = DAYS_IN_MONTH.filter((_val, index) => index < dateOnly.getMonth()).reduce((a, b) => a + b, 0) + dateOnly.getDate();
  if (isLeapYear(dateOnly.getFullYear()) && dateOnly.getMonth() - 1 >= 1) totalDaysSpentInYear += 1;
  let daysInYear = isLeapYear(dateOnly.getFullYear()) ? 366 : 365;
  const addDays = daysInYear - totalDaysSpentInYear;
  let addTime = endDate.getTime() + addDays * 24 * 60 * 60 * 1000;
  endDate = new Date(addTime);

  let nextDate = endDate;
  let start;
  let end;
  let subtractTime = 0;

  while (nextDate >= startDate) {
    end = endDate;
    dateOnly = new Date(end.toISOString().split('T')[0]);
    daysInYear = isLeapYear(dateOnly.getFullYear()) ? 366 : 365;
    subtractTime = end.getTime() - ((daysInYear - 1) * 24 * 60 * 60 + 86399) * 1000;
    start = new Date(subtractTime);
    dates.push({
      startDate: `${start.toISOString().split('.')[0]}Z`,
      endDate: `${end.toISOString().split('.')[0]}Z`
    });

    addTime = nextDate.getTime() - daysInYear * 24 * 60 * 60 * 1000;
    nextDate = new Date(addTime);
    endDate = nextDate;
  }

  dates.sort((a, b) => (new Date(a.start) > new Date(b.start) ? 1 : -1));
  dates[0].start = since;
  dates[dates.length - 1].end = until;

  return dates;
};

/**
 * Divides date range into day/week/month/year wise
 *
 * @function GetDateRange
 * @param {string} since, until
 * @returns {object}
 * @author dev-team
 */

const GetDateRange = (since, until) => {
  const startDt = moment(since);
  const endDt = moment(until);
  const dateDiffInDays = Math.ceil(moment.duration(endDt.diff(startDt)).asDays());
  const dateRangeData = {
    category: '',
    dates: []
  };

  switch (true) {
    case dateDiffInDays > 0 && dateDiffInDays <= 31:
      dateRangeData.category = 'DAYS';
      dateRangeData.dates = getDayWiseData(since, until);
      break;
    case dateDiffInDays > 31 && dateDiffInDays <= 170:
      dateRangeData.category = 'WEEK';
      dateRangeData.dates = getWeekWiseData(since, until);
      break;
    case dateDiffInDays > 170 && dateDiffInDays <= 600:
      dateRangeData.category = 'MONTH';
      dateRangeData.dates = getMonthWiseData(since, until);
      break;
    case dateDiffInDays > 600:
      dateRangeData.category = 'YEAR';
      dateRangeData.dates = getYearWiseData(since, until);
      break;
    default:
  }
  return dateRangeData;
};

/**
 * Get days spent in sprint and total days in sprint
 *
 * @function GetDaysSpentInSprint
 * @param {object} opts
 * @returns {object}
 * @author dev-team
 */

const GetDaysSpentInSprint = (startDate, endDate) => {
  const dates = [];
  let newStartDate = moment(startDate).format('YYYY-MM-DD');
  const newEndDate = moment(endDate).format('YYYY-MM-DD');
  const currDate = moment().format('YYYY-MM-DD');

  while (newStartDate <= newEndDate) {
    if (['Saturday', 'Sunday'].indexOf(moment(newStartDate).format('dddd')) < 0) {
      dates.push(newStartDate);
    }
    newStartDate = moment(newStartDate)
      .add(1, 'days')
      .format('YYYY-MM-DD');
  }

  return { daysSpentInSprint: dates.indexOf(currDate) + 1, totalSprintDays: dates.length };
};

/**
 * Returns array of exact branches
 *
 * @function branchMatch
 * @param {object}
 * @returns {object}
 * @author dev-team
 */

const branchMatch = async (issue_keys, raw_branches) => {
  const branchNames = [];
  let branches = raw_branches.map(x => x.branches);
  branches = branches.filter(element => {
    return element !== undefined;
  });
  await issue_keys.forEach(async issue_key => {
    let branchName;
    for (let i = 0; i < branches.length; i += 1) {
      if (branches[i].includes(issue_key)) {
        const nextCharacter = branches[i].split(issue_key)[1][0];
        if (!nextCharacter || nextCharacter === ' ' || (nextCharacter && !Number.isFinite(nextCharacter))) {
          branchName = branches[i];
          break;
        }
      }
    }
    if (branchName) branchNames.push(branchName);
  });

  return branchNames;
};

module.exports = {
  SuccessResponse,
  ErrorResponse,
  GetDates,
  GraphDataSplitUpByDuration,
  GetTimeDifference,
  GetDateRange,
  DateMaking,
  GetDataBasisOfDates,
  GetAvgClosedIssueDataDateBased,
  DefaultDataMaker,
  DataMakerForElseCase,
  SortAndSet,
  DateDiff,
  CountAndSet,
  statusWiseDataSpit,
  DecryptToken,
  InvalidToken,
  UnauthorisedToken,
  TokenExpirationCheck,
  InvalidResponse,
  InvalidUser,
  ClosedIssueSplitUpByDuration,
  currentDate,
  GetDaysSpentInSprint,
  branchMatch
};
