// month_grid_view.js
// 慢慢的倉庫｜Calendar｜Month Grid View 1.0.0
// 通用單月格狀 DOM renderer。
// 不計算農曆／節氣／節日，不要求 Calendar 模組存在；宿主提供 month data 與 cell renderer。
(function (global) {
  "use strict";

  const VERSION = "1.0.0";
  const DEFAULT_WEEKDAYS = Object.freeze(["日", "一", "二", "三", "四", "五", "六"]);

  function resolveRoot(root) {
    const element = typeof root === "string"
      ? document.querySelector(root)
      : root;

    if (!element || typeof element.appendChild !== "function") {
      throw new TypeError("root must be a DOM element or selector.");
    }

    return element;
  }

  function requireInteger(value, name) {
    const number = Number(value);
    if (!Number.isInteger(number)) {
      throw new TypeError(name + " must be an integer.");
    }
    return number;
  }

  function validateMonthData(monthData) {
    if (!monthData || typeof monthData !== "object") {
      throw new TypeError("monthData must be an object.");
    }

    const year = requireInteger(monthData.year, "monthData.year");
    const month = requireInteger(monthData.month, "monthData.month");
    const firstWeekday = requireInteger(monthData.firstWeekday, "monthData.firstWeekday");

    if (month < 1 || month > 12) {
      throw new RangeError("monthData.month must be 1-12.");
    }

    if (firstWeekday < 0 || firstWeekday > 6) {
      throw new RangeError("monthData.firstWeekday must be 0-6.");
    }

    if (!Array.isArray(monthData.days)) {
      throw new TypeError("monthData.days must be an array.");
    }

    return {
      year,
      month,
      firstWeekday,
      days: monthData.days
    };
  }

  function getDayNumber(item, index, getter) {
    if (typeof getter === "function") {
      return getter(item, index);
    }

    if (typeof item === "number") {
      return item;
    }

    if (item && typeof item === "object" && Number.isInteger(Number(item.day))) {
      return Number(item.day);
    }

    return index + 1;
  }

  function makeCell(className) {
    const element = document.createElement("div");
    element.className = className;
    return element;
  }

  function render(root, monthData, options = {}) {
    const mount = resolveRoot(root);
    const data = validateMonthData(monthData);

    const weekStart = options.weekStart === 1 ? 1 : 0;
    const weekdayLabels = Array.isArray(options.weekdayLabels) && options.weekdayLabels.length === 7
      ? options.weekdayLabels.slice()
      : DEFAULT_WEEKDAYS.slice();

    const titleFormatter = typeof options.titleFormatter === "function"
      ? options.titleFormatter
      : function (value) {
          return value.year + " 年 " + value.month + " 月";
        };

    const renderDay = typeof options.renderDay === "function"
      ? options.renderDay
      : function (cell, item, context) {
          cell.textContent = String(context.day);
        };

    const dayClass = typeof options.dayClass === "function"
      ? options.dayClass
      : null;

    const fillTrailing = options.fillTrailing !== false;

    const section = document.createElement("section");
    section.className = "slowly-month-grid";

    const title = document.createElement("div");
    title.className = "slowly-month-grid__title";
    title.textContent = String(titleFormatter(data));
    section.appendChild(title);

    const weekdays = document.createElement("div");
    weekdays.className = "slowly-month-grid__weekdays";

    for (let column = 0; column < 7; column += 1) {
      const weekday = (weekStart + column) % 7;
      const cell = makeCell("slowly-month-grid__weekday");
      cell.dataset.weekday = String(weekday);
      cell.textContent = weekdayLabels[weekday];
      weekdays.appendChild(cell);
    }

    section.appendChild(weekdays);

    const days = document.createElement("div");
    days.className = "slowly-month-grid__days";

    const leading = (data.firstWeekday - weekStart + 7) % 7;
    const cells = [];

    for (let index = 0; index < leading; index += 1) {
      const empty = makeCell("slowly-month-grid__day is-empty");
      empty.setAttribute("aria-hidden", "true");
      days.appendChild(empty);
    }

    data.days.forEach(function (item, index) {
      const day = getDayNumber(item, index, options.getDayNumber);
      const weekday = (data.firstWeekday + index) % 7;
      const cell = makeCell("slowly-month-grid__day");

      cell.dataset.day = String(day);
      cell.dataset.weekday = String(weekday);

      if (weekday === 0) cell.classList.add("is-sunday");
      if (weekday === 6) cell.classList.add("is-saturday");

      if (dayClass) {
        const extra = dayClass(item, {
          year: data.year,
          month: data.month,
          day,
          weekday,
          index
        });

        if (typeof extra === "string" && extra.trim()) {
          extra.trim().split(/\s+/).forEach(function (name) {
            cell.classList.add(name);
          });
        } else if (Array.isArray(extra)) {
          extra.filter(Boolean).forEach(function (name) {
            cell.classList.add(String(name));
          });
        }
      }

      renderDay(cell, item, {
        year: data.year,
        month: data.month,
        day,
        weekday,
        index
      });

      cells.push(cell);
      days.appendChild(cell);
    });

    if (fillTrailing) {
      const used = leading + data.days.length;
      const trailing = (7 - (used % 7)) % 7;

      for (let index = 0; index < trailing; index += 1) {
        const empty = makeCell("slowly-month-grid__day is-empty");
        empty.setAttribute("aria-hidden", "true");
        days.appendChild(empty);
      }
    }

    section.appendChild(days);
    mount.appendChild(section);

    return Object.freeze({
      version: VERSION,
      element: section,
      title,
      weekdays,
      days,
      cells: Object.freeze(cells.slice()),
      destroy: function () {
        section.remove();
      }
    });
  }

  global.CalendarMonthGridView = Object.freeze({
    version: VERSION,
    render
  });

})(typeof window !== "undefined" ? window : globalThis);
