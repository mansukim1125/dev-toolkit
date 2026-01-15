'use strict';

class CronParserTool {
  static parse() {
    const input = document.getElementById('cron-input').value.trim();
    const errorEl = document.getElementById('cron-error');
    const descriptionEl = document.getElementById('cron-description');
    const scheduleEl = document.getElementById('cron-schedule');

    errorEl.textContent = '';
    descriptionEl.textContent = '';
    scheduleEl.innerHTML = '';

    if (!input) {
      errorEl.textContent = 'Please enter a cron expression';
      return;
    }

    try {
      const cron = new Cron(input);
      const description = CronParserTool.generateDescription(input);
      descriptionEl.textContent = description;

      const nextRuns = cron.nextRuns(5);
      nextRuns.forEach(date => {
        const li = document.createElement('li');
        li.textContent = date.toLocaleString();
        scheduleEl.appendChild(li);
      });
    } catch (error) {
      errorEl.textContent = 'Invalid cron expression: ' + error.message;
    }
  }

  static generateDescription(expression) {
    const aliases = {
      '@yearly': 'At 00:00 on January 1st',
      '@annually': 'At 00:00 on January 1st',
      '@monthly': 'At 00:00 on the 1st of every month',
      '@weekly': 'At 00:00 on Sunday',
      '@daily': 'At 00:00 every day',
      '@midnight': 'At 00:00 every day',
      '@hourly': 'At minute 0 of every hour'
    };

    if (aliases[expression.toLowerCase()]) {
      return aliases[expression.toLowerCase()];
    }

    const parts = expression.split(/\s+/);
    const isExtended = parts.length === 6;

    let second, minute, hour, day, month, weekday;

    if (isExtended) {
      [second, minute, hour, day, month, weekday] = parts;
    } else {
      [minute, hour, day, month, weekday] = parts;
      second = null;
    }

    const descriptions = [];

    if (second !== null) {
      descriptions.push(CronParserTool.describeField(second, 'second'));
    }
    descriptions.push(CronParserTool.describeField(minute, 'minute'));
    descriptions.push(CronParserTool.describeField(hour, 'hour'));
    descriptions.push(CronParserTool.describeField(day, 'day'));
    descriptions.push(CronParserTool.describeField(month, 'month'));
    descriptions.push(CronParserTool.describeField(weekday, 'weekday'));

    return descriptions.filter(d => d).join(', ');
  }

  static describeField(value, field) {
    if (value === '*') {
      return `every ${field}`;
    }

    if (value.includes('/')) {
      const [, step] = value.split('/');
      return `every ${step} ${field}(s)`;
    }

    if (value.includes('-')) {
      const [start, end] = value.split('-');
      if (field === 'weekday') {
        return `${CronParserTool.weekdayName(start)} through ${CronParserTool.weekdayName(end)}`;
      }
      return `${field} ${start} through ${end}`;
    }

    if (value.includes(',')) {
      const values = value.split(',');
      if (field === 'weekday') {
        return values.map(v => CronParserTool.weekdayName(v)).join(', ');
      }
      return `${field} ${values.join(', ')}`;
    }

    if (field === 'weekday') {
      return `on ${CronParserTool.weekdayName(value)}`;
    }

    if (field === 'month') {
      return `in ${CronParserTool.monthName(value)}`;
    }

    return `at ${field} ${value}`;
  }

  static weekdayName(num) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[parseInt(num)] || num;
  }

  static monthName(num) {
    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return months[parseInt(num)] || num;
  }

  static clear() {
    document.getElementById('cron-input').value = '';
    document.getElementById('cron-error').textContent = '';
    document.getElementById('cron-description').textContent = '';
    document.getElementById('cron-schedule').innerHTML = '';
  }

  static copy() {
    const description = document.getElementById('cron-description').textContent;
    const scheduleItems = document.getElementById('cron-schedule').querySelectorAll('li');
    const schedule = Array.from(scheduleItems).map(li => li.textContent).join('\n');

    const text = `Description: ${description}\n\nNext 5 Executions:\n${schedule}`;

    navigator.clipboard.writeText(text).then(() => {
      const errorEl = document.getElementById('cron-error');
      errorEl.style.color = 'green';
      errorEl.textContent = 'Copied to clipboard!';
      setTimeout(() => {
        errorEl.textContent = '';
        errorEl.style.color = '';
      }, 2000);
    });
  }
}
