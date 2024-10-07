
function startDateTimeHourly(dateISOString) {

  let startDateTime;

  if (dateISOString) {
    startDateTime = new Date(dateISOString);
  }
  else {
    startDateTime = new Date();
  }

  startDateTime.setHours(startDateTime.getHours());
  startDateTime.setMinutes(0);
  startDateTime.setSeconds(0);
  startDateTime.setMilliseconds(0);

  return startDateTime;
}

function endDateTimeHourly(dateISOString) {

  let endDateTime;

  if (dateISOString) {
    endDateTime = new Date(dateISOString);
  }
  else {
    endDateTime = new Date();
  }

  endDateTime.setHours(endDateTime.getHours() + 1);
  endDateTime.setMinutes(0);
  endDateTime.setSeconds(0);
  endDateTime.setMilliseconds(0);

  return endDateTime;
}

function startDateTimeDaily(dateISOString) {

  let startDateTime;

  if (dateISOString) {
    startDateTime = new Date(dateISOString);
  }
  else {
    startDateTime = new Date();
  }

  startDateTime.setDate(startDateTime.getDate());
  startDateTime.setHours(0);
  startDateTime.setMinutes(0);
  startDateTime.setSeconds(0);
  startDateTime.setMilliseconds(0);

  return startDateTime;
}

function endDateTimeDaily(dateISOString) {

  let endDateTime;

  if (dateISOString) {
    endDateTime = new Date(dateISOString);
  }
  else {
    endDateTime = new Date();
  }

  endDateTime.setDate(endDateTime.getDate() + 1);
  endDateTime.setHours(0);
  endDateTime.setMinutes(0);
  endDateTime.setSeconds(0);
  endDateTime.setMilliseconds(0);

  return endDateTime;
}

function startDateTimeWeekly(dateISOString) {

  let currentDate;

  if (dateISOString) {
    currentDate = new Date(dateISOString);
  }
  else {
    currentDate = new Date();
  }

  let startDateTime;

  //Sunday
  if (currentDate.getDay() === 0) {
    startDateTime = new Date(currentDate.setDate(currentDate.getDate() - 6));
  }
  //Other day
  else {
    startDateTime = new Date(currentDate.setDate(currentDate.getDate() - (currentDate.getDay() - 1)));
  }

  startDateTime.setHours(0);
  startDateTime.setMinutes(0);
  startDateTime.setSeconds(0);
  startDateTime.setMilliseconds(0);

  return startDateTime;
}

function endDateTimeWeekly(dateISOString) {

  let currentDate;

  if (dateISOString) {
    currentDate = new Date(dateISOString);
  }
  else {
    currentDate = new Date();
  }

  let endDateTime = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 8));
  endDateTime.setHours(0);
  endDateTime.setMinutes(0);
  endDateTime.setSeconds(0);
  endDateTime.setMilliseconds(0);

  return endDateTime;
}

function startDateTimeMonthly(dateISOString) {

  let currentDate;

  if (dateISOString) {
    currentDate = new Date(dateISOString);
  }
  else {
    currentDate = new Date();
  }

  let startDateTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  startDateTime.setHours(0);
  startDateTime.setMinutes(0);
  startDateTime.setSeconds(0);
  startDateTime.setMilliseconds(0);

  return startDateTime;
}

function endDateTimeMonthly(dateISOString) {

  let currentDate;

  if (dateISOString) {
    currentDate = new Date(dateISOString);
  }
  else {
    currentDate = new Date();
  }

  let endDateTime = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  endDateTime.setHours(0);
  endDateTime.setMinutes(0);
  endDateTime.setSeconds(0);
  endDateTime.setMilliseconds(0);

  return endDateTime;
}

function startDateTimeYearly(dateISOString) {

  let currentDate;

  if (dateISOString) {
    currentDate = new Date(dateISOString);
  }
  else {
    currentDate = new Date();
  }

  let startDateTime = new Date(currentDate.getFullYear(), 0, 1);
  startDateTime.setHours(0);
  startDateTime.setMinutes(0);
  startDateTime.setSeconds(0);
  startDateTime.setMilliseconds(0);

  return startDateTime;
}

function endDateTimeYearly(dateISOString) {

  let currentDate;

  if (dateISOString) {
    currentDate = new Date(dateISOString);
  }
  else {
    currentDate = new Date();
  }

  let endDateTime = new Date(currentDate.getFullYear() + 1, 0, 1);
  endDateTime.setHours(0);
  endDateTime.setMinutes(0);
  endDateTime.setSeconds(0);
  endDateTime.setMilliseconds(0);

  return endDateTime;
}

module.exports = {
  startDateTimeHourly, endDateTimeHourly, startDateTimeDaily, endDateTimeDaily, startDateTimeWeekly, endDateTimeWeekly,
  startDateTimeMonthly, endDateTimeMonthly, startDateTimeYearly, endDateTimeYearly
};