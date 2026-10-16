import type { FlowerType, Order } from '@/types';

export const relationshipLabels: Record<string,string> = {
 Friend:'მეგობარი', Girlfriend:'შეყვარებული', Boyfriend:'შეყვარებული', Partner:'პარტნიორი',
 Wife:'მეუღლე', Husband:'მეუღლე', Mother:'დედა', Father:'მამა', Sister:'და', Brother:'ძმა',
 Colleague:'კოლეგა', Other:'სხვა'
};
export const relationshipLabel = (value:string) => relationshipLabels[value] || value;

export const flowerLabels: Record<FlowerType,string> = {
 rose:'ვარდი', tulip:'ტიტა', peony:'პიონი', lily:'შროშანი', orchid:'ორქიდეა',
 sunflower:'მზესუმზირა', carnation:'მიხაკი'
};

export const occasionLabels: Record<string,string> = {
 'Just because':'უბრალოდ', Birthday:'დაბადების დღე', Anniversary:'წლისთავი',
 Congratulations:'მილოცვა', "I'm sorry":'ბოდიში', 'I’m sorry':'ბოდიში',
 'Thank you':'მადლობა', Custom:'სხვა'
};
export const occasionLabel = (value:string) => occasionLabels[value] || value;
export const orderStatusLabel = (status:Order['status']) => status==='Delivered'?'მიტანილია':'დაგეგმილია';
export const deliveryTimeLabel = (value:string) => ({Morning:'დილით',Afternoon:'შუადღით',Evening:'საღამოს','Morning, 9am–12pm':'დილით, 9:00–12:00','Afternoon, 12pm–4pm':'შუადღით, 12:00–16:00','Evening, 4pm–7pm':'საღამოს, 16:00–19:00'} as Record<string,string>)[value] || value;
export const daysUntil = (days:number) => days===0?'დღეს':`${days} დღეში`;
export const daysAgoLabel = (days:number) => `${days} დღის წინ`;
export const remainingDays = (days:number) => `${days} დღე დარჩა`;

const months = ['იანვარი','თებერვალი','მარტი','აპრილი','მაისი','ივნისი','ივლისი','აგვისტო','სექტემბერი','ოქტომბერი','ნოემბერი','დეკემბერი'];
const shortMonths = ['იანვ.','თებ.','მარ.','აპრ.','მაი.','ივნ.','ივლ.','აგვ.','სექ.','ოქტ.','ნოე.','დეკ.'];
const weekdays = ['კვირა','ორშაბათი','სამშაბათი','ოთხშაბათი','ხუთშაბათი','პარასკევი','შაბათი'];
export const georgianMonth = (date:Date,short=false) => (short?shortMonths:months)[date.getMonth()];
export const georgianDate = (date:Date,withWeekday=false,shortMonth=false) => `${withWeekday?`${weekdays[date.getDay()]}, `:''}${date.getDate()} ${georgianMonth(date,shortMonth)}`;
