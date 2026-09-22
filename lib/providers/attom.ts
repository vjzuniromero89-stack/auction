type P={id:string,address:string;city?:string;zip_code?:string;county?:string};
const base='https://api.gateway.attomdata.com/propertyapi/v1.0.0';
async function call(path:string,key:string){const r=await fetch(`${base}${path}`,{headers:{apikey:key,accept:'application/json'}});const txt=await r.text();if(!r.ok)throw new Error(`ATTOM ${r.status}: ${txt.slice(0,220)}`);return JSON.parse(txt)}
const enc=(x:any)=>encodeURIComponent(String(x||'').trim());
export async function runAttom(p:P){
 const key=process.env.ATTOM_API_KEY;if(!key)return {status:'credentials_required',evidence:[],message:'ATTOM_API_KEY not configured'};
 const addr=p.address.replace(/,\s*.*$/,'').replace(/\s+(WILMINGTON|DOVER|NEWARK|MIDDLETOWN|SMYRNA|GEORGETOWN|LEWES|SEAFORD)\s+DE\s+\d{5}$/i,'').trim();
 const city=p.city||((p.address.match(/\s([A-Za-z .'-]+)\s+DE\s+\d{5}/i)||[])[1]||'');
 const postal=p.zip_code||((p.address.match(/DE\s+(\d{5})/i)||[])[1]||'');
 const paths=[
  `/property/detail?address1=${enc(addr)}&address2=${enc(`${city}, DE ${postal}`)}`,
  `/attomavm/detail?address1=${enc(addr)}&address2=${enc(`${city}, DE ${postal}`)}`,
  `/salescomparables/address/${enc(addr)}/${enc(city)}/-/DE/${enc(postal)}?searchType=Radius&minComps=1&maxComps=10&miles=2&saleDateRange=12&distressed=IncludeDistressed`
 ];
 const labels=['property_detail','valuation','comparables'];const evidence:any[]=[];const errors:string[]=[];
 for(let i=0;i<paths.length;i++){try{const data=await call(paths[i],key);evidence.push({type:labels[i],data,sourceUrl:`${base}${paths[i]}`})}catch(e:any){errors.push(`${labels[i]}: ${e.message}`)}}
 return {status:evidence.length?'found':'provider_error',evidence,message:errors.join(' | ')||'ATTOM live data retrieved'}
}
