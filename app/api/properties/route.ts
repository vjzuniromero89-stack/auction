import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
export const dynamic='force-dynamic';
export async function GET(){
  try{
    const db=getSupabaseAdmin();
    const {data,error}=await db.from('auctions')
      .select('id,sheriff_number,sale_date,opening_bid,status,source_url,plaintiff,defendant,properties(id,address,city,county,parcel_number,owner_name)')
      .order('sale_date',{ascending:true}).limit(250);
    if(error) throw error;
    return NextResponse.json({data:data||[],mode:'live'});
  }catch(e:any){
    return NextResponse.json({data:[],mode:'error',error:e?.message||'Database unavailable'},{status:500});
  }
}
