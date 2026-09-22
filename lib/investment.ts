export type BidInputs={arv:number;repairs:number;taxes:number;survivingLiens:number;closingAndCarry:number;riskReserve:number;desiredProfit:number;acquisitionCosts:number;financingCosts:number};
export function bidModel(i:BidInputs){
 const deductions=i.repairs+i.taxes+i.survivingLiens+i.closingAndCarry+i.riskReserve+i.desiredProfit+i.acquisitionCosts+i.financingCosts;
 return {maxBid:Math.max(0,i.arv-deductions),deductions};
}
