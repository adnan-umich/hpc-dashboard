// Capacity defaults from the user's supplied Great Lakes scontrol output.
// These are reference values, not a live license-server feed.
export const licensePools = {
  aa_r: 50, aa_r_hpc: 532, abaqus: 375, ampl: 5, ansys: 2975,
  ansys_hpc: 4950, ansysem: 3045, 'coe-lsdyna': 5000,
  'comsol-acdc': 1, 'comsol-acoustics': 1, 'comsol-battery': 1,
  'comsol-cfd': 1, 'comsol-heat-transfer': 1, 'comsol-nonlinear-struct-mech': 1,
  'comsol-optimization': 1, 'comsol-rf': 1, 'comsol-structural-mechanics': 1,
  comsol: 2, fdtd_dengh: 1, fdtd_kotov: 20, gurobi: 1024, helios: 0,
  lumerical: 120, matlab_distrib_comp_engine: 600, sas: 10,
  sentaurus: 20, 'stata-mp': 11, stata: 20,
};
export const poolCapacity = (license, cluster) => cluster === 'greatlakes' && Object.prototype.hasOwnProperty.call(licensePools, license) ? String(licensePools[license]) : '';
