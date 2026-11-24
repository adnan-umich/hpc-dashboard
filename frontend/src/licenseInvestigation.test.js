import { exactReservations } from './reservationAnalytics';
const start = Date.parse('2026-10-01T00:00:00Z');
test('counts exact concurrent units at every start/end event without averaging', () => {
  const result = exactReservations([
    { user: 'a', start: start - 3600000, end: start + 1800000, units: 100 },
    { user: 'a', start: start + 900000, end: start + 4500000, units: 40 },
    { user: 'b', start, end: start + 7200000, units: 10 },
  ], start, start + 7200000);
  expect(result.users).toEqual(['a', 'b']);
  expect(result.points.map(point => point.values)).toEqual([[100, 10], [140, 10], [40, 10], [0, 10], [0, 10]]);
  expect(result.points.map(point => point.total)).toEqual([110, 150, 50, 10, 10]);
});
test('applies simultaneous ends and starts together and excludes boundary-touching jobs', () => {
  const result = exactReservations([
    { user: 'a', start: start - 3600000, end: start, units: 100 },
    { user: 'a', start, end: start + 60000, units: 20 },
    { user: 'a', start: start + 60000, end: start + 120000, units: 30 },
    { user: 'a', start: start + 180000, end: start + 240000, units: 100 },
  ], start, start + 180000);
  expect(result.points.map(point => point.total)).toEqual([20, 30, 0, 0]);
});
test('preserves short spikes and measures actual duration above capacity', () => {
  const result = exactReservations([{ user: 'a', start: start + 10000, end: start + 20000, units: 375 }], start, start + 3600000);
  expect(Math.max(...result.points.map(point => point.total))).toBe(375);
  expect(result.points.reduce((sum, point) => sum + (point.total > 300 ? point.duration : 0), 0)).toBe(10000);
});
test('rejects invalid intervals and fractional reservation counts', () => {
  expect(() => exactReservations([], NaN, start)).toThrow();
  expect(() => exactReservations([], start, start)).toThrow();
  expect(() => exactReservations([], start, start + 94 * 86400000)).toThrow();
  expect(() => exactReservations([{ user: 'a', start, end: start + 60000, units: 0.5 }], start, start + 60000)).toThrow();
});
