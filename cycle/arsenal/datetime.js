(function(global){
  "use strict";

  const MS_PER_DAY = 86400000;

  function pad2(value){
    return String(value).padStart(2, "0");
  }

  function isValidDate(date){
    return date instanceof Date && !Number.isNaN(date.getTime());
  }

  function dateKey(date = new Date()){
    if(!isValidDate(date)) return "";

    const year = date.getFullYear();
    const month = pad2(date.getMonth() + 1);
    const day = pad2(date.getDate());

    return `${year}-${month}-${day}`;
  }

  function parseDateKey(key){
    if(typeof key !== "string") return null;

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key.trim());
    if(!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const date = new Date(year, month - 1, day);

    if(
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ){
      return null;
    }

    return date;
  }

  function toDateKey(value){
    if(value instanceof Date){
      return dateKey(value);
    }

    if(typeof value === "string"){
      const parsed = parseDateKey(value);
      return parsed ? dateKey(parsed) : "";
    }

    return "";
  }

  function addDays(value, days){
    const key = toDateKey(value);
    const amount = Number(days);

    if(!key || !Number.isFinite(amount)) return "";

    const date = parseDateKey(key);
    date.setDate(date.getDate() + amount);

    return dateKey(date);
  }

  function toUtcDayNumber(key){
    const date = parseDateKey(key);
    if(!date) return null;

    return Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ) / MS_PER_DAY;
  }

  function diffDays(from, to){
    const fromKey = toDateKey(from);
    const toKey = toDateKey(to);

    if(!fromKey || !toKey) return null;

    return toUtcDayNumber(toKey) - toUtcDayNumber(fromKey);
  }

  function formatDate(value){
    const key = toDateKey(value);
    return key ? key.replaceAll("-", "/") : "";
  }

  function formatMMDD(value){
    const key = toDateKey(value);
    if(!key) return "";

    const [, month, day] = key.split("-");
    return `${month}/${day}`;
  }

  function normalizeDateTimeInput(value){
    if(value instanceof Date){
      return isValidDate(value) ? value : null;
    }

    if(typeof value === "number"){
      const date = new Date(value);
      return isValidDate(date) ? date : null;
    }

    if(typeof value === "string"){
      const dateOnly = parseDateKey(value);
      if(dateOnly) return dateOnly;

      const date = new Date(value);
      return isValidDate(date) ? date : null;
    }

    return null;
  }

  function formatDateTime(value = new Date()){
    const date = normalizeDateTimeInput(value);
    if(!date) return "";

    const year = date.getFullYear();
    const month = pad2(date.getMonth() + 1);
    const day = pad2(date.getDate());
    const hour = pad2(date.getHours());
    const minute = pad2(date.getMinutes());

    return `${year}-${month}-${day} ${hour}:${minute}`;
  }

  function diffParts(from, to = new Date()){
    const start = normalizeDateTimeInput(from);
    const end = normalizeDateTimeInput(to);

    if(!start || !end) return null;

    const diff = end.getTime() - start.getTime();
    const sign = diff < 0 ? -1 : 1;
    let remaining = Math.abs(diff);

    const days = Math.floor(remaining / MS_PER_DAY);
    remaining -= days * MS_PER_DAY;

    const hours = Math.floor(remaining / 3600000);
    remaining -= hours * 3600000;

    const minutes = Math.floor(remaining / 60000);

    return {
      sign,
      days,
      hours,
      minutes,
      totalMilliseconds: diff
    };
  }

  global.DateTime = {
    dateKey,
    parseDateKey,
    addDays,
    diffDays,
    formatDate,
    formatMMDD,
    formatDateTime,
    diffParts
  };

})(typeof window !== "undefined" ? window : globalThis);
