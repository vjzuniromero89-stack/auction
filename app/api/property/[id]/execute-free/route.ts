import {NextResponse} from 'next/server';import {getSupabaseAdmin} from '@/lib/supabase-admin';import {runNewCastleFree} from '@/lib/providers/newcastle-free';
export const dynamic='force-dynamic';
export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){try{
 const {id}=await params,db=getSupabaseAdmin();const pq=await db.from('properties').select('*').eq('id',id).single();if(pq.error)throw pq.error;const p=pq.data;
 if(p.county!=='New Castle')return NextResponse.json({ok:true,executed:0,message:'Free live connector currently implemented for New Castle; other county connectors remain manual.'});
 const results=await runNewCastleFree();let captured=0;
 for(const x of results){
  const sourceKey=`free:${x.key}:${p.parcel_number||p.id}`;
  const payload={label:x.label,httpStatus:x.httpStatus,reachable:x.reachable,excerpt:x.excerpt||null,identifiers:{parcel:p.parcel_number,address:p.address,owner:p.owner_name},note:'Captured public source availability. Interactive search results are not claimed unless actually returned.'};
  const existing=await db.from('sources').select('id').eq('property_id',id).eq('source_key',sourceKey).maybeSingle();
  const row={property_id:id,provider:x.label,source_type:x.type,source_url:x.finalUrl||x.url,external_reference:p.parcel_number||null,verification_status:x.reachable?'source_reachable':'source_unavailable',content_type:x.contentType||'text/html',captured_at:new Date().toISOString(),evidence_note:'Official free public source capture',payload,source_key:sourceKey,query_terms:{parcel:p.parcel_number,address:p.address,owner:p.owner_name}};
  const q=existing.data?await db.from('sources').update(row).eq('id',existing.data.id):await db.from('sources').insert(row);if(q.error)throw q.error;
  await db.from('research_tasks').update({last_http_status:x.httpStatus,last_checked_at:new Date().toISOString(),status:x.reachable?'manual_review_required':'source_unavailable',result:payload}).eq('property_id',id).eq('provider',x.key);
  if(x.reachable)captured++;
 }
 return NextResponse.json({ok:true,executed:results.length,captured,results:results.map(x=>({source:x.label,status:x.httpStatus,reachable:x.reachable}))})
}catch(e:any){return NextResponse.json({ok:false,error:e?.message||String(e)},{status:500})}}
