'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {readStore,writeStore,type StoreKey} from './supabase';
export function useCloudStore<T>(key:StoreKey,initial:T){
 const [value,setValue]=useState(initial);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const current=useRef(initial);const ready=useRef(false);const queue=useRef(Promise.resolve());
 const reload=useCallback(async()=>{try{const remote=await readStore<T>(key);current.current=remote;setValue(remote);ready.current=true;setError('')}catch(e){setError(e instanceof Error?e.message:'მონაცემები ვერ ჩაიტვირთა.')}finally{setLoading(false)}},[key]);
 useEffect(()=>{void reload();const refresh=()=>{if(document.visibilityState==='visible')void queue.current.then(reload)};document.addEventListener('visibilitychange',refresh);const timer=setInterval(refresh,30000);return()=>{document.removeEventListener('visibilitychange',refresh);clearInterval(timer)}},[reload]);
 const update=useCallback((next:T|((previous:T)=>T))=>{
  const operation=queue.current.then(async()=>{if(!ready.current)throw new Error('დაელოდეთ მონაცემების ჩატვირთვას.');const previous=current.current;const resolved=typeof next==='function'?(next as (p:T)=>T)(previous):next;await writeStore(key,resolved,previous);current.current=resolved;setValue(resolved);setError('')});
  queue.current=operation.catch(e=>{setError(e instanceof Error?e.message:'ცვლილება ვერ შეინახა.');});return operation;
 },[key]);
 return [value,update,{loading,error,reload}] as const;
}
