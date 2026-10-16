import { flowerLifespans } from '@/data/mock';
import type { Bouquet, FlowerDelivery, Occasion } from '@/types';
import { georgianDate } from '@/lib/locale';
export function estimatedDays(bouquet: Bouquet) { return Math.round(bouquet.stems.reduce((sum,s)=>sum+flowerLifespans[s.type]*s.weight,0)/bouquet.stems.reduce((sum,s)=>sum+s.weight,0)); }
export function flowerState(delivery: FlowerDelivery, bouquet: Bouquet, now = new Date()) {
 const lifespan = delivery.estimatedLifespanDays ?? estimatedDays(bouquet);
 const delivered = new Date(delivery.deliveredAt);
 const daysPassed = Math.max(0, Math.round((Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())-Date.UTC(delivered.getFullYear(),delivered.getMonth(),delivered.getDate()))/86400000));
 const percentage = Math.max(0, Math.round(100-(daysPassed/lifespan)*100));
 const daysRemaining = Math.max(0,lifespan-daysPassed);
 const status = percentage===0?'სავარაუდოდ, ყვავილობა დასრულდა':percentage<20?'ყვავილობის დასასრულს უახლოვდება':percentage<40?'ფერმკრთალდება':percentage<60?'ნელ-ნელა კარგავს სიახლეს':percentage<80?'ლამაზად ყვავის':'ახალია';
 const tone = percentage<20?'end':percentage<40?'fading':percentage<70?'aging':'fresh';
 return {lifespan,daysPassed,percentage,daysRemaining,status,tone};
}
export function nextDate(monthDay:string, now = new Date()) { const [month,day]=monthDay.split('-').map(Number); const date = new Date(now.getFullYear(),month-1,day,12); if(date.getTime()<new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime()) date.setFullYear(date.getFullYear()+1); return date; }
export function occasionDays(occasion: Occasion, now = new Date()) { const today = new Date(now.getFullYear(),now.getMonth(),now.getDate(),12); return Math.round((nextDate(occasion.date,now).getTime()-today.getTime())/86400000); }
export function formatDate(date:string|Date) { const local=typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)?new Date(Number(date.slice(0,4)),Number(date.slice(5,7))-1,Number(date.slice(8,10)),12):new Date(date); return georgianDate(local); }
