import { getHotelSlug } from '../../lib/hotel';
import { getGuestIdentity } from '../../lib/guestIdentity';
import { getSupabase, supabaseConfigured } from '../../lib/supabase';
import { SupabaseTables } from './tables';

export type ServiceModuleKey =
  | 'amenities'
  | 'laundry'
  | 'issues_repairs'
  | 'room_service'
  | 'restaurants_bars'
  | 'relax_sport'
  | 'wellness_spa'
  | 'parking'
  | 'concierge';

export type ServiceRequestLineItem = {
  id: string;
  name: string;
  count: number;
  icon?: string;
  price?: number;
  desc?: string;
};

export type CreateServiceRequestInput = {
  service_module: ServiceModuleKey;
  request_text: string;
  guest_note?: string;
  metadata?: Record<string, unknown>;
  guest_locale?: string;
  source_entity_type?: string;
  source_entity_slug?: string;
};

export type CreateServiceRequestResult = {
  id: string;
  request_number: string | null;
};

export type GuestServiceRequest = {
  id: string;
  request_number: string | null;
  service_module: string;
  service_label: string;
  service_icon: string;
  request_text: string;
  status: string;
  status_guest_note: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

const SERVICE_TYPE_FALLBACK: Record<ServiceModuleKey, { label: string; icon_name: string }> = {
  amenities: { label: 'Amenities', icon_name: 'bed' },
  laundry: { label: 'Housekeeping', icon_name: 'cleaning_services' },
  issues_repairs: { label: 'Maintenance', icon_name: 'build' },
  room_service: { label: 'Room service', icon_name: 'room_service' },
  restaurants_bars: { label: 'Restaurants', icon_name: 'restaurant' },
  relax_sport: { label: 'Sports', icon_name: 'fitness_center' },
  wellness_spa: { label: 'Wellness', icon_name: 'spa' },
  parking: { label: 'Parking', icon_name: 'local_parking' },
  concierge: { label: 'Concierge', icon_name: 'support_agent' },
};

async function getDefaultHotelId(): Promise<string | null> {
  if (!supabaseConfigured) return null;

  const { data, error } = await getSupabase()
    .from(SupabaseTables.hotels)
    .select('id')
    .eq('slug', getHotelSlug())
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

async function resolveServiceType(
  moduleKey: ServiceModuleKey,
  hotelId: string
): Promise<{
  label: string;
  icon_name: string;
}> {
  if (!supabaseConfigured) return SERVICE_TYPE_FALLBACK[moduleKey];

  const { data, error } = await getSupabase()
    .from(SupabaseTables.hotelServiceRequestTypes)
    .select('label, icon_name')
    .eq('hotel_id', hotelId)
    .eq('module_key', moduleKey)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return data ?? SERVICE_TYPE_FALLBACK[moduleKey];
}

export function formatItemsRequestText(items: ServiceRequestLineItem[]): string {
  return items
    .map((item) => (item.count > 1 ? `${item.name} (${item.count}×)` : item.name))
    .join(', ');
}

export function buildAmenitiesMetadata(items: ServiceRequestLineItem[]) {
  return {
    items: items.map((item) => ({
      slug: item.id,
      name: item.name,
      quantity: item.count,
    })),
  };
}

export function buildLaundryMetadata(categorySlug: string, itemSlug: string, itemName: string) {
  return {
    items: [
      {
        slug: itemSlug,
        name: itemName,
        quantity: 1,
        category_slug: categorySlug,
      },
    ],
  };
}

export function buildMaintenanceMetadata(
  categorySlug: string,
  itemSlug: string,
  itemLabel: string
) {
  return {
    category_slug: categorySlug,
    item_slug: itemSlug,
    item_label: itemLabel,
  };
}

export function buildRoomServiceMetadata(
  menuSlug: string,
  items: ServiceRequestLineItem[],
  totalAmount: number
) {
  return {
    menu_slug: menuSlug,
    total_amount: totalAmount,
    items: items.map((item) => ({
      slug: item.id,
      name: item.name,
      quantity: item.count,
      unit_price: item.price ?? 0,
      options: item.desc ?? null,
    })),
  };
}

export async function createHotelServiceRequest(
  input: CreateServiceRequestInput
): Promise<CreateServiceRequestResult | null> {
  if (!supabaseConfigured) return null;

  const hotelId = await getDefaultHotelId();
  if (!hotelId) {
    throw new Error('Hotel nenalezen v databázi.');
  }

  const [guest, serviceType] = await Promise.all([
    getGuestIdentity(),
    resolveServiceType(input.service_module, hotelId),
  ]);

  const guestNote = input.guest_note?.trim();
  const guestLocale = input.guest_locale ?? guest.locale ?? 'cs';

  const rpcPayload = {
    p_hotel_slug: getHotelSlug(),
    p_service_module: input.service_module,
    p_service_label: serviceType.label,
    p_service_icon: serviceType.icon_name,
    p_request_text: input.request_text,
    p_guest_display_name: guest.guest_display_name,
    p_room_number: guest.room_number,
    p_guest_external_id: guest.guest_external_id,
    p_guest_locale: guestLocale,
    p_status_guest_note: guestNote || null,
    p_metadata: input.metadata ?? {},
    p_source_entity_type: input.source_entity_type ?? null,
    p_source_entity_slug: input.source_entity_slug ?? null,
    p_guest_email: guest.email ?? null,
    p_guest_phone: guest.phone ?? null,
  };

  const { data, error } = await getSupabase().rpc('create_guest_service_request', rpcPayload);

  if (!error) {
    const row = Array.isArray(data) ? data[0] : data;
    if (row) {
      return {
        id: row.id,
        request_number: row.request_number,
      };
    }
  }

  const rpcMissing =
    error?.code === 'PGRST202' || (error?.message ?? '').includes('Could not find the function');

  if (!rpcMissing) {
    throw error;
  }

  const { error: insertError } = await getSupabase()
    .from(SupabaseTables.hotelServiceRequests)
    .insert({
      hotel_id: hotelId,
      service_module: input.service_module,
      service_label: serviceType.label,
      service_icon: serviceType.icon_name,
      request_text: input.request_text,
      guest_display_name: guest.guest_display_name,
      room_number: guest.room_number,
      guest_external_id: guest.guest_external_id,
      guest_locale: guestLocale,
      guest_email: guest.email ?? null,
      guest_phone: guest.phone ?? null,
      status_guest_note: guestNote || null,
      metadata: input.metadata ?? {},
      source_entity_type: input.source_entity_type ?? null,
      source_entity_slug: input.source_entity_slug ?? null,
      created_via: 'web_app',
    });

  if (insertError) {
    throw new Error(insertError.message);
  }

  return {
    id: '',
    request_number: null,
  };
}

export async function fetchGuestServiceRequests(): Promise<GuestServiceRequest[]> {
  if (!supabaseConfigured) return [];

  const guest = await getGuestIdentity();

  const { data, error } = await getSupabase().rpc('get_guest_service_requests', {
    p_guest_external_id: guest.guest_external_id,
  });

  if (error) throw error;

  return (data ?? []).map((row: GuestServiceRequest) => ({
    ...row,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
  }));
}
