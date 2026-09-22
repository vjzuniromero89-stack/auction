const HOME = 'https://salesweb.civilview.com/';
const KNOWN: Record<string,string> = {
  'New Castle': 'https://salesweb.civilview.com/Sales/SalesSearch?countyId=24',
  'Sussex': 'https://salesweb.civilview.com/Sales/SalesSearch?countyId=12'
};

export type CivilViewSale = {
  county: 'New Castle'|'Kent'|'Sussex';
  status: string;
  saleDate: string|null;
  sheriffNumber: string;
  attorney?: string;
  plaintiff: string;
  parcelNumber?: string;
  defendant: string;
  address: string;
  sourceUrl: string;
};

function text(html:string) {
  return html.replace(/<br\s*\/?>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&nbsp;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&#x27;|&#39;/gi,"'")
    .replace(/&quot;/gi,'"')
    .replace(/\s+/g,' ').trim();
}
function abs(href:string, base:string) {
  try { return new URL(href, base).toString(); } catch { return base; }
}
async function fetchHtml(url:string) {
  const r = await fetch(url, {
    headers: {'user-agent':'DelawareAuctionIntelligence/1.0 (+private research tool)','accept':'text/html'}
  });
  if (!r.ok) throw new Error(`CivilView ${r.status} for ${url}`);
  return r.text();
}
async function discoverKent(): Promise<string> {
  const html = await fetchHtml(HOME);
  const anchors = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const hit = anchors.find(m => /Kent County,\s*DE/i.test(text(m[2])));
  if (!hit) throw new Error('Kent County CivilView link was not discovered');
  return abs(hit[1], HOME);
}
function parseDate(raw:string): string|null {
  const m = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM))?/i);
  if (!m) return null;
  let hour = Number(m[4]||'12');
  if (m[6]?.toUpperCase()==='PM' && hour<12) hour += 12;
  if (m[6]?.toUpperCase()==='AM' && hour===12) hour = 0;
  const mm=String(m[1]).padStart(2,'0'), dd=String(m[2]).padStart(2,'0'), hh=String(hour).padStart(2,'0');
  return `${m[3]}-${mm}-${dd}T${hh}:${m[5]||'00'}:00-04:00`;
}
function parseTable(html:string, county:CivilViewSale['county'], pageUrl:string): CivilViewSale[] {
  const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
  let headers:string[]=[];
  const out:CivilViewSale[]=[];
  for (const row of rows) {
    const hs=[...row[1].matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map(x=>text(x[1]).toLowerCase());
    if (hs.length) { headers=hs; continue; }
    const tds=[...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)];
    if (!tds.length) continue;
    const vals=tds.map(x=>text(x[1]));
    const get=(...names:string[])=>{
      const i=headers.findIndex(h=>names.some(n=>h.includes(n)));
      return i>=0 ? vals[i]||'' : '';
    };
    const sheriff=get('sheriff');
    const address=get('address');
    if (!sheriff || !address) continue;
    const hrefs=[...row[1].matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map(x=>x[1]);
    const detail=hrefs.find(h=>/SaleDetails|PropertyId/i.test(h));
    out.push({
      county,
      status:get('status') || 'Scheduled',
      saleDate:parseDate(get('sale date','sales date')),
      sheriffNumber:sheriff,
      attorney:get('attorney') || undefined,
      plaintiff:get('plaintiff'),
      parcelNumber:get('parcel') || undefined,
      defendant:get('defendant'),
      address,
      sourceUrl: detail ? abs(detail,pageUrl) : pageUrl
    });
  }
  return out;
}
export async function scanCivilView() {
  const kent = await discoverKent();
  const urls: Record<CivilViewSale['county'],string> = {...KNOWN, Kent:kent} as any;
  const counties = Object.entries(urls) as [CivilViewSale['county'],string][];
  const settled = await Promise.allSettled(counties.map(async ([county,url])=>{
    const html=await fetchHtml(url);
    return {county,url,sales:parseTable(html,county,url)};
  }));
  const sales:CivilViewSale[]=[]; const errors:string[]=[];
  settled.forEach((r,i)=>{
    if(r.status==='fulfilled') sales.push(...r.value.sales);
    else errors.push(`${counties[i][0]}: ${String(r.reason?.message||r.reason)}`);
  });
  return {sales,errors,scannedAt:new Date().toISOString()};
}
