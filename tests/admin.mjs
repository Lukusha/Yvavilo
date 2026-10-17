import assert from 'node:assert/strict';

const base=process.env.BASE_URL||'http://127.0.0.1:8787';
const mode=process.argv[2],email=process.argv[3],password='AdminPanel!9';
async function call(path,{method='GET',body,cookie,allowError=false}={}){
 const response=await fetch(base+path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});
 const data=await response.json();
 if(!response.ok&&!allowError)throw Object.assign(new Error(data.message||`HTTP ${response.status}`),{status:response.status,data});
 return {data,status:response.status,cookie:response.headers.get('set-cookie')?.split(';')[0]||cookie};
}
if(mode==='setup'){
 const signup=await call('/api/auth/signup',{method:'POST',body:{name:'ადმინ ტესტი',email,password}});
 const denied=await call('/api/rpc/admin_overview',{method:'POST',cookie:signup.cookie,body:{},allowError:true});
 assert.equal(denied.status,403);
 console.log(JSON.stringify({email,regularUserDenied:true}));
}else if(mode==='verify'){
 const login=await call('/api/auth/login',{method:'POST',body:{email,password}});
 const session=await call('/api/auth/session',{cookie:login.cookie});
 assert.equal(session.data.user.staffRole,'admin');
 const personId=crypto.randomUUID(),orderId=crypto.randomUUID();
 await call('/api/people',{method:'POST',cookie:login.cookie,body:{person:{id:personId,name:'მიმღები',relationship:'Friend',initials:'მ',color:'#dde5dc',address:'თბილისი, სატესტო ქუჩა 1',notes:'',preferredFlowers:['rose'],preferredColors:['წითელი']}}});
 const deliveryDate=new Date(Date.now()+86400000).toISOString().slice(0,10);
 await call('/api/orders',{method:'POST',cookie:login.cookie,body:{id:orderId,recipientId:personId,bouquetId:'cherries',occasion:'Custom',message:'ადმინ ტესტი',deliveryDate,deliveryTime:'Morning, 9am–12pm'}});
 for(const next_status of ['Confirmed','Scheduled','Delivered'])await call('/api/rpc/fulfill_order',{method:'POST',cookie:login.cookie,body:{order_id:orderId,next_status}});
 assert.equal((await call('/api/store/deliveries',{cookie:login.cookie})).data.length,1);
 let overview=(await call('/api/rpc/admin_overview',{method:'POST',cookie:login.cookie,body:{}})).data;
 assert.equal(overview.role,'admin');assert.ok(overview.audit.some(row=>row.targetId===orderId));
 const original=overview.products[0];
 const updated={...original,price:Number(original.price)+1,lifespanDays:9,flowerType:original.stems[0].type};
 await call('/api/rpc/admin_product',{method:'POST',cookie:login.cookie,body:{product:updated}});
 overview=(await call('/api/rpc/admin_overview',{method:'POST',cookie:login.cookie,body:{}})).data;
 assert.equal(overview.products.find(product=>product.id===original.id).lifespanDays,9);
 await call('/api/rpc/admin_product',{method:'POST',cookie:login.cookie,body:{product:{...original,lifespanDays:original.lifespanDays||7,flowerType:original.stems[0].type}}});
 console.log(JSON.stringify({roleSecurity:true,overview:true,orderWorkflow:true,lifespanStarted:true,catalogEditing:true,auditTrail:true},null,2));
}else throw new Error('Use setup or verify.');
