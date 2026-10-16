import type { Bouquet, FlowerDelivery, FlowerType, Notification, Occasion, Order, Recipient, User } from '@/types';
export const user: User = { id: 'u1', name: 'ლუკა', email: 'luka@example.com' };
export const flowerLifespans: Record<FlowerType, number> = { rose: 7, tulip: 6, peony: 7, lily: 10, orchid: 14, sunflower: 8, carnation: 14 };
export const recipients: Recipient[] = [
 { id:'anna', name:'ანა', relationship:'Girlfriend', initials:'ა', color:'#ecd4d4', anniversary:'11-26', since:'2024 წლის 18 მაისიდან', address:'თბილისი, ჭავჭავაძის გამზირი 24, ბინა 6', notes:'უყვარს ხელით დაწერილი ბარათები და ნაზი ვარდისფერი ყვავილები.', preferredFlowers:['rose','peony'], preferredColors:['ვარდისფერი','კრემისფერი'] },
 { id:'mom', name:'დედა', relationship:'Mother', initials:'დ', color:'#e9dfd1', birthday:'10-24', address:'თბილისი, ყაზბეგის გამზირი 12', notes:'განსაკუთრებით უყვარს შროშანები და თეთრი თაიგულები.', preferredFlowers:['lily'], preferredColors:['თეთრი','მწვანე'] },
 { id:'nino', name:'ნინო', relationship:'Sister', initials:'ნ', color:'#e4dce9', birthday:'11-12', address:'თბილისი, აბაშიძის ქუჩა 8', notes:'ფერადი სეზონური ყვავილები ყოველთვის ახარებს.', preferredFlowers:['tulip','sunflower'], preferredColors:['ატმისფერი','ყვითელი'] }
];
export const bouquets: Bouquet[] = [
 { id:'red-roses', name:'განსაკუთრებული ჟესტი', image:'/images/red-roses.webp', price:89, stems:[{type:'rose',weight:1}], bestFor:'სიყვარულისთვის', category:['Roses','Romantic','Premium'], description:'ხავერდოვანი წითელი ვარდები და სეზონური მწვანილი — კლასიკური გზა ყველაზე მნიშვნელოვანი სათქმელისთვის.' },
 { id:'white-lilies', name:'ნაზი ელეგანტურობა', image:'/images/white-lilies.webp', price:74, stems:[{type:'lily',weight:1}], bestFor:'სითბოს გამოსახატავად', category:['Lilies','Minimal','Birthday'], description:'თეთრი შროშანები და ევკალიპტი მშვიდი, დახვეწილი განწყობით.' },
 { id:'peach-tulips', name:'ნაზი დასაწყისი', image:'/images/peach-tulips.webp', price:64, stems:[{type:'tulip',weight:1}], bestFor:'ახალი დასაწყისისთვის', category:['Tulips','Minimal','Birthday'], description:'ატმისფერი და სპილოსძვლისფერი ტიტები — ახალი ეტაპის ლამაზი მისალოცი.' },
 { id:'blush-peonies', name:'ვარდისფერი ყვავილობა', image:'/images/blush-peonies.webp', price:79, stems:[{type:'peony',weight:.8},{type:'rose',weight:.2}], bestFor:'წლისთავისთვის', category:['Peonies','Romantic','Premium'], description:'ნაზი ვარდისფერი პიონები და ყვავილები იმ დღეებისთვის, რომელთა დამახსოვრებაც გვსურს.' },
 { id:'garden-mix', name:'მზიანი ბაღი', image:'/images/garden-mix.webp', price:68, stems:[{type:'rose',weight:.5},{type:'carnation',weight:.3},{type:'lily',weight:.2}], bestFor:'უბრალოდ გასახარებლად', category:['Mixed','Birthday'], description:'ატმისფერი ვარდებისა და სეზონური ყვავილების თბილი, ხალისიანი ერთობა.' }
];
export const daysAgo = (days:number) => { const d = new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()-days); return d.toISOString(); };
export const deliveries: FlowerDelivery[] = [
 {id:'d1', recipientId:'anna', bouquetId:'red-roses', deliveredAt:daysAgo(6), estimatedLifespanDays:8, message:'შენთან ერთად ყოველი დღე განსაკუთრებულია.'},
 {id:'d2', recipientId:'mom', bouquetId:'white-lilies', deliveredAt:daysAgo(3), estimatedLifespanDays:10, message:'დღესაც და ყოველთვის შენზე ვფიქრობ.'},
 {id:'d3', recipientId:'anna', bouquetId:'blush-peonies', deliveredAt:daysAgo(63), message:'ჩვენი პატარა მომენტებისთვის.'},
 {id:'d4', recipientId:'nino', bouquetId:'garden-mix', deliveredAt:daysAgo(48), message:'შენით ყოველთვის ვამაყობ.'}
];
export const occasions: Occasion[] = [
 {id:'o1',recipientId:'mom',name:'დედას დაბადების დღე',date:'10-24',type:'Birthday'},
 {id:'o2',recipientId:'nino',name:'ნინოს დაბადების დღე',date:'11-12',type:'Birthday'},
 {id:'o3',recipientId:'anna',name:'ანასთან წლისთავი',date:'11-26',type:'Anniversary'}
];
export const initialOrders: Order[] = [
 {id:'YV-2048',recipientId:'anna',bouquetId:'red-roses',occasion:'Just because',message:'შენთან ერთად ყოველი დღე განსაკუთრებულია.',deliveryDate:daysAgo(6),deliveryTime:'Morning',address:recipients[0].address,price:89,status:'Delivered',createdAt:daysAgo(8)},
 {id:'YV-2047',recipientId:'mom',bouquetId:'white-lilies',occasion:'Just because',message:'დღესაც და ყოველთვის შენზე ვფიქრობ.',deliveryDate:daysAgo(3),deliveryTime:'Afternoon',address:recipients[1].address,price:74,status:'Delivered',createdAt:daysAgo(5)},
 {id:'YV-2046',recipientId:'nino',bouquetId:'garden-mix',occasion:'Congratulations',message:'შენით ყოველთვის ვამაყობ.',deliveryDate:daysAgo(48),deliveryTime:'Morning',address:recipients[2].address,price:68,status:'Delivered',createdAt:daysAgo(50)}
];
export const initialNotifications: Notification[] = [
 {id:'n1',kind:'freshness',title:'ანას ვარდები შესაძლოა ნელ-ნელა ფერმკრთალდებოდეს',detail:'პატარა სიურპრიზი მის კვირას გაალამაზებს.',recipientId:'anna',read:false},
 {id:'n2',kind:'occasion',title:'დედას დაბადების დღე ახლოვდება',detail:'კარგი დროა, საჩუქარი წინასწარ დაგეგმოთ.',recipientId:'mom',read:false},
 {id:'n3',kind:'delivery',title:'ყვავილები დედას მიეტანა',detail:'თაიგული „ნაზი ელეგანტურობა“ უსაფრთხოდ მივიდა.',recipientId:'mom',read:true}
];
