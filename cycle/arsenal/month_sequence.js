// month_sequence.js
// 慢慢的倉庫｜Calendar｜Month Sequence 1.0.0
// 通用年月位移與連續月份序列。
// 不產生日期內容、不處理農曆／節氣／節日、不碰 DOM。
(function (global) {
  "use strict";

  const VERSION = "1.0.0";

  function requireInteger(value, name) {
    const number = Number(value);
    if (!Number.isInteger(number)) {
      throw new TypeError(name + " must be an integer.");
    }
    return number;
  }

  function normalizeMonth(year, month) {
    const y = requireInteger(year, "year");
    const m = requireInteger(month, "month");

    const absolute = y * 12 + (m - 1);
    const normalizedYear = Math.floor(absolute / 12);
    const normalizedMonth = ((absolute % 12) + 12) % 12 + 1;

    return Object.freeze({
      year: normalizedYear,
      month: normalizedMonth
    });
  }

  function shift(year, month, delta) {
    const base = normalizeMonth(year, month);
    const amount = requireInteger(delta, "delta");

    return normalizeMonth(
      base.year,
      base.month + amount
    );
  }

  function range(year, month, count) {
    const total = requireInteger(count, "count");
    if (total < 0) {
      throw new RangeError("count must be >= 0.");
    }

    const start = normalizeMonth(year, month);
    const result = [];

    for (let index = 0; index < total; index += 1) {
      result.push(shift(start.year, start.month, index));
    }

    return Object.freeze(result);
  }

  global.CalendarMonthSequence = Object.freeze({
    version: VERSION,
    normalize: normalizeMonth,
    shift,
    range
  });

})(typeof window !== "undefined" ? window : globalThis);
