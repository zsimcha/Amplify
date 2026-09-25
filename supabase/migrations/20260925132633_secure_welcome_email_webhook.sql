-- Documents drift that already existed in production but was never captured
-- as a tracked migration: the original "Welcome Email" trigger called
-- supabase_functions.http_request() directly with a hardcoded service_role
-- JWT in its Authorization header. It was replaced at some point via the
-- SQL editor with this Vault-backed version, which reads the webhook secret
-- from Supabase Vault instead of embedding it in the trigger definition.
-- Applying this again is a no-op on this database (CREATE OR REPLACE is
-- idempotent) — it exists so the migration history matches what's live and
-- so a fresh environment reconstructed from these migrations lands on the
-- same, secret-free definition.

CREATE OR REPLACE FUNCTION public.fire_welcome_email_webhook()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_secret text;
BEGIN
  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = 'welcome_email_webhook_secret';

  PERFORM net.http_post(
    url := 'https://gloncuhgefzrpuwbzoke.supabase.co/functions/v1/send-welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', v_secret
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(NEW)
    ),
    timeout_milliseconds := 5000
  );

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE TRIGGER "Welcome Email" AFTER INSERT ON public."Subscriptions" FOR EACH ROW EXECUTE FUNCTION fire_welcome_email_webhook();
