import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3000';
for(const [path,method] of [['state','GET'],['mutate','POST'],['action','POST'],['lumi','POST'],['media','GET']]){
 const response=await fetch(`${base}/api/${path}`,{method,body:method==='POST'?'{}':undefined,headers:method==='POST'?{'Content-Type':'application/json'}:undefined});
 assert.equal(response.status,401,`${path} denies unauthenticated access`);assert.match(response.headers.get('cache-control'),/no-store/);console.log(`PASS /api/${path}: 401, no-store`);
}
const response=await fetch(base);assert.equal(response.status,200);assert.match(response.headers.get('x-robots-tag'),/noindex/);const html=await response.text();for(const text of ['กรภัทร','จิตลัดดา','2005-03-14','2005-10-29','DEEPSEEK_API_KEY'])assert.equal(html.includes(text),false,`No private data in initial HTML: ${text}`);
const manifest=await (await fetch(`${base}/manifest.webmanifest`)).json();assert.equal(manifest.display,'standalone');for(const icon of manifest.icons){const r=await fetch(base+icon.src);assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/image/);}
assert.equal((await fetch(`${base}/offline.html`)).status,200);assert.equal((await fetch(`${base}/sql/02_seed.sql`)).status,404);console.log('PASS public HTML privacy, noindex, PWA icons/offline shell and SQL not exposed by Next.js');
