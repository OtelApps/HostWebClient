import type { GuestIdentity } from '../../lib/guestIdentity';
import { getHotelSlug } from '../../lib/hotel';
import { getSupabase, supabaseConfigured } from '../../lib/supabase';

export async function upsertGuestCrmProfile(identity: GuestIdentity): Promise<void> {
  if (!supabaseConfigured || !identity.guest_external_id) return;

  const { error } = await getSupabase().rpc('upsert_guest_crm_profile', {
    p_hotel_slug: getHotelSlug(),
    p_guest_external_id: identity.guest_external_id,
    p_display_name: identity.guest_display_name,
    p_room_number: identity.room_number,
    p_email: identity.email ?? null,
    p_phone: identity.phone ?? null,
    p_locale: identity.locale ?? 'cs',
    p_segment: identity.segment ?? 'standard',
    p_check_in_at: identity.check_in_at ?? null,
    p_check_out_at: identity.check_out_at ?? null,
    p_marketing_consent: identity.marketing_consent ?? false,
    p_loyalty_points: identity.loyalty_points ?? 0,
    p_stay_count: identity.stay_count ?? 0,
    p_assigned_staff_name: identity.assigned_staff_name ?? null,
    p_company_name: identity.company_name ?? null,
    p_nationality: identity.nationality ?? null,
    p_reservation_number: identity.reservation_number ?? null,
  });

  if (error) {
    console.warn('[upsertGuestCrmProfile]', error.message);
  }
}
