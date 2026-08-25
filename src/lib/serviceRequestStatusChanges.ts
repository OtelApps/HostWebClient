import type { GuestServiceRequest } from '../services/supabase/serviceRequests';

const LAST_STATUS_KEY = 'otelapps_web_request_last_statuses';
const SOLVED_SHOWN_KEY = 'otelapps_web_solved_shown_ids';

export type ServiceRequestStatusChange = {
  request: GuestServiceRequest;
  from: string;
  to: string;
};

function scopedKey(base: string, guestExternalId: string): string {
  return `${base}:${guestExternalId}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function loadLastStatuses(guestExternalId: string): Record<string, string> {
  const parsed = readJson<unknown>(scopedKey(LAST_STATUS_KEY, guestExternalId), {});
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
  return parsed as Record<string, string>;
}

function saveLastStatuses(guestExternalId: string, statuses: Record<string, string>): void {
  localStorage.setItem(scopedKey(LAST_STATUS_KEY, guestExternalId), JSON.stringify(statuses));
}

function loadSolvedShownIds(guestExternalId: string): string[] {
  const parsed = readJson<unknown>(scopedKey(SOLVED_SHOWN_KEY, guestExternalId), []);
  return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
}

function markSolvedShown(guestExternalId: string, id: string): void {
  const ids = loadSolvedShownIds(guestExternalId);
  if (ids.includes(id)) return;
  localStorage.setItem(
    scopedKey(SOLVED_SHOWN_KEY, guestExternalId),
    JSON.stringify([id, ...ids].slice(0, 50))
  );
}

export function seedServiceRequestStatus(
  guestExternalId: string,
  id: string,
  status: string = 'new'
): void {
  if (!guestExternalId || !id || id.startsWith('local-')) return;
  const last = loadLastStatuses(guestExternalId);
  last[id] = status;
  saveLastStatuses(guestExternalId, last);
}

export function diffServiceRequestStatuses(
  guestExternalId: string,
  requests: GuestServiceRequest[]
): ServiceRequestStatusChange[] {
  if (!guestExternalId) return [];

  const last = loadLastStatuses(guestExternalId);
  const next = { ...last };
  const changes: ServiceRequestStatusChange[] = [];
  let dirty = false;

  for (const request of requests) {
    if (!request.id) continue;
    const previous = last[request.id];
    if (previous === undefined) {
      next[request.id] = request.status;
      dirty = true;
      continue;
    }
    if (previous === request.status) continue;
    changes.push({ request, from: previous, to: request.status });
    next[request.id] = request.status;
    dirty = true;
  }

  if (dirty) saveLastStatuses(guestExternalId, next);
  return changes;
}

export function takeSolvedNotifications(
  guestExternalId: string,
  changes: ServiceRequestStatusChange[]
): GuestServiceRequest[] {
  const shown = new Set(loadSolvedShownIds(guestExternalId));
  const solved: GuestServiceRequest[] = [];

  for (const change of changes) {
    if (change.to !== 'solved' || shown.has(change.request.id)) continue;
    markSolvedShown(guestExternalId, change.request.id);
    shown.add(change.request.id);
    solved.push(change.request);
  }

  return solved;
}
