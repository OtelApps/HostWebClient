import type { ServiceModuleKey } from './serviceRequests';

export type ServiceRequestStatus =
  | 'new'
  | 'pending'
  | 'in_progress'
  | 'solved'
  | 'rejected'
  | 'archived';

export type ServiceRequestStatusStyle = {
  labelKey: string;
  ringColor: string;
  backgroundColor: string;
};

const STATUS_STYLES: Record<ServiceRequestStatus, ServiceRequestStatusStyle> = {
  new: { labelKey: 'statusNew', ringColor: '#4285F4', backgroundColor: '#E8F0FE' },
  pending: { labelKey: 'statusPending', ringColor: '#F9AB00', backgroundColor: '#FFF8E1' },
  in_progress: { labelKey: 'statusInProgress', ringColor: '#FF9800', backgroundColor: '#FFF3E0' },
  solved: { labelKey: 'statusSolved', ringColor: '#43A047', backgroundColor: '#E8F5E9' },
  rejected: { labelKey: 'statusRejected', ringColor: '#EF5350', backgroundColor: '#FFEBEE' },
  archived: { labelKey: 'statusArchived', ringColor: '#9E9E9E', backgroundColor: '#F5F5F5' },
};

export function getServiceRequestStatusStyle(status: string): ServiceRequestStatusStyle {
  if (status in STATUS_STYLES) {
    return STATUS_STYLES[status as ServiceRequestStatus];
  }
  return STATUS_STYLES.new;
}

export function isActiveServiceRequestStatus(status: string): boolean {
  return status === 'new' || status === 'pending' || status === 'in_progress';
}

/** Jak dlouho po dokončení zůstane požadavek nahoře na hubu, dokud nedorazí další. */
export const RECENT_DONE_MS = 60 * 60 * 1000;

export function getRecentDoneRequest<T extends { status: string; updated_at: string }>(
  requests: T[],
  now = Date.now()
): T | null {
  let latest: T | null = null;
  let latestAt = 0;

  for (const request of requests) {
    if (request.status !== 'solved') continue;
    const at = Date.parse(request.updated_at);
    if (!Number.isFinite(at) || now - at >= RECENT_DONE_MS) continue;
    if (at > latestAt) {
      latest = request;
      latestAt = at;
    }
  }

  return latest;
}

const MODULE_LABELS: Partial<Record<ServiceModuleKey, string>> = {
  amenities: 'suppliesShort',
  laundry: 'housekeeping',
  issues_repairs: 'maintenanceShort',
  room_service: 'roomServiceShort',
};

export function getServiceModuleLabelKey(serviceModule: string): string {
  return MODULE_LABELS[serviceModule as ServiceModuleKey] ?? 'requests';
}

/** Fallback when i18n is not available (submit hook). */
export function getServiceModuleLabel(serviceModule: string): string {
  const map: Partial<Record<ServiceModuleKey, string>> = {
    amenities: 'Doplňky',
    laundry: 'Úklid',
    issues_repairs: 'Údržba',
    room_service: 'Pokojová služba',
  };
  return map[serviceModule as ServiceModuleKey] ?? 'Požadavek';
}
