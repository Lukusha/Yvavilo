type SqlValue=string|number|null;
interface D1Statement{bind(...values:SqlValue[]):D1Statement;first<T=Record<string,unknown>>():Promise<T|null>;all<T=Record<string,unknown>>():Promise<{results:T[]}>;run():Promise<unknown>}
interface D1Database{prepare(sql:string):D1Statement;batch(statements:D1Statement[]):Promise<unknown>}
interface Env{DB:D1Database;ASSETS:{fetch(request:Request):Promise<Response>}}
type UserRow={id:string;email:string;name:string;password_hash:string;salt:string;iterations:number};
type StaffRole='admin'|'operator';
type AuthUser={id:string;email:string;name:string;staffRole?:StaffRole};
type RecordRow={id:string;data:string;recipient_id:string|null;created_at:string};

const COOKIE='yvavilo_session';
const SESSION_DAYS=30;
const ITERATIONS=50000;
const kinds=['people','orders','deliveries','notifications','occasions'] as const;
type Kind=typeof kinds[number];
class ApiError extends Error{constructor(public status:number,message:string){super(message)}}
const json=(body:unknown,status=200,headers:HeadersInit={}):Response=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const fail=(status:number,message:string):never=>{throw new ApiError(status,message)};
const normalizeEmail=(value:unknown)=>String(value||'').trim().toLowerCase();
const bytesToBase64=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const base64ToBytes=(value:string)=>Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(value.length/4)*4,'=')),char=>char.charCodeAt(0));
const randomToken=(size=32)=>{const bytes=new Uint8Array(size);crypto.getRandomValues(bytes);return bytesToBase64(bytes)};
const sha256=async(value:string)=>bytesToBase64(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))));
async function passwordHash(password:string,salt:string,iterations=ITERATIONS){
 const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
 const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:base64ToBytes(salt),iterations},material,256);
 return bytesToBase64(new Uint8Array(bits));
}
const safeEqual=(a:string,b:string)=>{if(a.length!==b.length)return false;let result=0;for(let i=0;i<a.length;i++)result|=a.charCodeAt(i)^b.charCodeAt(i);return result===0};
const parseCookies=(request:Request)=>Object.fromEntries((request.headers.get('Cookie')||'').split(';').map(item=>item.trim().split('=').map(decodeURIComponent)).filter(parts=>parts.length===2));
const sessionCookie=(request:Request,token:string,maxAge=SESSION_DAYS*86400)=>`${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${new URL(request.url).protocol==='https:'?'; Secure':''}`;
async function body(request:Request){try{return await request.json() as Record<string,any>}catch{return fail(400,'მონაცემების ფორმატი არასწორია.')}}
function assertMutationOrigin(request:Request){const origin=request.headers.get('Origin');if(origin&&new URL(origin).host!==new URL(request.url).host)fail(403,'მოთხოვნა დაბლოკილია.')}
const publicUser=(user:AuthUser):AuthUser=>({id:user.id,email:user.email,name:user.name,...(user.staffRole?{staffRole:user.staffRole}:{})});
async function authenticate(request:Request,env:Env):Promise<AuthUser>{
 const token=parseCookies(request)[COOKIE];if(!token)fail(401,'გთხოვთ, შეხვიდეთ ანგარიშში.');
 const tokenHash=await sha256(token);
 const user=await env.DB.prepare(`select u.id,u.email,u.name,st.role as staffRole from sessions s join users u on u.id=s.user_id left join staff st on st.user_id=u.id where s.token_hash=? and s.expires_at>unixepoch()`).bind(tokenHash).first<AuthUser>();
 if(!user)throw new ApiError(401,'სესია დასრულდა. გთხოვთ, ხელახლა შეხვიდეთ.');return user;
}
async function createSession(request:Request,env:Env,user:AuthUser){
 const token=randomToken(),tokenHash=await sha256(token),expires=Math.floor(Date.now()/1000)+SESSION_DAYS*86400;
 await env.DB.batch([env.DB.prepare('delete from sessions where expires_at<=unixepoch()'),env.DB.prepare('insert into sessions(token_hash,user_id,expires_at) values(?,?,?)').bind(tokenHash,user.id,expires)]);
 return json({access_token:'cookie',user:publicUser(user)},200,{'Set-Cookie':sessionCookie(request,token)});
}
function validateCredentials(payload:Record<string,any>,signup=false){
 const email=normalizeEmail(payload.email),password=String(payload.password||''),name=String(payload.name||'').trim();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)fail(400,'მიუთითეთ სწორი ელფოსტა.');
 if(password.length<8||password.length>128)fail(400,'პაროლი უნდა შეიცავდეს 8-დან 128 სიმბოლომდე.');
 if(signup&&(!name||name.length>150))fail(400,'მიუთითეთ თქვენი სახელი.');
 return {email,password,name};
}
async function signup(request:Request,env:Env){
 assertMutationOrigin(request);const input=validateCredentials(await body(request),true);
 if(await env.DB.prepare('select id from users where email=?').bind(input.email).first())fail(409,'ამ ელფოსტით ანგარიში უკვე არსებობს.');
 const id=crypto.randomUUID(),salt=randomToken(16),hash=await passwordHash(input.password,salt);
 try{await env.DB.prepare('insert into users(id,email,name,password_hash,salt,iterations) values(?,?,?,?,?,?)').bind(id,input.email,input.name,hash,salt,ITERATIONS).run()}catch{fail(409,'ამ ელფოსტით ანგარიში უკვე არსებობს.')}
 return createSession(request,env,{id,email:input.email,name:input.name});
}
async function login(request:Request,env:Env){
 assertMutationOrigin(request);const input=validateCredentials(await body(request));
 const user=await env.DB.prepare('select id,email,name,password_hash,salt,iterations from users where email=?').bind(input.email).first<UserRow>();
 if(!user){await passwordHash(input.password,randomToken(16));throw new ApiError(401,'ელფოსტა ან პაროლი არასწორია.')}
 const hash=await passwordHash(input.password,user.salt,user.iterations);if(!safeEqual(hash,user.password_hash))fail(401,'ელფოსტა ან პაროლი არასწორია.');
 return createSession(request,env,user);
}
async function logout(request:Request,env:Env){
 assertMutationOrigin(request);const token=parseCookies(request)[COOKIE];if(token)await env.DB.prepare('delete from sessions where token_hash=?').bind(await sha256(token)).run();
 return json({ok:true},200,{'Set-Cookie':sessionCookie(request,'',0)});
}
async function updatePassword(request:Request,env:Env){
 assertMutationOrigin(request);const user=await authenticate(request,env);const password=String((await body(request)).password||'');
 if(password.length<8||password.length>128)fail(400,'პაროლი უნდა შეიცავდეს 8-დან 128 სიმბოლომდე.');
 const salt=randomToken(16),hash=await passwordHash(password,salt);await env.DB.prepare('update users set password_hash=?,salt=?,iterations=? where id=?').bind(hash,salt,ITERATIONS,user.id).run();return json({ok:true});
}
const validKind=(value:string):value is Kind=>(kinds as readonly string[]).includes(value);
const parseData=<T=Record<string,any>>(value:string):T=>JSON.parse(value) as T;
async function listStore(request:Request,env:Env,key:string){
 const user=await authenticate(request,env);
 if(key==='reminder'){const row=await env.DB.prepare('select data from settings where user_id=?').bind(user.id).first<{data:string}>();return json(row?parseData(row.data):null)}
 if(!validKind(key))throw new ApiError(404,'მონაცემები ვერ მოიძებნა.');
 const {results}=await env.DB.prepare('select id,data,recipient_id,created_at from records where user_id=? and kind=? order by created_at asc').bind(user.id,key).all<RecordRow>();
 return json(results.map(row=>({...parseData(row.data),id:row.id})));
}
function validateDate(value:unknown){const text=String(value||'');if(!/^\d{2}-\d{2}$/.test(text))return false;const [month,day]=text.split('-').map(Number);const date=new Date(2000,month-1,day);return date.getMonth()===month-1&&date.getDate()===day}
function validateItem(kind:Kind,item:Record<string,any>){
 if(!item||typeof item!=='object'||!String(item.id||'').trim()||String(item.id).length>120)fail(400,'ჩანაწერის ნომერი არასწორია.');
 if(kind==='occasions'&&(!String(item.name||'').trim()||!validateDate(item.date)||!String(item.recipientId||'')))fail(400,'მნიშვნელოვანი თარიღი სრულად შეავსეთ.');
 if(kind==='people'&&(!String(item.name||'').trim()||String(item.name).length>150))fail(400,'მიუთითეთ ადამიანის სახელი.');
}
async function replaceStore(request:Request,env:Env,key:string){
 assertMutationOrigin(request);const user=await authenticate(request,env),payload=await body(request),value=payload.value;
 if(key==='reminder'){await env.DB.prepare('insert into settings(user_id,data,updated_at) values(?,?,unixepoch()) on conflict(user_id) do update set data=excluded.data,updated_at=excluded.updated_at').bind(user.id,JSON.stringify(value??null)).run();return json({ok:true})}
 if(!validKind(key))throw new ApiError(404,'მონაცემები ვერ მოიძებნა.');if(key==='orders'||key==='deliveries')fail(403,'ამ მონაცემის პირდაპირ შეცვლა დაუშვებელია.');if(!Array.isArray(value)||value.length>500)fail(400,'მონაცემების ფორმატი არასწორია.');
 const seen=new Set<string>();for(const item of value){validateItem(key,item);if(seen.has(item.id))fail(400,'ჩანაწერი მეორდება.');seen.add(item.id)}
 if(key==='occasions'){const people=await env.DB.prepare("select id from records where user_id=? and kind='people'").bind(user.id).all<{id:string}>();const ids=new Set(people.results.map(row=>row.id));for(const item of value)if(!ids.has(item.recipientId))fail(400,'არჩეული ადამიანი ვერ მოიძებნა.')}
 const existing=await env.DB.prepare('select id from records where user_id=? and kind=?').bind(user.id,key).all<{id:string}>();
 const statements:D1Statement[]=[];for(const row of existing.results)if(!seen.has(row.id))statements.push(env.DB.prepare('delete from records where user_id=? and kind=? and id=?').bind(user.id,key,row.id));
 for(const item of value)statements.push(env.DB.prepare('insert into records(user_id,kind,id,recipient_id,data,created_at) values(?,?,?,?,?,unixepoch()) on conflict(user_id,kind,id) do update set recipient_id=excluded.recipient_id,data=excluded.data').bind(user.id,key,item.id,item.recipientId||null,JSON.stringify(item)));
 if(statements.length)await env.DB.batch(statements);return json({ok:true});
}
async function savePerson(request:Request,env:Env){
 assertMutationOrigin(request);const user=await authenticate(request,env),payload=await body(request),person=payload.person as Record<string,any>,custom=payload.custom as Record<string,any>|null;
 validateItem('people',person);if(person.photo&&(!String(person.photo).startsWith('data:image/')||String(person.photo).length>1500000))fail(400,'პროფილის ფოტო ძალიან დიდია ან არასწორი ფორმატისაა.');
 const statements:D1Statement[]=[env.DB.prepare("insert into records(user_id,kind,id,recipient_id,data,created_at) values(?,'people',?,null,?,unixepoch()) on conflict(user_id,kind,id) do update set data=excluded.data").bind(user.id,person.id,JSON.stringify(person))];
 for(const [field,label,type] of [['birthday','დაბადების დღე','Birthday'],['anniversary','წლისთავი','Anniversary']] as const){const id=`${field}-${person.id}`,date=person[field];if(date){if(!validateDate(date))fail(400,'მიუთითეთ სწორი თარიღი.');const occasion={id,recipientId:person.id,name:`${person.name} — ${label}`,date,type};statements.push(env.DB.prepare("insert into records(user_id,kind,id,recipient_id,data,created_at) values(?,'occasions',?,?,?,unixepoch()) on conflict(user_id,kind,id) do update set data=excluded.data,recipient_id=excluded.recipient_id").bind(user.id,id,person.id,JSON.stringify(occasion)))}else statements.push(env.DB.prepare("delete from records where user_id=? and kind='occasions' and id=?").bind(user.id,id))}
 if(custom){if(!String(custom.name||'').trim()||!validateDate(custom.date))fail(400,'მნიშვნელოვანი თარიღი სრულად შეავსეთ.');const id=String(custom.id||crypto.randomUUID()),occasion={id,recipientId:person.id,name:String(custom.name).trim(),date:custom.date,type:'Custom'};statements.push(env.DB.prepare("insert into records(user_id,kind,id,recipient_id,data,created_at) values(?,'occasions',?,?,?,unixepoch()) on conflict(user_id,kind,id) do update set data=excluded.data,recipient_id=excluded.recipient_id").bind(user.id,id,person.id,JSON.stringify(occasion)))}
 await env.DB.batch(statements);return json(person);
}
async function products(request:Request,env:Env){await authenticate(request,env);const {results}=await env.DB.prepare('select data,active from products order by created_at asc').all<{data:string;active:number}>();return json(results.map(row=>({data:parseData(row.data),active:Boolean(row.active)})))}
async function placeOrder(request:Request,env:Env){
 assertMutationOrigin(request);const user=await authenticate(request,env),payload=await body(request),id=String(payload.id||'');if(!id||id.length>120)fail(400,'შეკვეთის ნომერი არასწორია.');
 const existing=await env.DB.prepare("select data from records where user_id=? and kind='orders' and id=?").bind(user.id,id).first<{data:string}>();if(existing)return json(parseData(existing.data));
 const recipientRow=await env.DB.prepare("select data from records where user_id=? and kind='people' and id=?").bind(user.id,String(payload.recipientId||'')).first<{data:string}>();if(!recipientRow)throw new ApiError(404,'მიმღები ვერ მოიძებნა.');const recipient=parseData(recipientRow.data);
 const productRow=await env.DB.prepare('select data from products where id=? and active=1').bind(String(payload.bouquetId||'')).first<{data:string}>();if(!productRow)throw new ApiError(404,'თაიგული აღარ არის ხელმისაწვდომი.');const product=parseData(productRow.data);
 const deliveryDate=String(payload.deliveryDate||''),today=new Date(Date.now()+4*3600000).toISOString().slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)||deliveryDate<today)fail(400,'აირჩიეთ დღევანდელი ან მომავალი თარიღი.');
 if(String(recipient.address||'').trim().length<5)fail(400,'მიმღების პროფილში მიუთითეთ სრული მისამართი.');if(String(payload.message||'').length>280)fail(400,'ბარათი უნდა იყოს 280 სიმბოლომდე.');
 const order={id,recipientId:recipient.id,recipientName:recipient.name,bouquetId:product.id,bouquetName:product.name,bouquetImage:product.image,occasion:String(payload.occasion||''),message:String(payload.message||''),deliveryDate,deliveryTime:String(payload.deliveryTime||''),address:recipient.address,price:Number(product.price),status:'Pending',createdAt:new Date().toISOString()};
 const notification={id:`order-${id}`,kind:'delivery',title:'შეკვეთის მოთხოვნა მიღებულია',detail:'მოთხოვნა ელოდება დადასტურებას. გადახდა ჯერ არ შესრულებულა.',recipientId:recipient.id,read:false};
 await env.DB.batch([env.DB.prepare("insert into records(user_id,kind,id,recipient_id,data,created_at) values(?,'orders',?,?,?,unixepoch())").bind(user.id,id,recipient.id,JSON.stringify(order)),env.DB.prepare("insert into records(user_id,kind,id,recipient_id,data,created_at) values(?,'notifications',?,?,?,unixepoch())").bind(user.id,notification.id,recipient.id,JSON.stringify(notification))]);return json(order,201);
}
async function requireStaff(request:Request,env:Env,roles:StaffRole[]=['admin','operator']){const user=await authenticate(request,env);if(!user.staffRole||!roles.includes(user.staffRole))fail(403,'წვდომა შეზღუდულია.');return {user,role:user.staffRole}}
async function audit(env:Env,actor:string,action:string,targetType:string,targetId:string,detail=''){await env.DB.prepare('insert into audit_log(id,actor_user_id,action,target_type,target_id,detail) values(?,?,?,?,?,?)').bind(crypto.randomUUID(),actor,action,targetType,targetId,detail.slice(0,500)).run()}
async function staffOrders(request:Request,env:Env){await requireStaff(request,env);const {results}=await env.DB.prepare("select r.data,u.email,u.name from records r join users u on u.id=r.user_id where r.kind='orders' order by r.created_at desc").all<{data:string;email:string;name:string}>();return json(results.map(row=>({...parseData(row.data),customerEmail:row.email,customerName:row.name})))}
async function adminOverview(request:Request,env:Env){
 const access=await requireStaff(request,env);
 const [ordersResult,productsResult,customersResult,staffResult,auditResult]=await Promise.all([
  env.DB.prepare("select r.data,u.email,u.name from records r join users u on u.id=r.user_id where r.kind='orders' order by r.created_at desc limit 300").all<{data:string;email:string;name:string}>(),
  env.DB.prepare('select data,active from products order by created_at asc').all<{data:string;active:number}>(),
  env.DB.prepare("select u.id,u.name,u.email,u.created_at,(select count(*) from records r where r.user_id=u.id and r.kind='people') people_count,(select count(*) from records r where r.user_id=u.id and r.kind='orders') orders_count from users u order by u.created_at desc limit 200").all<{id:string;name:string;email:string;created_at:number;people_count:number;orders_count:number}>(),
  env.DB.prepare('select u.id,u.name,u.email,s.role from staff s join users u on u.id=s.user_id order by u.name').all<{id:string;name:string;email:string;role:StaffRole}>(),
  env.DB.prepare('select a.id,a.action,a.target_type,a.target_id,a.detail,a.created_at,u.name actor_name from audit_log a join users u on u.id=a.actor_user_id order by a.created_at desc limit 100').all<{id:string;action:string;target_type:string;target_id:string;detail:string;created_at:number;actor_name:string}>()
 ]);
 const orders:Array<Record<string,any>>=ordersResult.results.map(row=>({...parseData<Record<string,any>>(row.data),customerEmail:row.email,customerName:row.name}));
 const delivered=orders.filter(order=>order.status==='Delivered');
 return json({role:access.role,currentUserEmail:access.user.email,stats:{customers:customersResult.results.length,orders:orders.length,pending:orders.filter(order=>order.status==='Pending').length,revenue:delivered.reduce((sum,order)=>sum+Number(order.price||0),0)},orders,products:productsResult.results.map(row=>({...parseData(row.data),available:Boolean(row.active)})),customers:customersResult.results.map(row=>({id:row.id,name:row.name,email:row.email,createdAt:row.created_at,peopleCount:row.people_count,ordersCount:row.orders_count})),staff:staffResult.results,audit:auditResult.results.map(row=>({id:row.id,action:row.action,targetType:row.target_type,targetId:row.target_id,detail:row.detail,createdAt:row.created_at,actorName:row.actor_name}))});
}
async function fulfillOrder(request:Request,env:Env){
 assertMutationOrigin(request);const access=await requireStaff(request,env);const payload=await body(request),id=String(payload.order_id||''),status=String(payload.next_status||'');const row=await env.DB.prepare("select user_id,recipient_id,data from records where kind='orders' and id=?").bind(id).first<{user_id:string;recipient_id:string;data:string}>();if(!row)throw new ApiError(404,'შეკვეთა ვერ მოიძებნა.');const order=parseData(row.data),allowed=(order.status==='Pending'&&['Confirmed','Cancelled'].includes(status))||(order.status==='Confirmed'&&['Scheduled','Delivered','Cancelled'].includes(status))||(order.status==='Scheduled'&&['Delivered','Cancelled'].includes(status));if(!allowed)fail(400,'სტატუსის ცვლილება არ არის დაშვებული.');const previous=order.status;order.status=status;
 const statements:D1Statement[]=[env.DB.prepare("update records set data=? where user_id=? and kind='orders' and id=?").bind(JSON.stringify(order),row.user_id,id)];
 if(status==='Delivered'){const delivery={id:`delivery-${id}`,recipientId:row.recipient_id,bouquetId:order.bouquetId,deliveredAt:new Date().toISOString(),message:order.message};statements.push(env.DB.prepare("insert or ignore into records(user_id,kind,id,recipient_id,data,created_at) values(?,'deliveries',?,?,?,unixepoch())").bind(row.user_id,delivery.id,row.recipient_id,JSON.stringify(delivery)))}
 const titles:Record<string,string>={Delivered:'თქვენი ყვავილები მიტანილია',Confirmed:'თქვენი შეკვეთა დადასტურებულია',Scheduled:'თქვენი შეკვეთა მიწოდებისთვის დაიგეგმა',Cancelled:'თქვენი შეკვეთა გაუქმებულია'};const notification={id:`status-${id}-${status}`,kind:'delivery',title:titles[status],detail:'შეამოწმეთ შეკვეთის დეტალები.',recipientId:row.recipient_id,read:false};statements.push(env.DB.prepare("insert or ignore into records(user_id,kind,id,recipient_id,data,created_at) values(?,'notifications',?,?,?,unixepoch())").bind(row.user_id,notification.id,row.recipient_id,JSON.stringify(notification)));await env.DB.batch(statements);await audit(env,access.user.id,'order_status','order',id,`${previous} → ${status}`);return json({ok:true});
}
async function adminProduct(request:Request,env:Env){
 assertMutationOrigin(request);const access=await requireStaff(request,env,['admin']);const payload=await body(request),input=payload.product as Record<string,any>,id=String(input?.id||'').trim();if(!id||id.length>120)fail(400,'პროდუქტის ნომერი არასწორია.');const existing=await env.DB.prepare('select id from products where id=?').bind(id).first();if(!existing)fail(404,'პროდუქტი ვერ მოიძებნა.');
 const name=String(input.name||'').trim(),description=String(input.description||'').trim(),bestFor=String(input.bestFor||'').trim(),image=String(input.image||'').trim(),price=Number(input.price),lifespanDays=Number(input.lifespanDays);if(!name||name.length>150||!description||description.length>800||!bestFor||bestFor.length>150)fail(400,'პროდუქტის ტექსტები სრულად შეავსეთ.');if(!Number.isFinite(price)||price<=0||price>100000)fail(400,'მიუთითეთ სწორი ფასი.');if(!Number.isInteger(lifespanDays)||lifespanDays<1||lifespanDays>30)fail(400,'სიახლის დღეები უნდა იყოს 1-დან 30-მდე.');if(!/^\/images\/[a-zA-Z0-9_./-]+$/.test(image))fail(400,'გამოიყენეთ საიტზე ატვირთული სურათის მისამართი.');
 const categories=Array.isArray(input.category)?input.category.map(String).map(value=>value.trim()).filter(Boolean).slice(0,12):[];const flowerTypes=['rose','tulip','peony','lily','orchid','sunflower','carnation'];const flowerType=flowerTypes.includes(String(input.flowerType))?String(input.flowerType):'rose';const product={id,name,image,price,lifespanDays,stems:[{type:flowerType,weight:1}],bestFor,category:categories,description};const active=input.available!==false;await env.DB.prepare('update products set data=?,active=? where id=?').bind(JSON.stringify(product),active?1:0,id).run();await audit(env,access.user.id,'product_update','product',id,`${name} · ${price} ₾ · ${active?'active':'inactive'}`);return json({...product,available:active});
}
async function adminStaff(request:Request,env:Env){
 assertMutationOrigin(request);const access=await requireStaff(request,env,['admin']);const payload=await body(request),action=String(payload.action||''),email=normalizeEmail(payload.email),role:StaffRole=payload.role==='operator'?'operator':'admin';const found=await env.DB.prepare('select id,email,name from users where email=?').bind(email).first<{id:string;email:string;name:string}>();if(!found)throw new ApiError(404,'ამ ელფოსტით რეგისტრირებული მომხმარებელი ვერ მოიძებნა.');const target=found;
 if(action==='remove'){if(target.id===access.user.id)fail(400,'საკუთარ ადმინისტრატორის წვდომას ვერ წაშლით.');await env.DB.prepare('delete from staff where user_id=?').bind(target.id).run();await audit(env,access.user.id,'staff_remove','staff',target.id,target.email);return json({ok:true})}
 if(!['add','update'].includes(action))fail(400,'მოქმედება არასწორია.');if(target.id===access.user.id&&role!=='admin')fail(400,'საკუთარ ადმინისტრატორის როლს ვერ შეცვლით.');await env.DB.prepare('insert into staff(user_id,role) values(?,?) on conflict(user_id) do update set role=excluded.role').bind(target.id,role).run();await audit(env,access.user.id,'staff_role','staff',target.id,`${target.email} · ${role}`);return json({ok:true});
}
async function api(request:Request,env:Env){
 const url=new URL(request.url),path=url.pathname,method=request.method;
 if(path==='/api/health'&&method==='GET')return json({ok:true,database:'d1'});
 if(path==='/api/auth/signup'&&method==='POST')return signup(request,env);
 if(path==='/api/auth/login'&&method==='POST')return login(request,env);
 if(path==='/api/auth/logout'&&method==='POST')return logout(request,env);
 if(path==='/api/auth/password'&&method==='PUT')return updatePassword(request,env);
 if(path==='/api/auth/session'&&method==='GET'){const user=await authenticate(request,env);return json({access_token:'cookie',user:publicUser(user)})}
 if(path==='/api/products'&&method==='GET')return products(request,env);
 if(path==='/api/people'&&method==='POST')return savePerson(request,env);
 if(path==='/api/orders'&&method==='POST')return placeOrder(request,env);
 const store=path.match(/^\/api\/store\/([^/]+)$/);if(store&&method==='GET')return listStore(request,env,store[1]);if(store&&method==='PUT')return replaceStore(request,env,store[1]);
 if(path==='/api/rpc/staff_orders'&&method==='POST')return staffOrders(request,env);
 if(path==='/api/rpc/admin_overview'&&method==='POST')return adminOverview(request,env);
 if(path==='/api/rpc/admin_product'&&method==='POST')return adminProduct(request,env);
 if(path==='/api/rpc/admin_staff'&&method==='POST')return adminStaff(request,env);
 if(path==='/api/rpc/fulfill_order'&&method==='POST')return fulfillOrder(request,env);
 return json({message:'მისამართი ვერ მოიძებნა.'},404);
}

export default {async fetch(request:Request,env:Env):Promise<Response>{
 try{if(new URL(request.url).pathname.startsWith('/api/'))return await api(request,env);return env.ASSETS.fetch(request)}catch(error){if(error instanceof ApiError)return json({message:error.message},error.status);console.error(error);return json({message:'სერვერის შეცდომა. სცადეთ მოგვიანებით.'},500)}
}};
