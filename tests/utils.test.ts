import { isHourMark } from '../src/utils/utils';

describe('isHourMark', () => {
  it('returns true for valid hour mark (UTC)', () => {
    expect(isHourMark('2025-09-09T10:00:00.000Z')).toBe(true);
    expect(isHourMark('2025-09-09T23:00:00.000Z')).toBe(true);
  });

  it('returns false for non-hour mark (UTC)', () => {
    expect(isHourMark('2025-09-09T10:30:00.000Z')).toBe(false);
    expect(isHourMark('2025-09-09T10:00:01.000Z')).toBe(false);
    expect(isHourMark('2025-09-09T10:00:00.001Z')).toBe(false);
    expect(isHourMark('2025-09-09T10:15:00.000Z')).toBe(false);
  });

  it('returns false for invalid date string', () => {
    expect(isHourMark('invalid-date')).toBe(false);
    expect(isHourMark('')).toBe(false);
  });
});
