export const CITYWIDE = {
  target: 2257,
  totalSworn: 1847,
  fullDuty: 1676,
  modifiedDuty: 171,
  recruits: 84,
  get shortage() { return this.target - this.fullDuty - this.recruits; },
  get shortagePercent() { return Math.round((this.shortage / this.target) * 100); },
};

export const BUREAUS_FULL_DUTY = {
  fieldOps: {
    name: 'Field Operations Bureau',
    total: 1112,
    units: {
      cent: { name: 'Central', code: 'CENT', capt: 1, lt: 5, sgt: 13, off: 86, total: 105 },
      sout: { name: 'Southern', code: 'SOUT', capt: 1, lt: 5, sgt: 17, off: 117, total: 140 },
      potr: { name: 'Bayview', code: 'POTR', capt: 1, lt: 3, sgt: 12, off: 81, total: 97 },
      miss: { name: 'Mission', code: 'MISS', capt: 1, lt: 5, sgt: 14, off: 100, total: 120 },
      nort: { name: 'Northern', code: 'NORT', capt: 1, lt: 4, sgt: 15, off: 86, total: 106 },
      park: { name: 'Park', code: 'PARK', capt: 1, lt: 3, sgt: 11, off: 52, total: 67 },
      rich: { name: 'Richmond', code: 'RICH', capt: 1, lt: 4, sgt: 12, off: 54, total: 71 },
      ingl: { name: 'Ingleside', code: 'INGL', capt: 1, lt: 4, sgt: 13, off: 77, total: 95 },
      tara: { name: 'Taraval', code: 'TARA', capt: 1, lt: 4, sgt: 13, off: 64, total: 82 },
      tend: { name: 'Tenderloin', code: 'TEND', capt: 1, lt: 4, sgt: 14, off: 95, total: 114 },
      dmac: { name: 'DMACC', code: 'DMAC', capt: 1, lt: 2, sgt: 14, off: 63, total: 80 },
      fob: { name: 'FOB HQ', code: 'FOB', capt: 3, lt: 3, sgt: 5, off: 11, total: 27, deputyChief: 1, commander: 4 },
      ced: { name: 'CED', code: 'CED', lt: 1, sgt: 3, off: 4, total: 8 },
    },
  },
  investigations: { name: 'Bureau of Investigations', total: 222 },
  airport: { name: 'Airport Bureau', total: 126 },
  specialOps: { name: 'Special Operations Bureau', total: 122 },
  admin: { name: 'Administration Bureau', total: 58 },
  chiefOfStaff: { name: 'Chief of Staff', total: 29 },
  chiefsOffice: { name: "Chief's Office", total: 7 },
};

export const BUREAUS_ALL_SWORN = {
  fieldOps: {
    name: 'Field Operations Bureau',
    total: 1139,
    units: {
      cent: { name: 'Central', code: 'CENT', capt: 1, lt: 5, sgt: 13, off: 90, total: 109 },
      sout: { name: 'Southern', code: 'SOUT', capt: 1, lt: 5, sgt: 17, off: 117, total: 140 },
      potr: { name: 'Bayview', code: 'POTR', capt: 1, lt: 3, sgt: 12, off: 84, total: 100 },
      miss: { name: 'Mission', code: 'MISS', capt: 1, lt: 5, sgt: 14, off: 103, total: 123 },
      nort: { name: 'Northern', code: 'NORT', capt: 1, lt: 4, sgt: 15, off: 89, total: 109 },
      park: { name: 'Park', code: 'PARK', capt: 1, lt: 3, sgt: 11, off: 54, total: 69 },
      rich: { name: 'Richmond', code: 'RICH', capt: 1, lt: 4, sgt: 12, off: 54, total: 71 },
      ingl: { name: 'Ingleside', code: 'INGL', capt: 1, lt: 4, sgt: 14, off: 78, total: 97 },
      tara: { name: 'Taraval', code: 'TARA', capt: 1, lt: 4, sgt: 13, off: 65, total: 83 },
      tend: { name: 'Tenderloin', code: 'TEND', capt: 1, lt: 4, sgt: 14, off: 96, total: 115 },
      dmac: { name: 'DMACC', code: 'DMAC', capt: 1, lt: 2, sgt: 15, off: 63, total: 81 },
      fob: { name: 'FOB HQ', code: 'FOB', capt: 4, lt: 3, sgt: 6, off: 15, total: 33, deputyChief: 1, commander: 4 },
      ced: { name: 'CED', code: 'CED', lt: 1, sgt: 3, off: 5, total: 9 },
    },
  },
  investigations: { name: 'Bureau of Investigations', total: 231 },
  airport: { name: 'Airport Bureau', total: 127 },
  specialOps: { name: 'Special Operations Bureau', total: 134 },
  admin: {
    name: 'Administration Bureau',
    total: 179,
    units: {
      acad: { name: 'Academy', code: 'ACAD', total: 29 },
      admi: { name: 'Admin HQ', code: 'ADMI', total: 6 },
      cis: { name: 'CIS', code: 'CIS', total: 15 },
      fto: { name: 'FTO', code: 'FTO', total: 4 },
      medi: { name: 'Medical Leave', code: 'MEDI', total: 100 },
      prop: { name: 'Property', code: 'PROP', total: 8 },
      staf: { name: 'Staffing', code: 'STAF', total: 17 },
    },
  },
  chiefOfStaff: { name: 'Chief of Staff', total: 30 },
  chiefsOffice: { name: "Chief's Office", total: 7 },
};

export const MODIFIED_DUTY_BREAKDOWN = {
  medicalLeave: 100,
  otherModified: 71,
  total: 171,
};

export const SHIFTS = {
  days:   { name: 'Days',   start: 6,  end: 16, color: '#2a78d6', description: 'Sector patrol' },
  elevens:{ name: "11's",   start: 11, end: 21, color: '#9333ea', description: 'Footbeat' },
  swings: { name: 'Swings', start: 15, end: 1,  color: '#eb6834', description: 'Sector patrol' },
  mids:   { name: 'Mids',   start: 21, end: 7,  color: '#1baf7a', description: 'Sector patrol' },
} as const;

export const DAILY_ON_DUTY = {
  cent: { days: 7,  elevens: 10, swings: 11, mids: 12 },
  sout: { days: 22, elevens: 5,  swings: 17, mids: 14 },
  potr: { days: 11, elevens: 2,  swings: 15, mids: 14 },
  miss: { days: 18, elevens: 5,  swings: 11, mids: 9 },
  nort: { days: 20, elevens: 3,  swings: 14, mids: 13 },
  park: { days: 6,  elevens: 4,  swings: 7,  mids: 10 },
  rich: { days: 10, elevens: 1,  swings: 7,  mids: 8 },
  ingl: { days: 10, elevens: 2,  swings: 9,  mids: 13 },
  tara: { days: 8,  elevens: 2,  swings: 15, mids: 7 },
  tend: { days: 11, elevens: 10, swings: 9,  mids: 14 },
  dmac: { days: 11, elevens: 18, swings: 1,  mids: 4 },
} as const;

function calcShiftAssignments(stationKey: keyof typeof DAILY_ON_DUTY) {
  const daily = DAILY_ON_DUTY[stationKey];
  const unit = BUREAUS_FULL_DUTY.fieldOps.units[stationKey];
  const officers = unit.off || 0;
  const dailyTotal = daily.days + daily.elevens + daily.swings + daily.mids;

  if (dailyTotal === 0) return { days: 0, elevens: 0, swings: 0, mids: 0, total: officers };

  const days = Math.round(officers * (daily.days / dailyTotal));
  const elevens = Math.round(officers * (daily.elevens / dailyTotal));
  const swings = Math.round(officers * (daily.swings / dailyTotal));
  const mids = officers - days - elevens - swings;

  return { days, elevens, swings, mids, total: officers };
}

export const SHIFT_ASSIGNMENTS = {
  cent: calcShiftAssignments('cent'),
  sout: calcShiftAssignments('sout'),
  potr: calcShiftAssignments('potr'),
  miss: calcShiftAssignments('miss'),
  nort: calcShiftAssignments('nort'),
  park: calcShiftAssignments('park'),
  rich: calcShiftAssignments('rich'),
  ingl: calcShiftAssignments('ingl'),
  tara: calcShiftAssignments('tara'),
  tend: calcShiftAssignments('tend'),
  dmac: calcShiftAssignments('dmac'),
};

export const SHIFT_TOTALS = {
  days: Object.values(SHIFT_ASSIGNMENTS).reduce((s, a) => s + a.days, 0),
  elevens: Object.values(SHIFT_ASSIGNMENTS).reduce((s, a) => s + a.elevens, 0),
  swings: Object.values(SHIFT_ASSIGNMENTS).reduce((s, a) => s + a.swings, 0),
  mids: Object.values(SHIFT_ASSIGNMENTS).reduce((s, a) => s + a.mids, 0),
  total: Object.values(SHIFT_ASSIGNMENTS).reduce((s, a) => s + a.total, 0),
};

export const DAILY_TOTALS = {
  days: Object.values(DAILY_ON_DUTY).reduce((s, d) => s + d.days, 0),
  elevens: Object.values(DAILY_ON_DUTY).reduce((s, d) => s + d.elevens, 0),
  swings: Object.values(DAILY_ON_DUTY).reduce((s, d) => s + d.swings, 0),
  mids: Object.values(DAILY_ON_DUTY).reduce((s, d) => s + d.mids, 0),
  get total() { return this.days + this.elevens + this.swings + this.mids; },
};

export const BUREAUS = BUREAUS_FULL_DUTY;

export const STATIONS = [
  'cent', 'sout', 'potr', 'miss', 'nort', 'park', 'rich', 'ingl', 'tara', 'tend'
] as const;

export const STATION_TOTAL = STATIONS.reduce(
  (sum, s) => sum + BUREAUS.fieldOps.units[s].total, 0
);
