import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import axios from 'axios';
import { useJobEfficiency } from './my-job-statistics';

jest.mock('axios');
import { parseJobEfficiency } from './my-job-statistics';

test('parses the supplied report values', () => {
  expect(parseJobEfficiency('CPU Efficiency:      19.14% of 00:04:16 total CPU time (cores * walltime)\nMemory Efficiency:   30.14% of 2.93 GiB')).toEqual({ cpu: 19.14, memory: 30.14, inefficient: true });
});

test.each([[49.99, 80, true], [80, 49.99, true], [50, 50, false], [100, 100, false], [0, 80, true]])('CPU %s and memory %s produce inefficient=%s', (cpu, memory, inefficient) => {
  expect(parseJobEfficiency(`CPU Efficiency: ${cpu}%\nMemory Efficiency: ${memory}%`).inefficient).toBe(inefficient);
});

test.each([null, {}, { error: 'Unavailable' }, 'Failed to fetch job stats', 'CPU Efficiency: N/A'])('missing data is not treated as zero: %p', output => {
  expect(parseJobEfficiency(output)).toEqual({ cpu: null, memory: null, inefficient: false });
});

test('one available low metric is enough, including wrapped reports', () => {
  expect(parseJobEfficiency({ report: 'Memory Efficiency: 20%' })).toEqual({ cpu: null, memory: 20, inefficient: true });
});


test.each(['Status', 'State'])('loads statistics and highlights completed rows using %s', async field => {
  axios.get.mockResolvedValue({ data: 'CPU Efficiency: 19.14%\nMemory Efficiency: 30.14%' });
  const jobs = [{ id: 60444994, [field]: 'COMPLETED' }, { id: 2, [field]: 'FAILED' }];
  const container = document.createElement('div');
  const root = createRoot(container);
  let rowClass;
  function Harness() {
    rowClass = useJobEfficiency('greatlakes', jobs);
    return null;
  }
  global.IS_REACT_ACT_ENVIRONMENT = true;
  axios.get.mockClear();
  try {
    await act(async () => { root.render(<Harness />); });
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith('http://localhost:8888/get_my_job_stats/greatlakes/60444994');
    expect(rowClass({ id: 60444994 })).toBe('inefficient-job');
    expect(rowClass({ id: 2 })).toBe('');
  } finally {
    act(() => root.unmount());
    delete global.IS_REACT_ACT_ENVIRONMENT;
  }
});
