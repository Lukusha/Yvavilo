'use client';
import {useEffect,useState} from 'react';
import {Bell,CalendarDays} from 'lucide-react';
import type {Occasion} from '@/types';
import {nextDate} from '@/lib/flowers';
import {getSession,signOut,updatePassword} from '@/lib/backend';

export function CalendarExport({occasion}:{occasion:Occasion}){
 const download=()=>{const escape=(s:string)=>s.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');const d=nextDate(occasion.date);const day=`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;const body=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Yvavilo//KA','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:${occasion.id}@yvavilo`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`DTSTART;VALUE=DATE:${day}`,'RRULE:FREQ=YEARLY',`SUMMARY:${escape(occasion.name)}`,'BEGIN:VALARM','TRIGGER:-P1D','ACTION:DISPLAY',`DESCRIPTION:${escape(occasion.name)}`,'END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');const url=URL.createObjectURL(new Blob([body],{type:'text/calendar;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='yvavilo-date.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 return <button onClick={download} title="კალენდარში დამატება" aria-label={`${occasion.name} — კალენდარში დამატება`}><CalendarDays size={16}/></button>;
}
export function PushSettings(){
 return <div className="settings-card"><Bell size={24}/><div><h3>შეხსენებები თქვენს ანგარიშში</h3><p>მნიშვნელოვანი თარიღების შეხსენებები გამოჩნდება შეტყობინებების გვერდზე. ტელეფონის push შეტყობინებები შემდეგ ეტაპზე დაემატება.</p></div></div>;
}
export function AccountPanel(){
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{getSession().then(s=>{setName(s?.user.name||'');setEmail(s?.user.email||'')})},[]);
 return <><div className="page-intro"><div><span className="eyebrow">პირადი სივრცე</span><h1>{name}</h1><p>{email}</p></div></div><PushSettings/><form className="account-password" onSubmit={async e=>{e.preventDefault();setBusy(true);try{await updatePassword(password);setPassword('');setMessage('პაროლი შეიცვალა.')}catch{setMessage('პაროლი ვერ შეიცვალა. სცადეთ ხელახლა.')}finally{setBusy(false)}}}><h2>პაროლის შეცვლა</h2><label>ახალი პაროლი<input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="btn btn-primary" disabled={busy}>პაროლის შენახვა</button>{message&&<p role="status">{message}</p>}</form><button className="btn btn-secondary" onClick={()=>{void signOut().catch(()=>setMessage('გასვლა ვერ მოხერხდა. შეამოწმეთ კავშირი.'))}}>ანგარიშიდან გასვლა</button></>;
}
