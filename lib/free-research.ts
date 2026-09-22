import {getSupabaseAdmin} from '@/lib/supabase-admin';import {RESEARCH_SOURCES} from '@/lib/research-sources';import {runNewCastleFree} from '@/lib/providers/newcastle-free';
const checks=['county_property','deed_chain','mortgages','assignments_releases','judgments','state_tax_liens','federal_tax_liens','municipal_tax_water_sewer','hoa_condo','bankruptcy','occupancy','valuation','comparables'];
export async function runFreeResearch(id:string){
 const db=getSupabaseAdmin();const pq=await db.from('properties').select('*').eq('id',id).single();if(pq.error)throw pq.error;const p=pq.data;
 const rr=await db.from('free_research_runs').insert({property_id:id,status:'running'}).select('id').single();if(rr.error)throw rr.error;
 await db.from('research_tasks').update({status:'disabled_paid_provider',access_cost:'paid'}).eq('property_id',id).in('provider',['attom','pacer','first_american','datatree','corelogic']);
 let count=0;
 for(const type of checks){
   let src=RESEARCH_SOURCES.filter(s=>(s.kind===type||(['mortgages','assignments_releases','state_tax_liens','federal_tax_liens','hoa_condo'].includes(type)&&s.kind==='deed_chain'))&&(!s.counties||s.counties.includes(p.county)));
   if(type==='judgments')src=RESEARCH_SOURCES.filter(s=>s.kind==='judgments');
   const status=src.length?'manual_review_required':'free_source_not_configured';
   const result={mode:'FREE_ONLY',identifiers:{address:p.address,parcel:p.parcel_number,owner:p.owner_name},sources:src.map(s=>({label:s.label,url:s.url,note:s.note,free:s.free})),message:src.length?'Free official source identified. Open/search and attach evidence; no paid query will run.':'No reliable $0 machine source configured; do not infer NOT FOUND.'};
   const old=await db.from('due_diligence_checks').select('id').eq('property_id',id).eq('check_type',type).maybeSingle();
   const row={property_id:id,check_type:type,status,result,source:src.map(x=>x.label).join(', ')||'FREE-ONLY research',checked_at:null};
   if(old.data){const q=await db.from('due_diligence_checks').update(row).eq('id',old.data.id);if(q.error)throw q.error}else{const q=await db.from('due_diligence_checks').insert(row);if(q.error)throw q.error}
   for(const s of src){
     const ex=await db.from('research_tasks').select('id').eq('property_id',id).eq('task_type',type).eq('provider',s.key).maybeSingle();
     const task={property_id:id,task_type:type,provider:s.key,status:'manual_review_required',access_cost:'free',execution_mode:s.automated?'automatic':'manual',query_url:s.url,result:{label:s.label,note:s.note,identifiers:{parcel:p.parcel_number,owner:p.owner_name,address:p.address}}};
     if(ex.data){const q=await db.from('research_tasks').update(task).eq('id',ex.data.id);if(q.error)throw q.error}else{const q=await db.from('research_tasks').insert(task);if(q.error)throw q.error} count++;
   }
 }
 const done=await db.from('free_research_runs').update({status:'complete',sources_checked:count,completed_at:new Date().toISOString(),notes:[{mode:'FREE_ONLY'},{rule:'No paid provider calls. Missing access never becomes NOT FOUND.'}]}).eq('id',rr.data.id);if(done.error)throw done.error;
 let liveCaptured=0;
 if(p.county==='New Castle'){
  const live=await runNewCastleFree();
  for(const x of live){
   const sourceKey=`free:${x.key}:${p.parcel_number||p.id}`;
   const payload={label:x.label,httpStatus:x.httpStatus,reachable:x.reachable,excerpt:x.excerpt||null,identifiers:{parcel:p.parcel_number,address:p.address,owner:p.owner_name},note:'Official public source reached. Interactive form results are not represented as searched unless actually returned.'};
   const ex=await db.from('sources').select('id').eq('property_id',id).eq('source_key',sourceKey).maybeSingle();
   const row={property_id:id,provider:x.label,source_type:x.type,source_url:x.finalUrl||x.url,external_reference:p.parcel_number||null,verification_status:x.reachable?'source_reachable':'source_unavailable',content_type:x.contentType||'text/html',captured_at:new Date().toISOString(),evidence_note:'Official free public source capture',payload,source_key:sourceKey,query_terms:{parcel:p.parcel_number,address:p.address,owner:p.owner_name}};
   const q=ex.data?await db.from('sources').update(row).eq('id',ex.data.id):await db.from('sources').insert(row);if(q.error)throw q.error;
   if(x.reachable)liveCaptured++;
  }
 }
 return {ok:true,mode:'FREE_ONLY',sources:count,liveCaptured,property:{address:p.address,parcel:p.parcel_number,owner:p.owner_name,county:p.county}};
}
