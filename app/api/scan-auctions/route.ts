import {NextResponse} from 'next/server';import {scanCivilView} from '@/lib/civilview';import {getSupabaseAdmin} from '@/lib/supabase-admin';
export const dynamic='force-dynamic';
const city=(a:string)=>{const m=a.match(/\s([A-Za-z .'-]+)\s+DE\s+(\d{5})\s*$/i);return {city:m?.[1]?.trim()||'',zip:m?.[2]||''}};
export async function POST(req:Request){try{
 const body=await req.json().catch(()=>({}));const county=body.county as any;
 const db=getSupabaseAdmin(),scan=await scanCivilView(county);
 if(!scan.sales.length)return NextResponse.json({ok:true,found:0,newProperties:0,errors:scan.errors,scannedAt:scan.scannedAt});
 // Upsert properties in ONE request. Address+county is our discovery identity; parcel is retained when present.
 const propertyRows=scan.sales.map(s=>{const l=city(s.address);return {address:s.address,city:l.city,zip_code:l.zip,county:s.county,parcel_number:s.parcelNumber||null,owner_name:s.defendant||null,updated_at:new Date().toISOString()}});
 const uniqueProps=[...new Map(propertyRows.map(x=>[`${x.county}|${x.address}`.toLowerCase(),x])).values()];
 // Existing rows fetched in one request for county; avoid N queries.
 const counties=[...new Set(uniqueProps.map(x=>x.county))];
 const existingQ=await db.from('properties').select('id,address,county').in('county',counties);
 if(existingQ.error)throw existingQ.error;
 const existing=new Map((existingQ.data||[]).map((x:any)=>[`${x.county}|${x.address}`.toLowerCase(),x.id]));
 const missing=uniqueProps.filter(x=>!existing.has(`${x.county}|${x.address}`.toLowerCase()));
 if(missing.length){const ins=await db.from('properties').insert(missing).select('id,address,county');if(ins.error)throw ins.error;(ins.data||[]).forEach((x:any)=>existing.set(`${x.county}|${x.address}`.toLowerCase(),x.id))}
 // Auction existing IDs in one query.
 const sheriffs=scan.sales.map(s=>s.sheriffNumber).filter(Boolean);
 const oldA=await db.from('auctions').select('id,sheriff_number').eq('source','CivilView').in('sheriff_number',sheriffs);
 if(oldA.error)throw oldA.error;const oldMap=new Map((oldA.data||[]).map((x:any)=>[x.sheriff_number,x.id]));
 const inserts:any[]=[],updates:any[]=[];
 for(const s of scan.sales){const pid=existing.get(`${s.county}|${s.address}`.toLowerCase());if(!pid)continue;const row={property_id:pid,source:'CivilView',sheriff_number:s.sheriffNumber,sale_date:s.saleDate,plaintiff:s.plaintiff,defendant:s.defendant,status:s.status.toLowerCase(),source_url:s.sourceUrl,retrieved_at:new Date().toISOString(),attorney:s.attorney||null};oldMap.has(s.sheriffNumber)?updates.push({...row,id:oldMap.get(s.sheriffNumber)}):inserts.push(row)}
 if(inserts.length){const q=await db.from('auctions').insert(inserts);if(q.error)throw q.error}
 // updates batched via upsert by primary id
 if(updates.length){const q=await db.from('auctions').upsert(updates,{onConflict:'id'});if(q.error)throw q.error}
 // Sources inserted in one batch.
 const sources=scan.sales.map(s=>({property_id:existing.get(`${s.county}|${s.address}`.toLowerCase()),provider:'CivilView',source_type:'auction_listing',source_url:s.sourceUrl,external_reference:s.sheriffNumber,verification_status:'source_record',payload:s})).filter(x=>x.property_id);
 if(sources.length){const q=await db.from('sources').insert(sources);if(q.error)throw q.error}
 await db.from('provider_events').insert({provider:'CivilView',event_type:'scan',status:scan.errors.length?'partial':'success',message:`${scan.sales.length} listings`,metadata:{county:county||'all',errors:scan.errors}});
 return NextResponse.json({ok:true,found:scan.sales.length,newProperties:missing.length,matchedProperties:uniqueProps.length-missing.length,errors:scan.errors,scannedAt:scan.scannedAt})
}catch(e:any){return NextResponse.json({ok:false,error:e?.message||'Scan failed'},{status:500})}}
