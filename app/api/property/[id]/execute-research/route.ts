import {NextResponse} from 'next/server';import {getSupabaseAdmin} from '@/lib/supabase-admin';import {runAttom} from '@/lib/providers/attom';import {runPacer} from '@/lib/providers/pacer';
export const dynamic='force-dynamic';
async function saveEvidence(db:any,pid:string,provider:string,e:any){
 const s=await db.from('sources').insert({property_id:pid,provider,source_type:e.type,source_url:e.sourceUrl||null,verification_status:'found',content_type:'application/json',captured_at:new Date().toISOString(),evidence_note:'Live provider response',payload:e.data}).select('id').single();
 if(s.error)throw s.error;
 await db.from('property_facts').insert({property_id:pid,provider,fact_type:e.type,value:e.data,source_url:e.sourceUrl||null});
 return s.data.id;
}
export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){try{
 const {id}=await params,db=getSupabaseAdmin();const pq=await db.from('properties').select('*').eq('id',id).single();if(pq.error)throw pq.error;const p=pq.data;
 const tq=await db.from('research_tasks').select('*').eq('property_id',id).in('status',['pending','credentials_required','billing_authorization_required','provider_error']);if(tq.error)throw tq.error;
 const tasks=tq.data||[];const summary:any[]=[];
 // Run each provider once, then map evidence to relevant checks.
 const providers=[...new Set(tasks.map((t:any)=>t.provider))];
 for(const provider of providers){
  const pts=tasks.filter((t:any)=>t.provider===provider);for(const t of pts)await db.from('research_tasks').update({status:'running',started_at:new Date().toISOString(),attempts:(t.attempts||0)+1,error:null}).eq('id',t.id);
  let r:any;
  if(provider==='attom')r=await runAttom(p);
  else if(provider==='pacer')r=await runPacer(p.owner_name||'');
  else {r={status:'manual_review_required',evidence:[],message:'Official source has no authorized machine API configured. Open the source link and attach the official evidence.'}}
  let n=0;for(const e of r.evidence||[]){await saveEvidence(db,id,provider,e);n++}
  for(const t of pts){await db.from('research_tasks').update({status:r.status,result:{...(t.result||{}),provider_message:r.message},error:r.status==='provider_error'?r.message:null,evidence_count:n,completed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',t.id)}
  summary.push({provider,status:r.status,evidence:n,message:r.message});
 }
 // Mark ATTOM-backed checks FOUND only if actual evidence exists; never mark title clear.
 const facts=await db.from('property_facts').select('fact_type').eq('property_id',id).eq('provider','attom');
 const ft=new Set((facts.data||[]).map((x:any)=>x.fact_type));
 for(const [check,type] of [['county_property','property_detail'],['valuation','valuation'],['comparables','comparables']] as const){if(ft.has(type))await db.from('due_diligence_checks').update({status:'found',source:'ATTOM live API',checked_at:new Date().toISOString()}).eq('property_id',id).eq('check_type',check)}
 return NextResponse.json({ok:true,summary})
}catch(e:any){return NextResponse.json({ok:false,error:e.message},{status:500})}}
