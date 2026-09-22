import { NextResponse } from 'next/server';
import { scanCivilView } from '@/lib/civilview';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function cityFromAddress(address:string){
  const m=address.match(/\s([A-Za-z .'-]+)\s+DE\s+\d{5}\s*$/i);
  return m ? m[1].trim().replace(/\b\w/g,c=>c.toUpperCase()) : '';
}
export async function POST(){
  try{
    const db=getSupabaseAdmin();
    const scan=await scanCivilView();
    let saved=0, updated=0;
    for(const s of scan.sales){
      let property:any=null;
      if(s.parcelNumber){
        const q=await db.from('properties').select('id').eq('county',s.county).eq('parcel_number',s.parcelNumber).maybeSingle();
        property=q.data;
      }
      if(!property){
        const q=await db.from('properties').select('id').eq('county',s.county).eq('address',s.address).maybeSingle();
        property=q.data;
      }
      if(!property){
        const ins=await db.from('properties').insert({
          address:s.address, city:cityFromAddress(s.address), county:s.county,
          parcel_number:s.parcelNumber||null, owner_name:s.defendant||null
        }).select('id').single();
        if(ins.error) throw ins.error;
        property=ins.data; saved++;
      } else updated++;
      const auction=await db.from('auctions').upsert({
        property_id:property.id, source:'CivilView', sheriff_number:s.sheriffNumber,
        sale_date:s.saleDate, plaintiff:s.plaintiff, defendant:s.defendant,
        status:s.status.toLowerCase(), source_url:s.sourceUrl, retrieved_at:new Date().toISOString()
      },{onConflict:'source,sheriff_number'});
      if(auction.error) throw auction.error;
      await db.from('sources').insert({
        property_id:property.id, provider:'CivilView', source_type:'auction_listing',
        source_url:s.sourceUrl, external_reference:s.sheriffNumber,
        verification_status:'source_record',
        payload:{county:s.county,status:s.status,attorney:s.attorney||null,parcel:s.parcelNumber||null}
      });
    }
    return NextResponse.json({ok:true,found:scan.sales.length,newProperties:saved,matchedProperties:updated,errors:scan.errors,scannedAt:scan.scannedAt});
  }catch(e:any){
    return NextResponse.json({ok:false,error:e?.message||'Scan failed'},{status:500});
  }
}
