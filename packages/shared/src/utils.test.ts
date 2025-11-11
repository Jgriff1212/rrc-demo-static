import {
  formatPeriodKey,
  calculateProgress,
  formatDuration,
  truncate,
  isToday,
} from './utils';

describe('utils', () => {
  describe('formatPeriodKey', () => {
    it('should format day period key', () => {
      const date = new Date('2024-01-15');
      expect(formatPeriodKey(date, 'day')).toBe('2024-01-15');
    });

    it('should format month period key', () => {
      const date = new Date('2024-01-15');
      expect(formatPeriodKey(date, 'month')).toBe('2024-01');
    });
  });

  describe('calculateProgress', () => {
    it('should calculate progress correctly', () => {
      expect(calculateProgress(5, 10)).toBe(0.5);
      expect(calculateProgress(10, 10)).toBe(1);
      expect(calculateProgress(0, 10)).toBe(0);
    });

    it('should return 0 for zero total', () => {
      expect(calculateProgress(0, 0)).toBe(0);
    });

    it('should clamp values between 0 and 1', () => {
      expect(calculateProgress(15, 10)).toBe(1);
      expect(calculateProgress(-5, 10)).toBe(0);
    });
  });

  describe('formatDuration', () => {
    it('should format minutes', () => {
      expect(formatDuration(45)).toBe('45m');
    });

    it('should format hours', () => {
      expect(formatDuration(60)).toBe('1h');
      expect(formatDuration(120)).toBe('2h');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(90)).toBe('1h 30m');
      expect(formatDuration(125)).toBe('2h 5m');
    });
  });

  describe('truncate', () => {
    it('should not truncate short text', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });

    it('should truncate long text', () => {
      expect(truncate('Hello World', 8)).toBe('Hello...');
    });

    it('should handle exact length', () => {
      expect(truncate('Hello', 5)).toBe('Hello');
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      const today = new Date();
      expect(isToday(today)).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });
  });
});
