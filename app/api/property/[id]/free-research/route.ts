import {NextResponse} from 'next/server';import {runFreeResearch} from '@/lib/free-research';
export const dynamic='force-dynamic';
export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){try{const {id}=await params;return NextResponse.json(await runFreeResearch(id))}catch(e:any){return NextResponse.json({ok:false,error:e?.message||String(e)},{status:500})}}
