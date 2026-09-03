export const MODULE_PARENTS: Record<string, string> = {
  concierge_chat: 'concierge',
};

export const REQUEST_HUB_MODULES = [
  'requests',
  'laundry',
  'amenities',
  'issues_repairs',
  'room_service',
] as const;

export function isModuleEnabled(
  modules: Record<string, boolean> | null | undefined,
  key: string
): boolean {
  if (!modules) {
    return false;
  }
  if (modules[key] !== true) {
    return false;
  }
  const parent = MODULE_PARENTS[key];
  if (parent && modules[parent] !== true) {
    return false;
  }
  return true;
}

export function isAnyModuleEnabled(
  modules: Record<string, boolean> | null | undefined,
  keys: readonly string[]
): boolean {
  return keys.some((key) => isModuleEnabled(modules, key));
}
