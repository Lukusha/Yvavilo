import type { AuthUser, Order, Recipient } from '@/types';
export type Session = { access_token: string; refresh_token?: string; expires_at?: number; user: AuthUser };
export type StoreKey = 'people' | 'orders' | 'deliveries' | 'notifications' | 'occasions' | 'reminder';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const sessionKey = 'yvavilo-auth-v1';
export const supabaseConfigured = Boolean(url && key);
type AuthResponse = { access_token: string; refresh_token?: string; expires_in?: number; user: {id:string;email?:string;user_metadata?:{name?:string}} };
export async function request<T>(path:string, options:RequestInit={}, token?:string):Promise<T> {
 if(!url||!key) throw new Error('სერვისი ჯერ არ არის დაკავშირებული. სცადეთ მოგვიანებით.');
 const headers=new Headers(options.headers);headers.set('apikey',key);
 if(token)headers.set('Authorization',`Bearer ${token}`);
 if(options.body&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
 const response=await fetch(`${url}${path}`,{...options,headers});
 const raw=await response.text();let body:any=null;try{body=raw?JSON.parse(raw):null}catch{body=raw}
 if(!response.ok)throw Object.assign(new Error(body?.msg||body?.message||body?.error_description||'მოთხოვნა ვერ შესრულდა. სცადეთ ხელახლა.'),{status:response.status});
 return body as T;
}
function saveSession(session:Session|null){if(typeof window==='undefined')return;if(session)localStorage.setItem(sessionKey,JSON.stringify(session));else localStorage.removeItem(sessionKey);window.dispatchEvent(new Event('auth-change'))}
function readSession():Session|null{if(typeof window==='undefined')return null;try{return JSON.parse(localStorage.getItem(sessionKey)||'null')}catch{return null}}
function normalize(data:AuthResponse):Session{return {access_token:data.access_token,refresh_token:data.refresh_token,expires_at:Date.now()+(data.expires_in||3600)*1000,user:{id:data.user.id,email:data.user.email||'',name:data.user.user_metadata?.name||data.user.email?.split('@')[0]||'მეგობარო'}}}
let sessionPromise:Promise<Session|null>|null=null;
export async function getSession():Promise<Session|null>{
 if(sessionPromise)return sessionPromise;
 sessionPromise=(async()=>{
  if(typeof window==='undefined'||!supabaseConfigured)return null;
  const fragment=new URLSearchParams(window.location.hash.slice(1));
  if(fragment.get('access_token')){
   const token=fragment.get('access_token')!;
   const user=await request<AuthResponse['user']>('/auth/v1/user',{},token);
   const next=normalize({access_token:token,refresh_token:fragment.get('refresh_token')||undefined,user});saveSession(next);
   if(fragment.get('type')==='recovery')sessionStorage.setItem('yvavilo-recovery','1');
   history.replaceState(null,'',window.location.pathname+window.location.search);return next;
  }
  const current=readSession();if(!current)return null;
  if(current.expires_at&&current.expires_at>Date.now()+60000)return current;
  if(current.refresh_token){
   try{const next=normalize(await request<AuthResponse>('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:current.refresh_token})}));saveSession(next);return next}
   catch(error){if(![400,401,403].includes((error as {status?:number}).status||0))throw error;saveSession(null);return null}
  }
  try{const user=await request<AuthResponse['user']>('/auth/v1/user',{},current.access_token);const next=normalize({access_token:current.access_token,user});saveSession(next);return next}catch{saveSession(null);return null}
 })();try{return await sessionPromise}finally{sessionPromise=null}
}
export async function requireSession(){const session=await getSession();if(!session)throw new Error('გთხოვთ, ხელახლა შეხვიდეთ ანგარიშში.');return session}
export async function signUp(email:string,password:string,name:string){const data=await request<AuthResponse>('/auth/v1/signup',{method:'POST',body:JSON.stringify({email,password,data:{name}})});const session=data.access_token?normalize(data):null;if(session)saveSession(session);return {session,needsEmailConfirmation:!session}}
export async function signIn(email:string,password:string){const session=normalize(await request<AuthResponse>('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})}));saveSession(session);return session}
export async function signOut(){
 const session=await getSession();
 if(session&&'serviceWorker'in navigator){const registration=await navigator.serviceWorker.getRegistration('/');const subscription=await registration?.pushManager?.getSubscription();if(subscription){await request(`/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(subscription.endpoint)}`,{method:'DELETE'},session.access_token);await subscription.unsubscribe()}}
 if(session)await request('/auth/v1/logout',{method:'POST'},session.access_token);
 saveSession(null);photoCache.clear();window.location.assign('/')
}
export async function resetPassword(email:string){await request(`/auth/v1/recover?redirect_to=${encodeURIComponent(window.location.origin+'/account')}`,{method:'POST',body:JSON.stringify({email})})}
export async function updatePassword(password:string){const session=await requireSession();await request('/auth/v1/user',{method:'PUT',body:JSON.stringify({password})},session.access_token);sessionStorage.removeItem('yvavilo-recovery')}
export async function rpc<T>(name:string,args:Record<string,unknown>={}){const session=await requireSession();return request<T>(`/rest/v1/rpc/${name}`,{method:'POST',body:JSON.stringify(args)},session.access_token)}
const tables:Record<StoreKey,string>={people:'recipients',orders:'orders',deliveries:'deliveries',notifications:'notifications',occasions:'occasions',reminder:'user_settings'};
export async function readStore<T>(store:StoreKey):Promise<T>{
 const session=await requireSession();const fields=store==='reminder'?'data':'id,data';
 const rows=await request<Array<{id:string;data:any}>>(`/rest/v1/${tables[store]}?select=${fields}&user_id=eq.${session.user.id}${store==='reminder'?'':'&order=created_at.asc'}`,{},session.access_token);
 return (store==='reminder'?rows[0]?.data??null:rows.map(row=>({...row.data,id:row.id}))) as T;
}
export async function writeStore<T>(store:StoreKey,value:T,previous:T){
 if(store==='orders'||store==='deliveries')throw new Error('ცვლილება არ არის ნებადართული.');
 const session=await requireSession();const table=tables[store];
 if(store==='reminder'){await request(`/rest/v1/${table}`,{method:'POST',headers:{Prefer:'resolution=merge-duplicates'},body:JSON.stringify({user_id:session.user.id,data:value})},session.access_token);return}
 const items=value as Array<Record<string,any>>, before=previous as Array<Record<string,any>>;
 const removed=before.filter(item=>!items.some(next=>next.id===item.id));
 const changed=items.filter(item=>JSON.stringify(item)!==JSON.stringify(before.find(old=>old.id===item.id)));
 for(const item of changed){
  if(store==='notifications'){await request(`/rest/v1/${table}?id=eq.${encodeURIComponent(item.id)}&user_id=eq.${session.user.id}`,{method:'PATCH',body:JSON.stringify({data:item})},session.access_token);continue}
  const row={id:item.id,user_id:session.user.id,data:item,...(store==='people'?{}:{recipient_id:item.recipientId||null})};
  await request(`/rest/v1/${table}`,{method:'POST',headers:{Prefer:'resolution=merge-duplicates'},body:JSON.stringify(row)},session.access_token);
 }
 for(const item of removed)await request(`/rest/v1/${table}?id=eq.${encodeURIComponent(item.id)}&user_id=eq.${session.user.id}`,{method:'DELETE'},session.access_token);
}
export async function uploadProfilePhoto(dataUrl:string,recipientId:string){
 const session=await requireSession();const blob=await (await fetch(dataUrl)).blob();
 if(blob.size>5*1024*1024||!['image/jpeg','image/png','image/webp'].includes(blob.type))throw new Error('აირჩიეთ JPG, PNG ან WebP ფოტო, მაქსიმუმ 5 MB.');
 const path=`${session.user.id}/${recipientId}/${crypto.randomUUID()}.jpg`;
 await request(`/storage/v1/object/profile-photos/${path}`,{method:'POST',headers:{'Content-Type':blob.type},body:blob},session.access_token);
 return path;
}
const photoCache=new Map<string,{url:string;expires:number}>();
export async function photoUrl(path:string){
 if(path.startsWith('data:'))return path;
 const cached=photoCache.get(path);if(cached&&cached.expires>Date.now())return cached.url;
 const session=await requireSession();const data=await request<{signedURL:string}>(`/storage/v1/object/sign/profile-photos/${path}`,{method:'POST',body:JSON.stringify({expiresIn:3600})},session.access_token);
 const signed=`${url}/storage/v1${data.signedURL}`;photoCache.set(path,{url:signed,expires:Date.now()+3300000});return signed;
}
export async function saveRecipient(person:Recipient,custom?:{id?:string;name:string;date:string}){const saved={...person};if(saved.photo?.startsWith('data:'))saved.photo=await uploadProfilePhoto(saved.photo,saved.id);await rpc('save_person',{person:saved,custom_day:custom||null});return saved}
export async function submitOrder(order:Omit<Order,'status'|'createdAt'|'price'>){return rpc<Order>('place_order',{payload:order})}
