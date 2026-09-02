-- Add explicit audit classifications for the signed-in admin toggle and for
-- corroborated, same-day reporting used by the custody monitor.

alter table public.deadman_incidents
  drop constraint if exists deadman_incidents_confirmation_type_check;

alter table public.deadman_incidents
  add constraint deadman_incidents_confirmation_type_check
  check (confirmation_type in (
    'official_booking_record',
    'filed_court_order',
    'attorney_or_designated_contact',
    'authenticated_contact_from_custody',
    'custodial_agency_confirmation',
    'credible_current_reporting',
    'authenticated_admin_confirmation'
  ));
