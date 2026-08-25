import { useCallback, useState } from 'react';

import { useServiceRequests } from '../contexts/ServiceRequestContext';
import { getServiceModuleLabel } from '../services/supabase/serviceRequestUi';
import {
  createHotelServiceRequest,
  type CreateServiceRequestInput,
} from '../services/supabase/serviceRequests';

export function useSubmitServiceRequest() {
  const { trackRequest, refresh } = useServiceRequests();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (input: CreateServiceRequestInput) => {
      setSubmitting(true);
      setError(null);
      try {
        const result = await createHotelServiceRequest(input);
        if (!result) {
          setError('Supabase není nakonfigurováno.');
          return null;
        }
        trackRequest({
          id: result.id || `local-${Date.now()}`,
          request_number: result.request_number,
          service_module: input.service_module,
          service_label: getServiceModuleLabel(input.service_module),
          service_icon: 'help',
          request_text: input.request_text,
          status: 'new',
          status_guest_note: input.guest_note ?? null,
          metadata: (input.metadata ?? {}) as Record<string, unknown>,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        void refresh();
        return result;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Nepodařilo se odeslat požadavek.';
        setError(message);
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [refresh, trackRequest]
  );

  return { submit, submitting, error, setError };
}
