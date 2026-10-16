'use client';
import {useSyncExternalStore,type AnchorHTMLAttributes} from 'react';
const subscribe=(listener:()=>void)=>{window.addEventListener('popstate',listener);return()=>window.removeEventListener('popstate',listener)};
const snapshot=()=>window.location.pathname+window.location.search;
const serverSnapshot=()=>'/dashboard';
function push(href:string){if(href==='/'){window.location.assign(href);return}window.history.pushState(null,'',href);window.dispatchEvent(new PopStateEvent('popstate'));window.scrollTo({top:0,behavior:'instant'})}
export function useLocation(){return useSyncExternalStore(subscribe,snapshot,serverSnapshot)}
export function usePathname(){return useSyncExternalStore(subscribe,snapshot,serverSnapshot).split('?')[0]}
export function useRouter(){return {push}}
export default function Link({href,onClick,...props}:AnchorHTMLAttributes<HTMLAnchorElement>&{href:string}){return <a {...props} href={href} onClick={event=>{onClick?.(event);if(!event.defaultPrevented&&href.startsWith('/')&&href!=='/'&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey&&event.button===0&&props.target!=='_blank'){event.preventDefault();push(href)}}}/>}
