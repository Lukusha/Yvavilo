'use client';
import {useEffect,useState} from 'react';
import {Bell,CalendarDays} from 'lucide-react';
import type {Occasion} from '@/types';
import {nextDate} from '@/lib/flowers';
import {getSession,requireSession,request,signOut,updatePassword} from '@/lib/supabase';

export function CalendarExport({occasion}:{occasion:Occasion}){
 const download=()=>{const escape=(s:string)=>s.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');const d=nextDate(occasion.date);const day=`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;const body=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Yvavilo//KA','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:${occasion.id}@yvavilo`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`DTSTART;VALUE=DATE:${day}`,'RRULE:FREQ=YEARLY',`SUMMARY:${escape(occasion.name)}`,'BEGIN:VALARM','TRIGGER:-P1D','ACTION:DISPLAY',`DESCRIPTION:${escape(occasion.name)}`,'END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');const url=URL.createObjectURL(new Blob([body],{type:'text/calendar;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='yvavilo-date.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 return <button onClick={download} title="კალენდარში დამატება" aria-label={`${occasion.name} — კალენდარში დამატება`}><CalendarDays size={16}/></button>;
}
export function PushSettings(){
 const [enabled,setEnabled]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const vapid=process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
 useEffect(()=>{if('serviceWorker'in navigator)navigator.serviceWorker.getRegistration('/').then(r=>r?.pushManager?.getSubscription()).then(s=>setEnabled(!!s)).catch(()=>{})},[]);
 const toggle=async()=>{setBusy(true);setMessage('');try{
  if(!('serviceWorker'in navigator)||!('PushManager'in window)||!('Notification'in window))throw new Error('ამ ბრაუზერში შეტყობინებები მიუწვდომელია. iPhone-ზე საიტი მთავარ ეკრანზე დაამატეთ და იქიდან გახსენით.');
  if(!vapid)throw new Error('შეტყობინებების სერვისი ჯერ არ არის ჩართული.');
  const session=await requireSession();
  await navigator.serviceWorker.register('/sw.js');const registration=await navigator.serviceWorker.ready;
  let subscription=await registration.pushManager.getSubscription();
  if(enabled&&subscription){await request(`/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(subscription.endpoint)}`,{method:'DELETE'},session.access_token);await subscription.unsubscribe();setEnabled(false);return}
  if(await Notification.requestPermission()!=='granted')throw new Error('შეტყობინებების ნებართვა არ არის ჩართული. შეცვალეთ ბრაუზერის პარამეტრებში.');
  const raw=atob(vapid.replace(/-/g,'+').replace(/_/g,'/'));const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
  subscription=subscription||await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes});
  await request('/rest/v1/push_subscriptions?on_conflict=endpoint',{method:'POST',headers:{Prefer:'resolution=merge-duplicates'},body:JSON.stringify({user_id:session.user.id,endpoint:subscription.endpoint,subscription:subscription.toJSON()})},session.access_token);setEnabled(true);setMessage('შეხსენებები ჩართულია ამ მოწყობილობაზე.');
 }catch(e){setMessage(e instanceof Error?e.message:'შეტყობინებები ვერ ჩაირთო.')}finally{setBusy(false)}};
 return <div className="settings-card"><Bell size={24}/><div><h3>მნიშვნელოვანი დღე არ გამოგრჩეთ.</h3><p>მიიღეთ შეხსენება ამ მოწყობილობაზე. iPhone-ზე გახსენით მთავარ ეკრანზე დამატებული საიტიდან.</p>{message&&<p role="status">{message}</p>}</div><button className="btn btn-secondary" disabled={busy} onClick={toggle}>{busy?'დაელოდეთ...':enabled?'შეტყობინებების გამორთვა':'შეტყობინებების ჩართვა'}</button></div>;
}
export function AccountPanel(){
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{getSession().then(s=>{setName(s?.user.name||'');setEmail(s?.user.email||'')})},[]);
 return <><div className="page-intro"><div><span className="eyebrow">პირადი სივრცე</span><h1>{name}</h1><p>{email}</p></div></div><PushSettings/><form className="account-password" onSubmit={async e=>{e.preventDefault();setBusy(true);try{await updatePassword(password);setPassword('');setMessage('პაროლი შეიცვალა.')}catch{setMessage('პაროლი ვერ შეიცვალა. სცადეთ ხელახლა.')}finally{setBusy(false)}}}><h2>პაროლის შეცვლა</h2><label>ახალი პაროლი<input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="btn btn-primary" disabled={busy}>პაროლის შენახვა</button>{message&&<p role="status">{message}</p>}</form><button className="btn btn-secondary" onClick={()=>{void signOut().catch(()=>setMessage('გასვლა ვერ მოხერხდა. შეამოწმეთ კავშირი.'))}}>ანგარიშიდან გასვლა</button></>;
}
