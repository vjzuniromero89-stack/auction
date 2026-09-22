export type ResearchSource={key:string;label:string;kind:string;counties?:string[];url:string;automated:boolean;note:string};
export const RESEARCH_SOURCES:ResearchSource[]=[
{key:'ncc_property',label:'New Castle County Parcel Search',kind:'county_property',counties:['New Castle'],url:'https://www3.newcastlede.gov/parcel/search/',automated:false,note:'Official county verification source.'},
{key:'ncc_recorder',label:'New Castle County Recorder Document Search',kind:'deed_chain',counties:['New Castle'],url:'https://www.newcastlede.gov/144/Document-Search',automated:false,note:'Official recorder source; document retrieval may require interactive search/payment.'},
{key:'kent_property',label:'Kent County Property Records',kind:'county_property',counties:['Kent'],url:'https://propertyrecords.kentcountyde.gov/',automated:false,note:'Official county property records.'},
{key:'kent_deeds',label:'Kent County Deeds Search',kind:'deed_chain',counties:['Kent'],url:'https://i2g.uslandrecords.com/DE/Kent2/D/Default.aspx',automated:false,note:'Official recorder search; viewing is available, document download may be paid.'},
{key:'sussex_property',label:'Sussex County Property Search',kind:'county_property',counties:['Sussex'],url:'https://property.sussexcountyde.gov/',automated:false,note:'Official county property source.'},
{key:'sussex_deeds',label:'Sussex County Landmark',kind:'deed_chain',counties:['Sussex'],url:'https://deeds.sussexcountyde.gov/LandmarkWeb/Home/Index',automated:false,note:'Official recorder system with parcel/name/instrument searches.'},
{key:'courtconnect',label:'Delaware CourtConnect',kind:'judgments',url:'https://courtconnect.courts.delaware.gov/cc/cconnect/ck_public_qry_main.cp_main_srch_options',automated:false,note:'Official Delaware court search; interactive/manual verification until an authorized API is available.'},
{key:'pacer',label:'PACER Case Locator API',kind:'bankruptcy',url:'https://pcl.uscourts.gov/',automated:true,note:'Official federal case index; production searches require PACER credentials and are billable.'}
];
