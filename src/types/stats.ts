export type StatsRegistrationRecord = {
  id: number;
  companions: number;
  createdAt: string;
};

export type StatsChartPoint = {
  hourKey: string;
  axisLabel: string;
  fullLabel: string;
  actualNewPeople: number | null;
  actualCumulativePeople: number | null;
  forecastNewPeople: number | null;
  forecastCumulativePeople: number | null;
  isForecast: boolean;
};
