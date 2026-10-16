self.addEventListener('push',event=>{
 let data={title:'ყვავილო',body:'მნიშვნელოვანი დღე ახლოვდება.',url:'/notifications'};
 try{data={...data,...event.data.json()}}catch{}
 event.waitUntil(self.registration.showNotification(data.title,{body:data.body,icon:'/icon.svg',badge:'/icon.svg',tag:data.id||'yvavilo',data:{url:data.url}}));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();let url=new URL(event.notification.data?.url||'/notifications',self.location.origin);
 if(url.origin!==self.location.origin)url=new URL('/notifications',self.location.origin);
 event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(async windows=>{for(const client of windows){if('focus'in client){await client.navigate(url.href);return client.focus()}}return clients.openWindow(url.href)}));
});
// No caching of account pages, private photos, or API responses.
