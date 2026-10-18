'use client';
import collection from '@/data/collection.json';

const formatPrice=(price:number)=>(Number.isInteger(price)?String(price):price.toFixed(2))
 .replace(/\B(?=(\d{3})+(?!\d))/g,',');

export function FlowerCollection(){
 return <section id="collection" className="signature-collection" aria-labelledby="collection-heading">
  <div className="collection-heading" data-reveal><span className="eyebrow">ყვავილებით ნათქვამი</span><h2 id="collection-heading">რვა თაიგული.<br/><em>უამრავი სათქმელი.</em></h2><p>აირჩიეთ ის, რომელიც თქვენს გრძნობას ჰგავს.</p></div>
  <div className="signature-grid">{collection.map((bouquet,index)=><article className="signature-card" key={bouquet.id}>
   <div className="signature-image"><img src={bouquet.image} alt={bouquet.name+' — '+bouquet.description} width={1024} height={1280} loading="lazy" decoding="async"/><span className="signature-number">{String(index+1).padStart(2,'0')}</span></div>
   <div className="signature-copy"><span className="eyebrow">{bouquet.bestFor}</span><div className="signature-title"><h3>{bouquet.name}</h3><strong>{formatPrice(bouquet.price)} ₾</strong></div><p>{bouquet.description}</p><a className="signature-action" href={`/send?bouquet=${encodeURIComponent(bouquet.id)}`}>აირჩიეთ თაიგული</a></div>
  </article>)}</div>
 </section>;
}
