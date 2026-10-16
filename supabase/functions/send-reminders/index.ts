// Deploy separately with the Supabase CLI; this is a Deno Edge Function.
import webpush from 'npm:web-push@3.6.7';
const allowedEndpoint=(endpoint:string)=>{try{const u=new URL(endpoint);return u.protocol==='https:'&&u.port===''&&(u.hostname==='fcm.googleapis.com'||u.hostname==='updates.push.services.mozilla.com'||u.hostname.endsWith('.push.services.mozilla.com')||u.hostname==='web.push.apple.com'||u.hostname.endsWith('.push.apple.com')||u.hostname.endsWith('.notify.windows.com'))}catch{return false}};
Deno.serve(async(req:Request)=>{
 if(req.method!=='POST')return new Response('Method not allowed',{status:405});
 const secret=Deno.env.get('REMINDER_CRON_SECRET');
 if(!secret||req.headers.get('x-cron-secret')!==secret)return new Response('Unauthorized',{status:401});
 const origin=Deno.env.get('SUPABASE_URL')!,serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
 const api=async(path:string,options:RequestInit={})=>{const response=await fetch(`${origin}/rest/v1/${path}`,{...options,headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,'Content-Type':'application/json',...options.headers}});if(!response.ok)throw new Error(`Database request failed: ${response.status}`);const text=await response.text();return text?JSON.parse(text):null};
 try{
  await api('rpc/enqueue_reminders',{method:'POST',body:'{}'});
  const publicKey=Deno.env.get('VAPID_PUBLIC_KEY'),privateKey=Deno.env.get('VAPID_PRIVATE_KEY'),contact=Deno.env.get('VAPID_CONTACT');
  if(!publicKey||!privateKey||!contact)return Response.json({error:'Push sender not configured; in-app reminders generated.'},{status:503});
  webpush.setVapidDetails(contact,publicKey,privateKey);
  const jobs=await api('rpc/claim_push_jobs',{method:'POST',body:'{}'});
  let sent=0,failed=0;
  await Promise.all(jobs.map(async(job:any)=>{
   const subscription=job.subscription;
   if(!subscription||!allowedEndpoint(subscription.endpoint)){failed++;await api(`push_subscriptions?id=eq.${job.subscription_id}`,{method:'DELETE'});return}
   try{await webpush.sendNotification(subscription,JSON.stringify(job.payload),{TTL:86400,timeout:10000});await api(`push_jobs?id=eq.${job.id}`,{method:'PATCH',body:JSON.stringify({sent_at:new Date().toISOString()})});sent++}
   catch(error){failed++;if([404,410].includes((error as {statusCode:number}).statusCode))await api(`push_subscriptions?id=eq.${job.subscription_id}`,{method:'DELETE'})}
  }));
  return Response.json({sent,failed});
 }catch{return Response.json({error:'Reminder delivery failed; inspect function logs and configuration.'},{status:500})}
});
