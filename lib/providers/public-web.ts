export async function publicGet(url:string){
 const r=await fetch(url,{headers:{accept:'text/html,application/xhtml+xml','user-agent':'DelawareAuctionIntelligence/1.0 (+private investment research)'}});
 const text=await r.text();
 return {ok:r.ok,status:r.status,url:r.url,contentType:r.headers.get('content-type')||'',text};
}
export function textOnly(h:string){return h.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim()}
