'use client';
import {FormEvent,Fragment,useEffect,useRef,useState} from 'react';
import {Flower2,LoaderCircle,X} from 'lucide-react';
import {getSession,signIn,type Session} from '@/lib/backend';
import {usePathname} from '@/lib/navigation';
function AuthPanel({onAuthenticated,onClose}:{onAuthenticated:(s:Session)=>void;onClose?:()=>void}){
 const panel=useRef<HTMLElement>(null);
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{if(!onClose)return;const previous=document.activeElement as HTMLElement;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';panel.current?.querySelector<HTMLElement>('input,button')?.focus();const close=(event:KeyboardEvent)=>{if(event.key==='Escape')onClose();if(event.key==='Tab'){const nodes=panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,a[href]');if(!nodes?.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}};document.addEventListener('keydown',close);return()=>{document.removeEventListener('keydown',close);document.body.style.overflow=overflow;previous?.focus()}},[]);
 const submit=async(event:FormEvent)=>{event.preventDefault();setMessage('');setBusy(true);try{
  onAuthenticated(await signIn(email.trim(),password));
 }catch(e){setMessage(e instanceof Error?e.message:'მოთხოვნა ვერ შესრულდა. შეამოწმეთ კავშირი და სცადეთ ხელახლა.')}finally{setBusy(false)}};
 return <section ref={panel} className="auth-panel" role={onClose?'dialog':undefined} aria-modal={onClose?true:undefined} aria-labelledby="auth-heading">
 {onClose&&<button className="auth-close" onClick={onClose} aria-label="დახურვა"><X size={20}/></button>}
 <div className="auth-mark"><Flower2 size={25}/></div><span className="eyebrow">თქვენი პირადი სივრცე</span><h2 id="auth-heading">კეთილი დაბრუნება.</h2>
 <p>თქვენი ადამიანები, მნიშვნელოვანი დღეები და ყვავილები — ყოველთვის თქვენთან.</p>
 <form onSubmit={submit}>
 <label>ელფოსტა<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label>
 <label>პაროლი<input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/><small>მინიმუმ 8 სიმბოლო</small></label>
 {message&&<p className="auth-message" role="status">{message}</p>}
 <button className="btn btn-primary auth-submit" disabled={busy}>{busy?<LoaderCircle className="spin" size={18}/>: 'შესვლა'}</button>
 </form>
 <p className="auth-switch">ახალი ანგარიში შეკვეთის გაგზავნის შემდეგ იქმნება.</p>
 </section>;
}
export function AuthGate({children,landing=false,publicContent}:{children:React.ReactNode;landing?:boolean;publicContent?:React.ReactNode}){
 const pathname=usePathname();
 const [session,setSession]=useState<Session|null>(null),[checking,setChecking]=useState(true),[open,setOpen]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let active=true;const check=()=>getSession().then(s=>{if(active){setSession(s);setError('')}}).catch(()=>{if(active)setError('კავშირი ვერ დამყარდა. შეამოწმეთ ინტერნეტი.')}).finally(()=>{if(active)setChecking(false)});void check();const show=()=>{void getSession().then(current=>{if(current)window.location.assign('/dashboard');else setOpen(true)}).catch(()=>setOpen(true))};window.addEventListener('open-auth',show);window.addEventListener('storage',check);return()=>{active=false;window.removeEventListener('open-auth',show);window.removeEventListener('storage',check)}},[]);
 const authenticated=(s:Session)=>{setSession(s);setOpen(false);if(landing||publicContent)window.location.assign('/dashboard')};
 if(landing)return <>{children}{open&&<div className="auth-overlay"><AuthPanel onClose={()=>setOpen(false)} onAuthenticated={authenticated}/></div>}</>;
 if(checking)return <div className="auth-loading"><Flower2 size={34}/><p>თქვენი სივრცე იტვირთება...</p></div>;
 if(error)return <div className="auth-loading"><p role="alert">{error}</p><button className="btn btn-primary" onClick={()=>location.reload()}>ხელახლა ცდა</button></div>;
 const publicRoute=['/flowers','/send','/track','/support','/delivery','/terms','/privacy'].some(route=>pathname===route||pathname.startsWith(`${route}/`));
 const informationRoute=['/support','/delivery','/terms','/privacy'].includes(pathname);
 if(publicContent&&(informationRoute||!session&&publicRoute))return <>{publicContent}{open&&<div className="auth-overlay"><AuthPanel onClose={()=>setOpen(false)} onAuthenticated={authenticated}/></div>}</>;
 if(session)return <Fragment key={session.user.id}>{children}</Fragment>;
 return <div className="auth-page"><a className="auth-home" href="/">ყვავილო</a><AuthPanel onAuthenticated={authenticated}/></div>;
}
