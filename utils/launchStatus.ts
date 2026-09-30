export const STATUS_GO = 1;
export const STATUS_TBD = 2;
export const STATUS_SUCCESS = 3;
export const STATUS_FAILURE = 4;
export const STATUS_HOLD = 5;
export const STATUS_IN_FLIGHT = 6;
export const STATUS_PARTIAL_FAILURE = 7;
export const STATUS_TBC = 8;
export const STATUS_PAYLOAD_DEPLOYED = 9;

const UPCOMING = new Set([
  STATUS_GO,
  STATUS_TBD,
  STATUS_HOLD,
  STATUS_IN_FLIGHT,
  STATUS_TBC,
]);

const FINISHED = new Set([
  STATUS_SUCCESS,
  STATUS_FAILURE,
  STATUS_PARTIAL_FAILURE,
  STATUS_PAYLOAD_DEPLOYED,
]);

const NAMES: Record<number, string> = {
  [STATUS_GO]: 'Go',
  [STATUS_TBD]: 'TBD',
  [STATUS_SUCCESS]: 'Success',
  [STATUS_FAILURE]: 'Failure',
  [STATUS_HOLD]: 'Hold',
  [STATUS_IN_FLIGHT]: 'In Flight',
  [STATUS_PARTIAL_FAILURE]: 'Partial failure',
  [STATUS_TBC]: 'TBC',
  [STATUS_PAYLOAD_DEPLOYED]: 'Payload deployed',
};

const NAME_TO_ID: Record<string, number> = {
  go: STATUS_GO,
  tbd: STATUS_TBD,
  success: STATUS_SUCCESS,
  failure: STATUS_FAILURE,
  hold: STATUS_HOLD,
  'in flight': STATUS_IN_FLIGHT,
  'partial failure': STATUS_PARTIAL_FAILURE,
  tbc: STATUS_TBC,
  'payload deployed': STATUS_PAYLOAD_DEPLOYED,
};

export function statusIdFromName(name?: string | null): number | null {
  if (!name) return null;
  const id = NAME_TO_ID[name.trim().toLowerCase()];
  return id ?? null;
}

export function statusLabel(id?: number | null, fallback?: string | null): string {
  if (id != null && NAMES[id]) return NAMES[id];
  const fromName = statusIdFromName(fallback);
  if (fromName != null) return NAMES[fromName];
  return fallback?.trim() || 'Unknown';
}

export function isUpcomingStatus(id?: number | null): boolean {
  return id != null && UPCOMING.has(id);
}

export function isFinishedStatus(id?: number | null): boolean {
  return id != null && FINISHED.has(id);
}

export function resolveStatusId(id?: number | null, name?: string | null): number | null {
  if (id != null && (UPCOMING.has(id) || FINISHED.has(id))) return id;
  return statusIdFromName(name);
}

/** Kept only so screens that still render the old status legend compile. */
export function getStatusConfig(status: string) {
  const id = statusIdFromName(status);
  return {
    category: isFinishedStatus(id) ? 'finished' : 'upcoming',
    displayName: statusLabel(id, status),
    bg: 'transparent',
    text: '#FFFFFF',
  };
}

export function getStatusCategory(status: string): 'success' | 'failed' | 'pending' {
  const id = statusIdFromName(status);
  if (id === STATUS_SUCCESS || id === STATUS_PAYLOAD_DEPLOYED) return 'success';
  if (id === STATUS_FAILURE || id === STATUS_PARTIAL_FAILURE) return 'failed';
  return 'pending';
}
