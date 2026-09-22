import {NextResponse} from 'next/server';import {properties} from '@/lib/demo';export async function GET(){return NextResponse.json({data:properties,mode:'demo'});}
