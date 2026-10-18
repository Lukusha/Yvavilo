import assert from 'node:assert/strict';

const base=process.env.BASE_URL||'http://127.0.0.1:8787';
async function call(path,{method='GET',body,cookie}={}){
 const response=await fetch(base+path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});
 const data=await response.json();
 if(!response.ok)throw Object.assign(new Error(data.message||`HTTP ${response.status}`),{status:response.status,data});
 return {data,cookie:response.headers.get('set-cookie')?.split(';')[0]||cookie};
}

const unique=Date.now();
const email=`backend-${unique}@example.com`,password='FlowerTest!9',nextPassword='FlowerTest!10';
await assert.rejects(()=>call('/api/auth/signup',{method:'POST',body:{name:'დაბლოკილი',email:`blocked-${unique}@example.com`,password}}),error=>error.status===400);
const products=await call('/api/products');
assert.equal(products.data.length,8);
assert.ok(products.data.every(row=>row.active));
const delivery=new Date(Date.now()+86400000).toISOString().slice(0,10);
const guest=await call('/api/guest/orders',{method:'POST',body:{id:crypto.randomUUID(),bouquetId:'cherries',occasion:'Birthday',message:'გილოცავ!',deliveryDate:delivery,deliveryTime:'Morning, 9am–12pm',zone:'tbilisi',address:'თბილისი, რუსთაველის 1',recipientName:'ნინო',recipientPhone:'+995 555 111 222',customerName:'ტესტი',customerEmail:email,customerPhone:'+995 555 222 333'}});
assert.equal(guest.data.order.price,109.5);
const tracked=await call(`/api/guest/orders/${guest.data.order.id}?token=${encodeURIComponent(guest.data.claimToken)}`);
assert.equal(tracked.data.status,'Pending');
const support=await call('/api/support',{method:'POST',body:{name:'ტესტი',email,phone:'+995 555 222 333',orderId:guest.data.order.id,message:'სატესტო დახმარების მოთხოვნა'}});
assert.ok(support.data.id);
const signup=await call('/api/auth/signup',{method:'POST',body:{name:'ტესტი',email,password,claimToken:guest.data.claimToken}});
assert.equal(signup.data.user.email,email);
assert.ok(signup.cookie?.startsWith('yvavilo_session='));
const session=await call('/api/auth/session',{cookie:signup.cookie});
assert.equal(session.data.user.name,'ტესტი');
assert.equal((await call('/api/store/orders',{cookie:signup.cookie})).data.length,1);
assert.equal((await call('/api/store/people',{cookie:signup.cookie})).data.length,1);

const personId=crypto.randomUUID();
await call('/api/people',{method:'POST',cookie:signup.cookie,body:{person:{id:personId,name:'ნინო',relationship:'Sister',initials:'ნ',color:'#dfe2d6',birthday:'05-12',anniversary:'09-03',address:'თბილისი, რუსთაველის 1',notes:'უყვარს ვარდები',preferredFlowers:['rose'],preferredColors:['ვარდისფერი']},custom:{name:'ჩვენი დღე',date:'11-20'}}});
const people=await call('/api/store/people',{cookie:signup.cookie});
const occasions=await call('/api/store/occasions',{cookie:signup.cookie});
assert.equal(people.data.length,2);
assert.equal(occasions.data.length,3);

const order=await call('/api/orders',{method:'POST',cookie:signup.cookie,body:{id:crypto.randomUUID(),recipientId:personId,bouquetId:'cherries',occasion:'Birthday',message:'გილოცავ!',deliveryDate:delivery,deliveryTime:'Morning, 9am–12pm',zone:'tbilisi',recipientPhone:'+995 555 111 222',customerPhone:'+995 555 222 333',address:'ignored'}});
assert.equal(order.data.price,109.5);
assert.equal(order.data.status,'Pending');
assert.equal((await call('/api/store/orders',{cookie:signup.cookie})).data.length,2);
assert.equal((await call('/api/store/notifications',{cookie:signup.cookie})).data.length,2);

const secondEmail=`second-${unique}@example.com`;
const secondGuest=await call('/api/guest/orders',{method:'POST',body:{id:crypto.randomUUID(),bouquetId:'garden',occasion:'Just because',message:'სიხარულით',deliveryDate:delivery,deliveryTime:'Afternoon, 12pm–4pm',zone:'central',address:'თბილისი, აბაშიძის 10',recipientName:'ანა',recipientPhone:'+995 555 333 444',customerName:'მეორე',customerEmail:secondEmail,customerPhone:'+995 555 444 555'}});
const second=await call('/api/auth/signup',{method:'POST',body:{name:'მეორე',email:secondEmail,password,claimToken:secondGuest.data.claimToken}});
assert.equal((await call('/api/store/people',{cookie:second.cookie})).data.length,1);

await call('/api/auth/password',{method:'PUT',cookie:signup.cookie,body:{password:nextPassword}});
await call('/api/auth/logout',{method:'POST',cookie:signup.cookie});
const login=await call('/api/auth/login',{method:'POST',body:{email,password:nextPassword}});
assert.equal(login.data.user.email,email);

console.log(JSON.stringify({guestOrder:true,tracking:true,registrationAfterOrder:true,directRegistrationBlocked:true,supportRequest:true,login:true,passwordChange:true,products:products.data.length,people:people.data.length,occasions:occasions.data.length,orders:2,isolation:true},null,2));
