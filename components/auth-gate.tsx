'use client';
import {FormEvent,Fragment,useEffect,useRef,useState} from 'react';
import {Flower2,LoaderCircle,X} from 'lucide-react';
import {getSession,signIn,signUp,resetPassword,supabaseConfigured,type Session} from '@/lib/supabase';
type Mode='login'|'signup'|'reset';
function AuthPanel({mode:initial,onAuthenticated,onClose}:{mode:Mode;onAuthenticated:(s:Session)=>void;onClose?:()=>void}){
 const panel=useRef<HTMLElement>(null);
 const [mode,setMode]=useState(initial),[name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{if(!onClose)return;const previous=document.activeElement as HTMLElement;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';panel.current?.querySelector<HTMLElement>('input,button')?.focus();const close=(event:KeyboardEvent)=>{if(event.key==='Escape')onClose();if(event.key==='Tab'){const nodes=panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,a[href]');if(!nodes?.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}};document.addEventListener('keydown',close);return()=>{document.removeEventListener('keydown',close);document.body.style.overflow=overflow;previous?.focus()}},[]);
 const submit=async(event:FormEvent)=>{event.preventDefault();setMessage('');setBusy(true);try{
  if(mode==='reset'){await resetPassword(email.trim());setMessage('თუ ანგარიში არსებობს, აღდგენის ბმული ელფოსტაზე გამოიგზავნება.')}
  else if(mode==='signup'){if(!name.trim()){setMessage('მიუთითეთ თქვენი სახელი.');return}const result=await signUp(email.trim(),password,name.trim());if(result.session)onAuthenticated(result.session);else setMessage('რეგისტრაციის დასასრულებლად შეამოწმეთ ელფოსტა და დაადასტურეთ მისამართი.')}
  else onAuthenticated(await signIn(email.trim(),password));
 }catch(e){const error=e instanceof Error?e.message:'';setMessage(error.includes('Invalid login')?'ელფოსტა ან პაროლი არასწორია.':error.includes('Email not confirmed')?'ჯერ დაადასტურეთ ელფოსტა.':error.includes('rate limit')?'ძალიან ბევრი მცდელობაა. ცოტა ხანში სცადეთ.':'მოთხოვნა ვერ შესრულდა. შეამოწმეთ კავშირი და სცადეთ ხელახლა.')}finally{setBusy(false)}};
 return <section ref={panel} className="auth-panel" role={onClose?'dialog':undefined} aria-modal={onClose?true:undefined} aria-labelledby="auth-heading">
 {onClose&&<button className="auth-close" onClick={onClose} aria-label="დახურვა"><X size={20}/></button>}
 <div className="auth-mark"><Flower2 size={25}/></div><span className="eyebrow">თქვენი პირადი სივრცე</span><h2 id="auth-heading">{mode==='signup'?'ზრუნვა აქ იწყება.':mode==='reset'?'პაროლის აღდგენა.':'კეთილი დაბრუნება.'}</h2>
 <p>თქვენი ადამიანები, მნიშვნელოვანი დღეები და ყვავილები — ყოველთვის თქვენთან.</p>
 {!supabaseConfigured?<p role="status">რეგისტრაცია მალე გახდება ხელმისაწვდომი. სერვისის მომზადება მიმდინარეობს.</p>:<form onSubmit={submit}>
 {mode==='signup'&&<label>სახელი<input required maxLength={150} autoFocus value={name} onChange={e=>setName(e.target.value)} autoComplete="name"/></label>}
 <label>ელფოსტა<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label>
 {mode!=='reset'&&<label>პაროლი<input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==='signup'?'new-password':'current-password'}/><small>მინიმუმ 8 სიმბოლო</small></label>}
 {message&&<p className="auth-message" role="status">{message}</p>}
 <button className="btn btn-primary auth-submit" disabled={busy}>{busy?<LoaderCircle className="spin" size={18}/>:mode==='signup'?'ანგარიშის შექმნა':mode==='reset'?'ბმულის გაგზავნა':'შესვლა'}</button>
 </form>}
 <button className="auth-switch" onClick={()=>{setMode(mode==='login'?'signup':'login');setMessage('')}}>{mode==='login'?'ახალი ხართ? შექმენით ანგარიში':'უკვე გაქვთ ანგარიში? შედით'}</button>
 {mode==='login'&&<button className="auth-switch" onClick={()=>{setMode('reset');setMessage('')}}>დაგავიწყდათ პაროლი?</button>}
 </section>;
}
export function AuthGate({children,landing=false}:{children:React.ReactNode;landing?:boolean}){
 const [session,setSession]=useState<Session|null>(null),[checking,setChecking]=useState(true),[open,setOpen]=useState<Mode|null>(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;const check=()=>getSession().then(s=>{if(active){setSession(s);setError('')}}).catch(()=>{if(active)setError('კავშირი ვერ დამყარდა. შეამოწმეთ ინტერნეტი.')}).finally(()=>{if(active)setChecking(false)});void check();const show=(e:Event)=>{const mode=(e as CustomEvent<Mode>).detail||'signup';void getSession().then(current=>{if(current)window.location.assign('/dashboard');else setOpen(mode)}).catch(()=>setOpen(mode))};window.addEventListener('open-auth',show);window.addEventListener('storage',check);return()=>{active=false;window.removeEventListener('open-auth',show);window.removeEventListener('storage',check)}},[]);
 const authenticated=(s:Session)=>{setSession(s);setOpen(null);if(landing)window.location.assign('/dashboard')};
 if(landing)return <>{children}{open&&<div className="auth-overlay"><AuthPanel key={open} mode={open} onClose={()=>setOpen(null)} onAuthenticated={authenticated}/></div>}</>;
 if(checking)return <div className="auth-loading"><Flower2 size={34}/><p>თქვენი სივრცე იტვირთება...</p></div>;
 if(error)return <div className="auth-loading"><p role="alert">{error}</p><button className="btn btn-primary" onClick={()=>location.reload()}>ხელახლა ცდა</button></div>;
 if(session)return <Fragment key={session.user.id}>{children}</Fragment>;
 return <div className="auth-page"><a className="auth-home" href="/">ყვავილო</a><AuthPanel mode="login" onAuthenticated={authenticated}/></div>;
}
