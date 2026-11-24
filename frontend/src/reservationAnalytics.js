export function exactReservations(records, start, end) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end - start > 93 * 86400000) throw new Error('Choose a time interval of up to 93 days.');
  const users = [...new Set(records.map(record => record.user))].sort();
  const indices = new Map(users.map((user, index) => [user, index]));
  const events = new Map([[start, new Map()]]);
  const add = (time, index, units) => {
    if (!events.has(time)) events.set(time, new Map());
    const changes = events.get(time);
    changes.set(index, (changes.get(index) || 0) + units);
  };
  records.forEach(record => {
    const from = Math.max(start, record.start), through = Math.min(end, record.end);
    if (through <= from) return;
    if (!Number.isInteger(record.units) || record.units <= 0) throw new Error('Reservation counts must be positive integers.');
    const index = indices.get(record.user);
    add(from, index, record.units);
    if (through < end) add(through, index, -record.units);
  });
  const times = [...events.keys()].sort((a, b) => a - b);
  const values = Array(users.length).fill(0);
  const points = times.map((time, index) => {
    events.get(time).forEach((units, userIndex) => { values[userIndex] += units; });
    return { time, duration: (times[index + 1] ?? end) - time, values: [...values], total: values.reduce((sum, value) => sum + value, 0) };
  });
  // Extend the final step to the exclusive interval boundary for rendering.
  const last = points[points.length - 1];
  points.push({ ...last, time: end, duration: 0 });
  return { users, points };
}
