import type {BagItem,Bouquet,BouquetCustom,BouquetSize} from '@/types';

export const bagStorageKey='yvavilo-bag-v1';
export const sizeOptions:{id:BouquetSize;label:string;multiplier:number}[]=[
 {id:'standard',label:'სტანდარტული',multiplier:1},
 {id:'grand',label:'დიდი',multiplier:1.35},
 {id:'signature',label:'განსაკუთრებული',multiplier:1.7}
];
export const accentOptions:{id:BouquetCustom['accent'];label:string;price:number}[]=[
 {id:'none',label:'აქცენტის გარეშე',price:0},
 {id:'rose',label:'ვარდები',price:12},
 {id:'lily',label:'შროშანები',price:18},
 {id:'peony',label:'პიონები',price:24}
];
export const wrappingOptions:{id:BouquetCustom['wrapping'];label:string;price:number}[]=[
 {id:'ivory',label:'სპილოსძვლისფერი',price:0},
 {id:'sage',label:'სალბისფერი',price:5},
 {id:'rose',label:'მტვრიანი ვარდისფერი',price:5}
];
export const ribbonOptions:{id:BouquetCustom['ribbon'];label:string;price:number}[]=[
 {id:'linen',label:'თეთრეული',price:0},
 {id:'terracotta',label:'ტერაკოტა',price:3},
 {id:'brown',label:'მუქი ყავისფერი',price:3}
];
export function bagItemPrice(product:Bouquet,item:Pick<BagItem,'size'|'custom'>){
 const size=sizeOptions.find(option=>option.id===item.size);
 if(!size)throw new Error('თაიგულის ზომა არასწორია.');
 const custom=item.custom;
 if(!custom)return Math.round(product.price*size.multiplier*100)/100;
 const accent=accentOptions.find(option=>option.id===custom.accent),wrapping=wrappingOptions.find(option=>option.id===custom.wrapping),ribbon=ribbonOptions.find(option=>option.id===custom.ribbon);
 if(!accent||!wrapping||!ribbon)throw new Error('თაიგულის არჩევანი არასწორია.');
 return Math.round((product.price*size.multiplier+accent.price+wrapping.price+ribbon.price)*100)/100;
}
export const formatMoney=(value:number)=>new Intl.NumberFormat('ka-GE',{maximumFractionDigits:2}).format(value);
export function readStoredBag():BagItem[]{try{const parsed=JSON.parse(localStorage.getItem(bagStorageKey)||'[]');if(!Array.isArray(parsed))return [];return parsed.filter((item:BagItem)=>item&&typeof item.key==='string'&&typeof item.bouquetId==='string'&&sizeOptions.some(option=>option.id===item.size)&&(!item.custom||accentOptions.some(option=>option.id===item.custom?.accent)&&wrappingOptions.some(option=>option.id===item.custom?.wrapping)&&ribbonOptions.some(option=>option.id===item.custom?.ribbon)&&String(item.custom.note||'').length<=280)).slice(0,8)}catch{return []}}
