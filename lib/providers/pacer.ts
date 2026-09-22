export async function runPacer(owner:string){
 const user=process.env.PACER_USERNAME,pass=process.env.PACER_PASSWORD;
 if(!user||!pass)return {status:'credentials_required',evidence:[],message:'PACER_USERNAME/PACER_PASSWORD not configured'};
 if(process.env.PACER_ENABLE_BILLABLE_SEARCH!=='true')return {status:'billing_authorization_required',evidence:[],message:'PACER is configured but billable production search is disabled. Set PACER_ENABLE_BILLABLE_SEARCH=true only after approving PACER charges.'};
 // PACER production API is billable. We do not guess endpoint payload fields across API revisions.
 // Keep execution gated until account MFA/client-code requirements are known.
 return {status:'manual_review_required',evidence:[],message:`PACER credentials detected for ${owner}, but production execution requires account-specific MFA/client-code validation before billable calls.`}
}
