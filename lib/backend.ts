import type {AuthUser,Order,Recipient} from '@/types';

export type Session={access_token:string;user:AuthUser};
export type StoreKey='people'|'orders'|'deliveries'|'notifications'|'occasions'|'reminder';
async function api<T>(path:string,options:RequestInit={}):Promise<T>{
 const headers=new Headers(options.headers);
 if(options.body&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
 const response=await fetch(path,{...options,headers,credentials:'same-origin'});
 const raw=await response.text();let body:any=null;
 try{body=raw?JSON.parse(raw):null}catch{body=raw}
 if(!response.ok)throw Object.assign(new Error(body?.message||'მოთხოვნა ვერ შესრულდა. სცადეთ ხელახლა.'),{status:response.status});
 return body as T;
}

export async function request<T>(path:string,options:RequestInit={},_token?:string):Promise<T>{return api<T>(path,options)}
export async function getSession():Promise<Session|null>{
 try{return await api<Session>('/api/auth/session')}catch(error){if((error as {status?:number}).status===401)return null;throw error}
}
export async function requireSession(){const session=await getSession();if(!session)throw new Error('გთხოვთ, ხელახლა შეხვიდეთ ანგარიშში.');return session}
export async function signUp(email:string,password:string,name:string,claimToken?:string){const session=await api<Session>('/api/auth/signup',{method:'POST',body:JSON.stringify({email,password,name,...(claimToken?{claimToken}:{})})});window.dispatchEvent(new Event('auth-change'));return {session,needsEmailConfirmation:false}}
export async function signIn(email:string,password:string){const session=await api<Session>('/api/auth/login',{method:'POST',body:JSON.stringify({email,password})});window.dispatchEvent(new Event('auth-change'));return session}
export async function signOut(){await api('/api/auth/logout',{method:'POST'});window.dispatchEvent(new Event('auth-change'));window.location.assign('/')}
export async function resetPassword(){throw new Error('პაროლის ელფოსტით აღდგენა ჯერ არ არის ჩართული. ანგარიშში შესვლის შემდეგ პაროლის შეცვლა შეგიძლიათ.')}
export async function updatePassword(password:string){await api('/api/auth/password',{method:'PUT',body:JSON.stringify({password})})}

export async function readStore<T>(store:StoreKey):Promise<T>{return api<T>(`/api/store/${store}`)}
export async function writeStore<T>(store:StoreKey,value:T,_previous:T){await api(`/api/store/${store}`,{method:'PUT',body:JSON.stringify({value})})}
export async function photoUrl(path:string){return path}
export async function saveRecipient(person:Recipient,custom?:{id?:string;name:string;date:string}){return api<Recipient>('/api/people',{method:'POST',body:JSON.stringify({person,custom:custom||null})})}
export async function submitOrder(order:Omit<Order,'status'|'createdAt'|'price'>){return api<Order>('/api/orders',{method:'POST',body:JSON.stringify(order)})}
export type GuestOrderInput={id:string;bouquetId:string;occasion:string;message:string;deliveryDate:string;deliveryTime:string;zone:string;address:string;recipientName:string;recipientPhone:string;customerName:string;customerEmail:string;customerPhone:string};
export async function submitGuestOrder(order:GuestOrderInput){return api<{order:Order;claimToken:string}>('/api/guest/orders',{method:'POST',body:JSON.stringify(order)})}
export async function trackGuestOrder(id:string,token:string){return api<Order>(`/api/guest/orders/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`)}
export async function claimGuestOrder(token:string){return api<{ok:boolean;orderId:string}>('/api/guest/claim',{method:'POST',body:JSON.stringify({token})})}
export async function sendSupportRequest(input:{name:string;email:string;phone:string;orderId:string;message:string}){return api<{ok:boolean;id:string}>('/api/support',{method:'POST',body:JSON.stringify(input)})}
export async function rpc<T>(name:string,args:Record<string,unknown>={}){return api<T>(`/api/rpc/${encodeURIComponent(name)}`,{method:'POST',body:JSON.stringify(args)})}
