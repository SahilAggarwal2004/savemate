export const cacheName = "savemate-shares";

const time = { millisecond: 1, second: 1000, minute: 60_000, hour: 3_600_000, day: 86_400_000 };

export const maxWaitMs = 60 * time.second;

export const pollIntervalMs = 400 * time.millisecond;
