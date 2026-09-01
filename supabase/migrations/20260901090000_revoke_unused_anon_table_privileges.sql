-- Keep public widget access limited to the explicitly granted RPC surface.
-- These tables are only used by authenticated company members.
revoke all privileges on table public.booking_availability_rules from anon;
revoke all privileges on table public.user_notification_preferences from anon;
