import {NextResponse} from 'next/server';
export async function POST(){return NextResponse.json({ok:true,mode:'FREE_ONLY',summary:[],message:'Paid provider execution is disabled. Free official-source research tasks are used instead.'})}
