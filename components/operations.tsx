'use client';
import {useEffect,useState} from 'react';
import type {Order} from '@/types';
import {rpc} from '@/lib/backend';
import {orderStatusLabel} from '@/lib/locale';
type StaffOrder=Order&{customerEmail:string;customerName:string};
export function Operations(){
 const [orders,setOrders]=useState<StaffOrder[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState('');
 const load=async()=>{try{setOrders(await rpc<StaffOrder[]>('staff_orders'));setError('')}catch(e){setError(e instanceof Error?e.message:'წვდომა შეზღუდულია.')}};
 useEffect(()=>{void load()},[]);
 const update=async(order:StaffOrder,status:string)=>{if(!confirm(status==='Delivered'?'ნამდვილად მიიტანეთ თაიგული?':'დაადასტურეთ სტატუსის ცვლილება.'))return;setBusy(order.id);try{await rpc('fulfill_order',{order_id:order.id,next_status:status});await load()}catch(e){setError(e instanceof Error?e.message:'ცვლილება ვერ შესრულდა.')}finally{setBusy('')}};
 return <><div className="page-intro"><div><span className="eyebrow">მართვა</span><h1>შეკვეთების მართვა</h1><p>დაადასტურეთ მოთხოვნები და განაახლეთ მიწოდების რეალური სტატუსი.</p></div><button className="btn btn-secondary" onClick={load}>განახლება</button></div>{error&&<p className="cloud-error" role="alert">{error}</p>}{orders.map(order=><article className="operations-card" key={order.id}><div><h3>{order.bouquetName} · {order.price} ₾</h3><p>{order.customerName} · {order.customerEmail}</p><p>მიმღები: {order.recipientName}</p><p>{order.address} · {order.deliveryDate}</p><p>{order.message}</p><strong>{orderStatusLabel(order.status)}</strong></div><div>{order.status==='Pending'&&<button className="btn btn-primary" disabled={!!busy} onClick={()=>update(order,'Confirmed')}>დადასტურება</button>}{order.status==='Confirmed'&&<button className="btn btn-primary" disabled={!!busy} onClick={()=>update(order,'Delivered')}>მიტანილია</button>}{['Pending','Confirmed'].includes(order.status)&&<button className="btn btn-secondary" disabled={!!busy} onClick={()=>update(order,'Cancelled')}>გაუქმება</button>}</div></article>)}{!orders.length&&!error&&<p>შეკვეთები ჯერ არ არის.</p>}</>;
}
