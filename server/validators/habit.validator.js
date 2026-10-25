import { isValidDate } from '../services/dateUtils.js';

export const sanitizeString = (value) =>
  typeof value === 'string' ? value.trim() : '';

/**
 * Validate and sanitize habit input data.
 * @param {object} data     Raw request body
 * @param {object} options  { partial: true } for PATCH-style updates
 * @returns {{ valid: boolean, errors: string[], data: object }}
 */
export const validateHabitInput = (data, { partial = false } = {}) => {
  const errors = [];
  const output = {};

  const requireField = (field) =>
    !partial || Object.prototype.hasOwnProperty.call(data, field);

  if (requireField('name')) {
    const name = sanitizeString(data.name);
    if (!name) errors.push('Name is required.');
    output.name = name;
  }

  if (requireField('category')) {
    const category = sanitizeString(data.category);
    if (!category) errors.push('Category is required.');
    output.category = category;
  }

  if (requireField('type')) {
    if (!['good', 'bad'].includes(data.type))
      errors.push('Type must be good or bad.');
    output.type = data.type;
  }

  if (requireField('description')) {
    output.description = sanitizeString(data.description);
  }

  if (requireField('frequency')) {
    if (!['daily', 'weekly', 'custom'].includes(data.frequency))
      errors.push('Frequency is invalid.');
    output.frequency = data.frequency;
  }

  if (requireField('customDays')) {
    const customDays = Array.isArray(data.customDays) ? data.customDays : [];
    if (
      !customDays.every(
        (day) => Number.isInteger(day) && day >= 0 && day <= 6
      )
    ) {
      errors.push('Custom days must be weekday numbers from 0 to 6.');
    }
    output.customDays = [...new Set(customDays)];
  }

  if (requireField('startDate')) {
    if (!isValidDate(data.startDate))
      errors.push('Start date must be YYYY-MM-DD.');
    output.startDate = data.startDate;
  }

  return { valid: errors.length === 0, errors, data: output };
};
