import {publicGet,textOnly} from './public-web';
const SOURCES=[
 {key:'ncc_parcel',type:'county_property',url:'https://www3.newcastlede.gov/parcel/search/',label:'New Castle County Parcel Search'},
 {key:'ncc_recorder',type:'deed_chain',url:'https://www.newcastlede.gov/144/Document-Search',label:'New Castle County Recorder Document Search'},
 {key:'ncc_tax',type:'municipal_tax_water_sewer',url:'https://www.newcastlede.gov/232/Tax-Information-Forms',label:'New Castle County Tax Information'},
 {key:'ncc_hoa',type:'hoa_condo',url:'https://www.newcastlede.gov/2618/Community-Association-Portal',label:'New Castle County Community Association Portal'},
 {key:'de_courtconnect',type:'judgments',url:'https://courtconnect.courts.delaware.gov/cc/cconnect/ck_public_qry_main.cp_main_srch_options',label:'Delaware CourtConnect'}
];
export async function runNewCastleFree(){
 const out:any[]=[];
 for(const s of SOURCES){try{const r=await publicGet(s.url);out.push({...s,httpStatus:r.status,reachable:r.ok,finalUrl:r.url,contentType:r.contentType,excerpt:textOnly(r.text).slice(0,1200)})}catch(e:any){out.push({...s,httpStatus:0,reachable:false,error:e.message})}}
 return out;
}
