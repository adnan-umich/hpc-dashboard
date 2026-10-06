// Maps the generic per-table column toggles from configuration onto the actual
// MUI DataGrid field names used by the Active / Pending / Completed tables.
// GL.js uses "Status" for the completed-job status field while A2.js/LH.js use "State",
// so both keys are populated - DataGrid ignores keys that don't match a column.
export const buildColumnVisibilityModel = (tableType, columns = {}) => {
  const c = columns[tableType] || {};
  if (tableType === 'completed') {
    return {
      id: c.id !== false,
      State: c.status !== false,
      Status: c.status !== false,
      User: c.user !== false,
      name: c.name !== false,
      Partition: c.partition !== false,
      Nodes: c.nodes !== false,
      CPUS: c.cpus !== false,
      Memory: c.memory !== false,
      Elapsed: c.elapsed !== false,
      Begin: c.begin !== false,
    };
  }
  return {
    id: c.id !== false,
    status: c.status !== false,
    user: c.user !== false,
    name: c.name !== false,
    partition: c.partition !== false,
    nodes: c.nodes !== false,
    cpus: c.cpus !== false,
    memory: c.memory !== false,
    timeleft: c.timeleft !== false,
  };
};
