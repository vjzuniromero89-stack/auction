import {publicGet,textOnly} from './public-web';
export type PublicProbe={key:string;label:string;kind:string;url:string;status:number;reachable:boolean;finalUrl:string;contentType:string;excerpt:string;automatedResult:boolean;note:string};
const county:any={
 'New Castle':[
  ['ncc_property','New Castle County Parcel Search','county_property','https://www3.newcastlede.gov/parcel/search/'],
  ['ncc_recorder','New Castle County Recorder Document Search','deed_chain','https://www.newcastlede.gov/144/Document-Search'],
  ['ncc_tax','New Castle County Tax Information','municipal_tax_water_sewer','https://www.newcastlede.gov/232/Tax-Information-Forms'],
  ['ncc_hoa','New Castle Community Association Portal','hoa_condo','https://www.newcastlede.gov/2618/Community-Association-Portal']],
 'Kent':[
  ['kent_property','Kent County Property Records','county_property','https://propertyrecords.kentcountyde.gov/'],
  ['kent_deeds','Kent County Deeds Search','deed_chain','https://i2g.uslandrecords.com/DE/Kent2/D/Default.aspx']],
 'Sussex':[
  ['sussex_property','Sussex County Property Search','county_property','https://property.sussexcountyde.gov/PT/forms/htmlframe.aspx?mode=content%2Fhome.htm'],
  ['sussex_deeds','Sussex County Landmark','deed_chain','https://deeds.sussexcountyde.gov/LandmarkWeb/Home/Index']]
};
const statewide=[['courtconnect','Delaware CourtConnect','judgments','https://courtconnect.courts.delaware.gov/cc/cconnect/ck_public_qry_main.cp_main_srch_options']];
export async function probeFreeSources(countyName:string):Promise<PublicProbe[]>{const defs=[...(county[countyName]||[]),...statewide];return Promise.all(defs.map(async(d:any)=>{try{const r=await publicGet(d[3]);return {key:d[0],label:d[1],kind:d[2],url:d[3],status:r.status,reachable:r.ok,finalUrl:r.url,contentType:r.contentType,excerpt:textOnly(r.text).slice(0,1600),automatedResult:false,note:'Public source reached. Interactive search is not claimed as completed unless result data is actually returned.'}}catch(e:any){return {key:d[0],label:d[1],kind:d[2],url:d[3],status:0,reachable:false,finalUrl:d[3],contentType:'',excerpt:'',automatedResult:false,note:e.message}}}))}

// Free geocoding uses the US Census public geocoder. Failure remains unresolved, never NOT FOUND.
export async function censusGeocode(address:string){try{const u='https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address='+encodeURIComponent(address+', DE')+'&benchmark=Public_AR_Current&vintage=Current_Current&format=json';const r=await fetch(u);if(!r.ok)return null;const j:any=await r.json();const m=j?.result?.addressMatches?.[0];if(!m)return null;return {lat:m.coordinates?.y,lon:m.coordinates?.x,matchedAddress:m.matchedAddress,raw:m,url:u}}catch{return null}}

// FEMA NFHL ArcGIS public service query by point. This is an actual machine query when coordinates exist.
export async function femaFlood(lat:number,lon:number){try{const base='https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query';const qs=new URLSearchParams({f:'json',geometry:`${lon},${lat}`,geometryType:'esriGeometryPoint',inSR:'4326',spatialRel:'esriSpatialRelIntersects',outFields:'*',returnGeometry:'false'});const url=base+'?'+qs.toString();const r=await fetch(url);if(!r.ok)return {ok:false,status:r.status,url};const j:any=await r.json();return {ok:true,status:r.status,url,features:j.features||[],raw:j}}catch(e:any){return {ok:false,status:0,error:e.message}}}
