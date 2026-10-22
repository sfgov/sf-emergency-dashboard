// Static call data - 30-day daily averages by station, hour, and priority
// Generated from SF OpenData CAD dataset (2zdj-bwza) on 2026-10-21

export interface HourlyCalls {
  A: number;
  B: number;
  C: number;
}

export interface StationCalls {
  byHour: HourlyCalls[];  // 24 hours, index 0 = midnight
  daily: HourlyCalls;      // total daily average
}

export const CALL_DATA: Record<string, StationCalls> = {
  cent: {
    byHour: [
      { A: 0.7, B: 1.1, C: 4.5 }, { A: 0.6, B: 1.4, C: 2.9 }, { A: 0.8, B: 1.2, C: 2.4 },
      { A: 0.3, B: 0.8, C: 1.7 }, { A: 0.3, B: 0.4, C: 1.3 }, { A: 0.3, B: 0.6, C: 1.8 },
      { A: 0.3, B: 0.9, C: 5.7 }, { A: 0.4, B: 1.1, C: 8.7 }, { A: 0.6, B: 1.5, C: 6.2 },
      { A: 0.7, B: 1.4, C: 6.7 }, { A: 0.9, B: 1.8, C: 6.2 }, { A: 0.6, B: 2.1, C: 6.8 },
      { A: 0.5, B: 1.8, C: 7.1 }, { A: 0.7, B: 1.6, C: 7.2 }, { A: 1.1, B: 1.9, C: 6.4 },
      { A: 0.7, B: 2.1, C: 6.8 }, { A: 0.5, B: 2.3, C: 5.7 }, { A: 0.9, B: 2.3, C: 6.4 },
      { A: 1.1, B: 2.4, C: 5.5 }, { A: 0.9, B: 1.7, C: 5.3 }, { A: 0.8, B: 1.6, C: 5.4 },
      { A: 0.9, B: 1.7, C: 4.8 }, { A: 0.9, B: 1.0, C: 4.9 }, { A: 0.8, B: 1.5, C: 4.0 },
    ],
    daily: { A: 16.1, B: 36.1, C: 124.5 },
  },
  sout: {
    byHour: [
      { A: 1.1, B: 2.4, C: 4.5 }, { A: 1.0, B: 2.0, C: 3.4 }, { A: 0.9, B: 1.8, C: 2.9 },
      { A: 0.6, B: 1.8, C: 2.3 }, { A: 0.6, B: 1.2, C: 1.4 }, { A: 0.6, B: 1.1, C: 2.0 },
      { A: 0.8, B: 1.7, C: 3.5 }, { A: 0.9, B: 4.0, C: 12.2 }, { A: 0.9, B: 4.0, C: 13.0 },
      { A: 1.2, B: 5.0, C: 10.3 }, { A: 1.4, B: 5.3, C: 7.0 }, { A: 1.6, B: 4.4, C: 8.1 },
      { A: 2.0, B: 3.7, C: 9.4 }, { A: 1.6, B: 3.3, C: 9.7 }, { A: 1.8, B: 3.6, C: 8.3 },
      { A: 1.8, B: 5.4, C: 6.7 }, { A: 1.8, B: 4.9, C: 8.7 }, { A: 1.4, B: 4.0, C: 7.7 },
      { A: 1.6, B: 3.2, C: 7.4 }, { A: 1.2, B: 2.9, C: 7.1 }, { A: 1.0, B: 2.6, C: 5.0 },
      { A: 1.0, B: 2.0, C: 4.4 }, { A: 1.2, B: 3.2, C: 4.5 }, { A: 0.9, B: 3.0, C: 5.8 },
    ],
    daily: { A: 28.8, B: 76.6, C: 155.1 },
  },
  potr: {
    byHour: [
      { A: 0.5, B: 0.9, C: 1.3 }, { A: 0.5, B: 0.9, C: 1.2 }, { A: 0.4, B: 1.0, C: 1.1 },
      { A: 0.3, B: 0.8, C: 0.5 }, { A: 0.2, B: 0.5, C: 0.5 }, { A: 0.2, B: 0.4, C: 0.6 },
      { A: 0.3, B: 0.8, C: 2.3 }, { A: 0.3, B: 1.6, C: 3.0 }, { A: 0.6, B: 1.8, C: 5.0 },
      { A: 0.6, B: 2.3, C: 4.6 }, { A: 0.8, B: 3.0, C: 4.4 }, { A: 0.3, B: 3.3, C: 4.2 },
      { A: 0.9, B: 2.7, C: 5.6 }, { A: 0.5, B: 2.0, C: 3.7 }, { A: 0.8, B: 1.6, C: 2.8 },
      { A: 0.6, B: 1.6, C: 4.3 }, { A: 0.9, B: 2.4, C: 5.3 }, { A: 0.6, B: 2.5, C: 5.2 },
      { A: 0.9, B: 1.5, C: 4.0 }, { A: 0.8, B: 1.5, C: 3.6 }, { A: 0.8, B: 1.3, C: 3.4 },
      { A: 0.6, B: 1.3, C: 3.2 }, { A: 0.9, B: 1.6, C: 3.6 }, { A: 0.6, B: 1.2, C: 2.2 },
    ],
    daily: { A: 14.0, B: 38.5, C: 75.4 },
  },
  miss: {
    byHour: [
      { A: 0.8, B: 1.7, C: 4.1 }, { A: 1.0, B: 1.7, C: 2.6 }, { A: 0.9, B: 1.8, C: 2.6 },
      { A: 0.4, B: 1.7, C: 1.8 }, { A: 0.4, B: 0.9, C: 2.0 }, { A: 0.4, B: 0.9, C: 5.0 },
      { A: 0.2, B: 1.3, C: 3.7 }, { A: 0.5, B: 2.5, C: 8.9 }, { A: 0.9, B: 2.4, C: 11.8 },
      { A: 0.8, B: 2.9, C: 9.5 }, { A: 1.0, B: 2.2, C: 10.9 }, { A: 1.4, B: 2.8, C: 10.2 },
      { A: 1.3, B: 3.0, C: 10.1 }, { A: 1.2, B: 2.7, C: 11.7 }, { A: 1.6, B: 2.9, C: 8.9 },
      { A: 1.4, B: 3.5, C: 10.9 }, { A: 1.3, B: 3.4, C: 11.2 }, { A: 1.5, B: 3.1, C: 10.2 },
      { A: 1.1, B: 2.6, C: 10.4 }, { A: 1.6, B: 2.9, C: 8.2 }, { A: 1.3, B: 1.9, C: 7.0 },
      { A: 1.2, B: 1.9, C: 6.5 }, { A: 1.3, B: 2.3, C: 6.8 }, { A: 0.7, B: 2.1, C: 5.1 },
    ],
    daily: { A: 24.1, B: 55.0, C: 180.1 },
  },
  nort: {
    byHour: [
      { A: 0.6, B: 1.3, C: 2.6 }, { A: 0.8, B: 1.4, C: 2.5 }, { A: 0.7, B: 1.2, C: 2.5 },
      { A: 0.5, B: 0.7, C: 1.1 }, { A: 0.4, B: 0.9, C: 1.3 }, { A: 0.4, B: 0.6, C: 1.9 },
      { A: 0.4, B: 1.0, C: 2.6 }, { A: 0.5, B: 2.0, C: 6.5 }, { A: 0.9, B: 1.9, C: 9.1 },
      { A: 0.6, B: 1.3, C: 8.0 }, { A: 0.5, B: 2.0, C: 6.9 }, { A: 0.8, B: 2.1, C: 6.9 },
      { A: 1.0, B: 1.9, C: 7.9 }, { A: 0.7, B: 2.1, C: 8.1 }, { A: 0.7, B: 2.1, C: 7.4 },
      { A: 1.1, B: 1.7, C: 7.6 }, { A: 1.0, B: 2.2, C: 6.6 }, { A: 0.8, B: 1.7, C: 6.4 },
      { A: 1.1, B: 1.4, C: 6.7 }, { A: 1.0, B: 1.4, C: 6.0 }, { A: 1.2, B: 1.5, C: 5.0 },
      { A: 1.1, B: 1.3, C: 3.9 }, { A: 1.1, B: 1.4, C: 4.2 }, { A: 0.6, B: 1.8, C: 2.9 },
    ],
    daily: { A: 18.4, B: 36.9, C: 124.5 },
  },
  park: {
    byHour: [
      { A: 0.1, B: 0.7, C: 2.5 }, { A: 0.2, B: 0.4, C: 2.2 }, { A: 0.1, B: 0.4, C: 2.0 },
      { A: 0.1, B: 0.4, C: 1.7 }, { A: 0.1, B: 0.4, C: 1.0 }, { A: 0.1, B: 0.2, C: 1.2 },
      { A: 0.2, B: 0.3, C: 1.6 }, { A: 0.0, B: 0.7, C: 3.9 }, { A: 0.2, B: 1.2, C: 5.7 },
      { A: 0.1, B: 1.7, C: 5.8 }, { A: 0.3, B: 1.7, C: 5.1 }, { A: 0.3, B: 1.9, C: 3.9 },
      { A: 0.4, B: 1.0, C: 4.8 }, { A: 0.3, B: 0.7, C: 4.3 }, { A: 0.4, B: 0.5, C: 3.3 },
      { A: 0.4, B: 0.6, C: 5.8 }, { A: 0.3, B: 0.8, C: 4.9 }, { A: 0.3, B: 0.6, C: 3.7 },
      { A: 0.5, B: 0.4, C: 3.9 }, { A: 0.2, B: 0.7, C: 2.6 }, { A: 0.2, B: 0.8, C: 3.2 },
      { A: 0.3, B: 0.6, C: 5.2 }, { A: 0.3, B: 0.6, C: 4.5 }, { A: 0.2, B: 0.7, C: 2.9 },
    ],
    daily: { A: 5.5, B: 18.1, C: 85.8 },
  },
  rich: {
    byHour: [
      { A: 0.2, B: 0.3, C: 1.4 }, { A: 0.2, B: 0.3, C: 0.8 }, { A: 0.2, B: 0.2, C: 0.5 },
      { A: 0.0, B: 0.1, C: 0.5 }, { A: 0.2, B: 0.4, C: 0.5 }, { A: 0.3, B: 0.5, C: 0.7 },
      { A: 0.1, B: 0.5, C: 3.7 }, { A: 0.2, B: 1.2, C: 6.3 }, { A: 0.2, B: 1.8, C: 7.1 },
      { A: 0.2, B: 2.4, C: 7.4 }, { A: 0.5, B: 1.8, C: 6.9 }, { A: 0.5, B: 1.4, C: 6.4 },
      { A: 0.5, B: 1.3, C: 5.7 }, { A: 0.5, B: 1.8, C: 6.7 }, { A: 0.6, B: 1.3, C: 4.5 },
      { A: 0.6, B: 0.7, C: 6.1 }, { A: 0.5, B: 1.2, C: 7.5 }, { A: 0.2, B: 1.0, C: 7.4 },
      { A: 0.5, B: 0.9, C: 5.9 }, { A: 0.3, B: 0.8, C: 3.9 }, { A: 0.4, B: 0.6, C: 2.5 },
      { A: 0.4, B: 0.6, C: 3.7 }, { A: 0.4, B: 1.0, C: 4.7 }, { A: 0.1, B: 1.0, C: 2.1 },
    ],
    daily: { A: 8.0, B: 22.8, C: 102.7 },
  },
  ingl: {
    byHour: [
      { A: 0.5, B: 0.8, C: 2.1 }, { A: 0.6, B: 0.6, C: 1.0 }, { A: 0.4, B: 0.2, C: 0.8 },
      { A: 0.3, B: 0.6, C: 1.0 }, { A: 0.2, B: 0.5, C: 1.0 }, { A: 0.3, B: 0.3, C: 0.8 },
      { A: 0.4, B: 0.7, C: 1.7 }, { A: 0.2, B: 0.9, C: 5.6 }, { A: 0.5, B: 1.0, C: 5.7 },
      { A: 0.5, B: 1.2, C: 4.9 }, { A: 0.5, B: 1.7, C: 4.5 }, { A: 0.5, B: 1.2, C: 5.1 },
      { A: 0.6, B: 1.4, C: 4.8 }, { A: 0.5, B: 0.8, C: 4.1 }, { A: 0.6, B: 1.0, C: 3.4 },
      { A: 0.5, B: 1.3, C: 4.1 }, { A: 0.6, B: 1.6, C: 5.8 }, { A: 1.0, B: 1.3, C: 5.2 },
      { A: 0.8, B: 1.1, C: 4.6 }, { A: 0.8, B: 0.9, C: 4.3 }, { A: 0.5, B: 0.9, C: 3.2 },
      { A: 0.7, B: 1.5, C: 2.6 }, { A: 0.7, B: 1.3, C: 3.1 }, { A: 0.4, B: 0.7, C: 2.0 },
    ],
    daily: { A: 12.6, B: 23.7, C: 81.4 },
  },
  tara: {
    byHour: [
      { A: 0.4, B: 0.8, C: 1.9 }, { A: 0.4, B: 0.8, C: 0.6 }, { A: 0.3, B: 0.7, C: 0.8 },
      { A: 0.1, B: 0.4, C: 0.6 }, { A: 0.2, B: 0.4, C: 0.6 }, { A: 0.1, B: 0.3, C: 0.5 },
      { A: 0.2, B: 0.4, C: 1.9 }, { A: 0.2, B: 0.9, C: 4.5 }, { A: 0.3, B: 0.8, C: 3.9 },
      { A: 0.6, B: 1.4, C: 5.1 }, { A: 0.3, B: 1.4, C: 6.2 }, { A: 0.7, B: 1.4, C: 4.9 },
      { A: 0.4, B: 1.3, C: 4.7 }, { A: 0.6, B: 1.0, C: 4.8 }, { A: 0.6, B: 1.4, C: 4.8 },
      { A: 0.7, B: 1.7, C: 3.8 }, { A: 0.9, B: 1.7, C: 5.4 }, { A: 0.7, B: 1.6, C: 4.5 },
      { A: 0.4, B: 1.2, C: 5.5 }, { A: 0.6, B: 0.9, C: 3.9 }, { A: 0.6, B: 0.7, C: 2.8 },
      { A: 0.6, B: 0.9, C: 3.7 }, { A: 0.5, B: 1.2, C: 3.0 }, { A: 0.5, B: 0.9, C: 2.0 },
    ],
    daily: { A: 10.7, B: 24.1, C: 80.7 },
  },
  tend: {
    byHour: [
      { A: 1.0, B: 1.2, C: 2.4 }, { A: 0.7, B: 1.2, C: 1.6 }, { A: 0.6, B: 1.0, C: 1.8 },
      { A: 0.4, B: 0.9, C: 1.4 }, { A: 0.6, B: 1.0, C: 1.0 }, { A: 0.3, B: 0.8, C: 2.0 },
      { A: 0.5, B: 0.8, C: 3.1 }, { A: 0.4, B: 1.0, C: 4.1 }, { A: 0.5, B: 1.2, C: 5.1 },
      { A: 0.5, B: 1.8, C: 4.2 }, { A: 0.7, B: 1.4, C: 4.5 }, { A: 0.6, B: 1.5, C: 5.7 },
      { A: 0.9, B: 1.8, C: 5.2 }, { A: 0.8, B: 1.7, C: 5.1 }, { A: 0.9, B: 1.3, C: 4.3 },
      { A: 0.8, B: 1.5, C: 5.2 }, { A: 0.7, B: 1.4, C: 5.8 }, { A: 0.4, B: 1.8, C: 5.8 },
      { A: 0.9, B: 2.1, C: 4.6 }, { A: 0.6, B: 1.7, C: 3.2 }, { A: 0.7, B: 1.4, C: 3.8 },
      { A: 0.9, B: 1.5, C: 3.8 }, { A: 0.8, B: 1.7, C: 3.6 }, { A: 0.9, B: 1.5, C: 3.5 },
    ],
    daily: { A: 16.3, B: 33.3, C: 90.8 },
  },
};

// Helper to sum calls for a shift (hour ranges)
export function getShiftCalls(station: string, shift: 'days' | 'elevens' | 'swings' | 'mids'): HourlyCalls {
  const data = CALL_DATA[station];
  if (!data) return { A: 0, B: 0, C: 0 };

  const ranges = {
    days: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15],      // 6am-4pm
    elevens: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], // 11am-9pm
    swings: [15, 16, 17, 18, 19, 20, 21, 22, 23, 0],   // 3pm-1am
    mids: [21, 22, 23, 0, 1, 2, 3, 4, 5, 6],           // 9pm-7am
  };

  const hours = ranges[shift];
  const result = { A: 0, B: 0, C: 0 };
  hours.forEach(h => {
    result.A += data.byHour[h].A;
    result.B += data.byHour[h].B;
    result.C += data.byHour[h].C;
  });

  return {
    A: Math.round(result.A * 10) / 10,
    B: Math.round(result.B * 10) / 10,
    C: Math.round(result.C * 10) / 10,
  };
}

// Median response times in minutes by station and priority (30-day data)
export interface ResponseTimeStats {
  median: number;
  count: number;
}

export interface StationResponseTimes {
  A: ResponseTimeStats;
  B: ResponseTimeStats;
  C: ResponseTimeStats;
}

export const RESPONSE_TIMES: Record<string, StationResponseTimes> = {
  cent: { A: { median: 7.1, count: 478 }, B: { median: 26.9, count: 701 }, C: { median: 49.4, count: 448 } },
  sout: { A: { median: 7.4, count: 863 }, B: { median: 25.4, count: 1075 }, C: { median: 51.2, count: 903 } },
  potr: { A: { median: 7.7, count: 440 }, B: { median: 25.1, count: 486 }, C: { median: 60.2, count: 351 } },
  miss: { A: { median: 6.8, count: 722 }, B: { median: 22.1, count: 829 }, C: { median: 49.6, count: 832 } },
  nort: { A: { median: 8.1, count: 567 }, B: { median: 33.1, count: 696 }, C: { median: 58.6, count: 502 } },
  park: { A: { median: 7.5, count: 162 }, B: { median: 18.0, count: 272 }, C: { median: 34.8, count: 251 } },
  rich: { A: { median: 9.4, count: 238 }, B: { median: 18.1, count: 331 }, C: { median: 36.5, count: 293 } },
  ingl: { A: { median: 9.0, count: 389 }, B: { median: 22.9, count: 423 }, C: { median: 44.1, count: 335 } },
  tara: { A: { median: 9.4, count: 325 }, B: { median: 18.7, count: 491 }, C: { median: 45.8, count: 273 } },
  tend: { A: { median: 6.1, count: 494 }, B: { median: 36.6, count: 532 }, C: { median: 63.0, count: 728 } },
};

// Target response times in minutes
export const RESPONSE_TARGETS = { A: 8, B: 20, C: 60 };
