'use strict';

class TimezoneTool {
  static convert() {
    try {
      document.getElementById('error').textContent = '';
      const datetimeInput = document.getElementById('datetime-input').value;
      if (!datetimeInput) {
        document.getElementById('error').textContent = 'Please enter a date and time';
        return;
      }

      const sourceTz = document.getElementById('source-tz').value;
      const targetTz = document.getElementById('target-tz').value;

      // Parse input as source timezone
      const sourceDate = TimezoneTool.parseInTimezone(datetimeInput, sourceTz);

      // Format in target timezone
      const options = {
        timeZone: targetTz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZoneName: 'short'
      };

      const formatter = new Intl.DateTimeFormat('en-US', options);
      const parts = formatter.formatToParts(sourceDate);

      const getPart = (type) => parts.find(p => p.type === type)?.value || '';

      const result = `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}:${getPart('second')} ${getPart('timeZoneName')}`;

      document.getElementById('output').value = result;
    } catch (e) {
      document.getElementById('error').textContent = 'Conversion failed: ' + e.message;
    }
  }

  static parseInTimezone(datetimeStr, timezone) {
    // Create a date object treating the input as if it were in the source timezone
    const [datePart, timePart] = datetimeStr.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute, second = 0] = timePart.split(':').map(Number);

    // Create a formatter for the source timezone to find the offset
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    // Find the UTC time that corresponds to the given local time in the source timezone
    // Use binary search to find the correct offset
    let testDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

    for (let i = 0; i < 4; i++) {
      const parts = formatter.formatToParts(testDate);
      const getPart = (type) => parseInt(parts.find(p => p.type === type)?.value || '0', 10);

      const localYear = getPart('year');
      const localMonth = getPart('month');
      const localDay = getPart('day');
      const localHour = getPart('hour');
      const localMinute = getPart('minute');
      const localSecond = getPart('second');

      const diffMs = new Date(year, month - 1, day, hour, minute, second).getTime() -
                     new Date(localYear, localMonth - 1, localDay, localHour, localMinute, localSecond).getTime();

      if (diffMs === 0) break;
      testDate = new Date(testDate.getTime() + diffMs);
    }

    return testDate;
  }

  static setNow() {
    const now = new Date();
    const sourceTz = document.getElementById('source-tz').value;

    // Format current time in source timezone for the input
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: sourceTz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const formatted = formatter.format(now).replace(' ', 'T');
    document.getElementById('datetime-input').value = formatted;
  }

  static swap() {
    const sourceTz = document.getElementById('source-tz');
    const targetTz = document.getElementById('target-tz');
    const temp = sourceTz.value;
    sourceTz.value = targetTz.value;
    targetTz.value = temp;
  }

  static clear() {
    document.getElementById('datetime-input').value = '';
    document.getElementById('output').value = '';
    document.getElementById('error').textContent = '';
  }

  static copy() {
    navigator.clipboard.writeText(document.getElementById('output').value);
  }
}
