'use client';
import { useState } from 'react';
import { Check, X } from 'lucide-react';
import type { FlowerType, Occasion, Recipient } from '@/types';
import { flowerLabels, georgianMonth, relationshipLabel } from '@/lib/locale';

const flowerTypes: FlowerType[] = ['rose','tulip','peony','lily','orchid','sunflower','carnation'];
const dayValue = (value?: string) => value ? `2000-${value}` : '';
export function MonthDayPicker({value,onChange}:{value:string;onChange:(value:string)=>void}) {
 const [month,setMonth]=useState(value?Number(value.slice(5,7)):0);
 const [day,setDay]=useState(value?Number(value.slice(8,10)):0);
 const update=(nextMonth:number,nextDay:number)=>{setMonth(nextMonth);setDay(nextDay);onChange(nextMonth&&nextDay?`2000-${String(nextMonth).padStart(2,'0')}-${String(nextDay).padStart(2,'0')}`:'')};
 const maxDay=month?new Date(2000,month,0).getDate():31;
 return <span className="georgian-date month-day-picker"><select aria-label="თვე" value={month||''} onChange={e=>{const next=Number(e.target.value);update(next,day>new Date(2000,next,0).getDate()?0:day)}}><option value="">თვე</option>{Array.from({length:12},(_,i)=><option key={i} value={i+1}>{georgianMonth(new Date(2000,i,1))}</option>)}</select><select aria-label="დღე" value={day||''} onChange={e=>update(month,Number(e.target.value))}><option value="">დღე</option>{Array.from({length:maxDay},(_,i)=><option key={i} value={i+1}>{i+1}</option>)}</select></span>;
}

export function OccasionModal({person,occasion,onClose,onSave}:{person:Recipient;occasion?:Occasion;onClose:()=>void;onSave:(occasion:{name:string;date:string;type:string})=>void}) {
 const [name,setName]=useState(occasion?.name||'');
 const [date,setDate]=useState(occasion?.date?`2000-${occasion.date}`:'');
 const [type,setType]=useState(occasion?.type||'Custom');
 const save=()=>{if(!name.trim()||!date)return;onSave({name:name.trim(),date:date.slice(5),type});};
 return <div className="modal-backdrop" onClick={onClose}><div className="modal occasion-modal" onClick={e=>e.stopPropagation()}><div className="modal-top"><div><span className="eyebrow">{person.name} · მნიშვნელოვანი დღე</span><h2>{occasion?'თარიღის შეცვლა':'თარიღის დამატება'}</h2></div><button onClick={onClose} aria-label="დახურვა"><X size={20}/></button></div><p>დაამატეთ იუბილე, წლისთავი ან ნებისმიერი დღე, რომლის გახსენებაც გსურთ.</p><label>თარიღის სახელი<input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="მაგალითად, ჩვენი გაცნობის დღე"/></label><label>თარიღი<MonthDayPicker value={date} onChange={setDate}/></label><label>კატეგორია<select value={type} onChange={e=>setType(e.target.value)}><option value="Anniversary">წლისთავი</option><option value="Birthday">დაბადების დღე</option><option value="Custom">სხვა განსაკუთრებული დღე</option></select></label><button className="btn btn-primary modal-submit" onClick={save} disabled={!name.trim()||!date}>{occasion?'ცვლილებების შენახვა':'თარიღის შენახვა'}</button></div></div>;
}
export function PersonModal({person,onClose,onSave}:{person?:Recipient;onClose:()=>void;onSave:(person:Recipient,custom?:{name:string;date:string})=>void}) {
 const [name,setName]=useState(person?.name||'');
 const [relationship,setRelationship]=useState(!person?'Friend':['Friend','Girlfriend','Boyfriend','Partner','Wife','Husband','Mother','Father','Sister','Brother','Colleague'].includes(person.relationship)?person.relationship:'Other');
 const [customRelationship,setCustomRelationship]=useState(person&& !['Friend','Girlfriend','Boyfriend','Partner','Wife','Husband','Mother','Father','Sister','Brother','Colleague'].includes(person.relationship)?person.relationship:'');
 const [photo,setPhoto]=useState(person?.photo||'');
 const [birthday,setBirthday]=useState(dayValue(person?.birthday));
 const [anniversary,setAnniversary]=useState(dayValue(person?.anniversary));
 const [customName,setCustomName]=useState('');
 const [customDate,setCustomDate]=useState('');
 const [address,setAddress]=useState(person?.address||'');
 const [notes,setNotes]=useState(person?.notes||'');
 const [flowers,setFlowers]=useState<FlowerType[]>(person?.preferredFlowers||[]);
 const [colors,setColors]=useState(person?.preferredColors.join(', ')||'');
 const save=()=>{ if(!name.trim()) return; const id=person?.id||`person-${Date.now()}`; onSave({id,name:name.trim(),relationship:(relationship==='Other'?customRelationship:relationship).trim()||'Friend',initials:name.trim()[0].toUpperCase(),color:person?.color||'#dfe2d6',photo:photo||undefined,birthday:birthday?birthday.slice(5):undefined,anniversary:anniversary?anniversary.slice(5):undefined,since:person?.since,address:address.trim(),notes:notes.trim(),preferredFlowers:flowers,preferredColors:colors.split(',').map(c=>c.trim()).filter(Boolean)},customName&&customDate?{name:customName.trim(),date:customDate.slice(5)}:undefined); };
 const fileChanged=(file?:File)=>{if(!file)return;const reader=new FileReader();reader.onload=()=>{const image=new Image();image.onload=()=>{const canvas=document.createElement('canvas');canvas.width=240;canvas.height=240;const context=canvas.getContext('2d');if(!context)return;const side=Math.min(image.width,image.height);context.drawImage(image,(image.width-side)/2,(image.height-side)/2,side,side,0,0,240,240);setPhoto(canvas.toDataURL('image/jpeg',.82))};image.src=String(reader.result)};reader.readAsDataURL(file)};
 return <div className="modal-backdrop" onClick={onClose}><div className="modal person-modal" onClick={e=>e.stopPropagation()}><div className="modal-top"><div><span className="eyebrow">ახლობლების წრე</span><h2>{person?'დეტალების შეცვლა':'ადამიანის დამატება'}</h2></div><button onClick={onClose} aria-label="დახურვა"><X size={20}/></button></div><p>შეინახეთ თარიღები და პატარა დეტალები, რომლებიც საჩუქარს პირადულს ხდის.</p>
 <div className="person-photo-row"><span className="avatar avatar-large" style={{background:person?.color||'#dfe2d6'}}>{photo?<img src={photo} alt="პროფილის ფოტოს წინასწარი ნახვა"/>:name?.[0]?.toUpperCase()||'?'}</span><label>პროფილის ფოტო<input className="photo-file-input" type="file" accept="image/*" onChange={e=>fileChanged(e.target.files?.[0])}/><span className="photo-file-button">{photo?'ფოტოს შეცვლა':'ფოტოს არჩევა'}</span><small>არასავალდებულო · ინახება მხოლოდ ამ ბრაუზერში.</small></label></div>
 <div className="modal-two"><label>სახელი<input value={name} onChange={e=>setName(e.target.value)} placeholder="სახელი" autoFocus/></label><label>ურთიერთობა<select value={relationship} onChange={e=>setRelationship(e.target.value)}>{['Friend','Girlfriend','Boyfriend','Partner','Wife','Husband','Mother','Father','Sister','Brother','Colleague','Other'].map(x=><option key={x} value={x}>{relationshipLabel(x)}</option>)}</select></label></div>
 {relationship==='Other'&&<label>სხვა ურთიერთობა<input value={customRelationship} onChange={e=>setCustomRelationship(e.target.value)} placeholder="მაგალითად, მენტორი"/></label>}
 <div className="modal-two"><label>დაბადების დღე<MonthDayPicker value={birthday} onChange={setBirthday}/></label><label>წლისთავი<MonthDayPicker value={anniversary} onChange={setAnniversary}/></label></div>
 <div className="modal-two"><label>სხვა მნიშვნელოვანი თარიღი<MonthDayPicker value={customDate} onChange={setCustomDate}/></label><label>რა დღეა?<input value={customName} onChange={e=>setCustomName(e.target.value)} placeholder="მაგალითად, გამოსაშვები დღე"/></label></div>
 <label>მიწოდების მისამართი<input value={address} onChange={e=>setAddress(e.target.value)} placeholder="ქუჩა, ქალაქი, საფოსტო კოდი"/></label>
 <label>საყვარელი ყვავილები</label><div className="flower-preferences">{flowerTypes.map(type=><button key={type} type="button" className={flowers.includes(type)?'selected':''} onClick={()=>setFlowers(flowers.includes(type)?flowers.filter(x=>x!==type):[...flowers,type])}>{flowers.includes(type)&&<Check size={12}/>} {flowerLabels[type]}</button>)}</div>
 <label>საყვარელი ფერები<input value={colors} onChange={e=>setColors(e.target.value)} placeholder="ვარდისფერი, კრემისფერი, მწვანე"/></label><label>შენიშვნები<textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="რა ახარებს მას?"/></label><button className="btn btn-primary modal-submit" onClick={save}>{person?'ცვლილებების შენახვა':'ადამიანის შენახვა'}</button></div></div>;
}
