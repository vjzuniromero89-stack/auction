const HOME='https://salesweb.civilview.com/';
const KNOWN:Record<string,string>={
 'New Castle':'https://salesweb.civilview.com/Sales/SalesSearch?countyId=24',
 'Sussex':'https://salesweb.civilview.com/Sales/SalesSearch?countyId=12'
};
export type CivilViewSale={county:'New Castle'|'Kent'|'Sussex';status:string;saleDate:string|null;sheriffNumber:string;attorney?:string;plaintiff:string;parcelNumber?:string;defendant:string;address:string;sourceUrl:string};
const clean=(h:string)=>h.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<br\s*\/?>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&#x27;|&#39;/gi,"'").replace(/&quot;/gi,'"').replace(/\s+/g,' ').trim();
const abs=(h:string,b:string)=>{try{return new URL(h,b).toString()}catch{return b}};
async function html(url:string){const r=await fetch(url,{headers:{'user-agent':'DelawareAuctionIntelligence/1.0 private-research','accept':'text/html'}});if(!r.ok)throw new Error(`CivilView ${r.status}`);return r.text()}
async function kent(){const h=await html(HOME);const a=[...h.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];const x=a.find(m=>/Kent County,\s*DE/i.test(clean(m[2])));if(!x)throw new Error('Kent County CivilView link not discovered');return abs(x[1],HOME)}
function dt(s:string){const m=s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM))?/i);if(!m)return null;let h=Number(m[4]||12);if(m[6]?.toUpperCase()==='PM'&&h<12)h+=12;if(m[6]?.toUpperCase()==='AM'&&h===12)h=0;return `${m[3]}-${String(m[1]).padStart(2,'0')}-${String(m[2]).padStart(2,'0')}T${String(h).padStart(2,'0')}:${m[5]||'00'}:00-04:00`}
function rows(h:string,county:CivilViewSale['county'],url:string){let heads:string[]=[];const out:CivilViewSale[]=[];for(const rm of h.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){const hs=[...rm[1].matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map(x=>clean(x[1]).toLowerCase());if(hs.length){heads=hs;continue}const cells=[...rm[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)];if(!cells.length)continue;const v=cells.map(x=>clean(x[1]));const get=(...n:string[])=>{const i=heads.findIndex(h=>n.some(z=>h.includes(z)));return i>=0?v[i]||'':''};const sheriff=get('sheriff');const address=get('address');if(!sheriff||!address)continue;const hrefs=[...rm[1].matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map(x=>x[1]);const detail=hrefs.find(x=>/SaleDetails|PropertyId/i.test(x));out.push({county,status:get('status')||'Scheduled',saleDate:dt(get('sale date','sales date')),sheriffNumber:sheriff,attorney:get('attorney')||undefined,plaintiff:get('plaintiff'),parcelNumber:get('parcel')||undefined,defendant:get('defendant'),address,sourceUrl:detail?abs(detail,url):url})}return out}
export async function scanCivilView(countyFilter?:CivilViewSale['county']){
 const urls:any={...KNOWN,Kent:await kent()};
 const entries=(Object.entries(urls) as [CivilViewSale['county'],string][]).filter(([c])=>!countyFilter||c===countyFilter);
 const results=await Promise.allSettled(entries.map(async([county,url])=>rows(await html(url),county,url)));
 const sales:CivilViewSale[]=[];const errors:string[]=[];
 results.forEach((r,i)=>r.status==='fulfilled'?sales.push(...r.value):errors.push(`${entries[i][0]}: ${String((r as any).reason?.message||(r as any).reason)}`));
 return {sales,errors,scannedAt:new Date().toISOString()}
}
