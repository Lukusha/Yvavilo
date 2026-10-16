'use client';
import {createContext,useContext,useEffect,useState} from 'react';
import {request,requireSession} from './supabase';
import type {Bouquet} from '@/types';
const Catalog=createContext<Bouquet[]>([]);
export const useBouquets=()=>useContext(Catalog);
export function CatalogProvider({children}:{children:React.ReactNode}){
 const [products,setProducts]=useState<Bouquet[]|null>(null);const [error,setError]=useState('');
 const load=async()=>{try{setError('');const session=await requireSession();const rows=await request<Array<{data:Bouquet;active:boolean}>>('/rest/v1/products?select=data,active&order=created_at.asc',{},session.access_token);setProducts(rows.map(r=>({...r.data,available:r.active})))}catch(e){setError(e instanceof Error?e.message:'კოლექცია ვერ ჩაიტვირთა.')}};
 useEffect(()=>{void load()},[]);
 if(error)return <div className="auth-loading"><p role="alert">{error}</p><button className="btn btn-primary" onClick={load}>ხელახლა ცდა</button></div>;
 if(!products)return <div className="auth-loading">კოლექცია იტვირთება...</div>;
 return <Catalog.Provider value={products}>{children}</Catalog.Provider>;
}
