'use client';
import {useEffect,useState} from 'react';
import {photoUrl} from '@/lib/supabase';
import type {Recipient} from '@/types';
export function RelationshipAvatar({recipient,size='normal'}:{recipient:Recipient;size?:'normal'|'large'|'small'}){
 const [src,setSrc]=useState('');useEffect(()=>{let active=true;setSrc('');const load=()=>{if(recipient.photo)photoUrl(recipient.photo).then(url=>{if(active)setSrc(url)}).catch(()=>{})};load();const timer=setInterval(load,3000000);return()=>{active=false;clearInterval(timer)}},[recipient.photo]);
 return <span className={`avatar avatar-${size}`} style={{background:recipient.color}}>{src?<img src={src} alt={recipient.name}/>:recipient.initials}</span>;
}
