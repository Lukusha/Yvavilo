-- Run AFTER configuring the send-reminders Edge Function and adding two Vault secrets:
-- yvavilo_function_url = https://YOUR_PROJECT.supabase.co/functions/v1/send-reminders
-- yvavilo_cron_secret = the same random secret used for REMINDER_CRON_SECRET
-- Add secrets through the Supabase Vault UI. Do not commit their values.
create extension if not exists pg_cron;
create extension if not exists pg_net;
do $$ begin
 if exists(select 1 from cron.job where jobname='yvavilo-reminders') then perform cron.unschedule('yvavilo-reminders');end if;
end $$;
select cron.schedule('yvavilo-reminders','*/10 * * * *',$job$
 select net.http_post(
  url := (select decrypted_secret from vault.decrypted_secrets where name='yvavilo_function_url'),
  headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='yvavilo_cron_secret')),
  body := '{}'::jsonb,
  timeout_milliseconds := 30000
 );
$job$);
