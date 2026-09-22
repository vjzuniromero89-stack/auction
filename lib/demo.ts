export type Property={id:string,address:string,city:string,county:string,parcel:string,saleDate:string,openingBid:number,marketValue:number,arv:number,repairs:number,taxes:number,liens:number,titleStatus:'Clear scan'|'Review'|'High risk',potential:'High'|'Medium'|'Low',issues:number};
export const properties:Property[]=[
{id:'dover-127',address:'127 Example St',city:'Dover',county:'Kent',parcel:'ED-00-000.00-00-00.00',saleDate:'Oct 15, 2026',openingBid:118000,marketValue:315000,arv:327000,repairs:38000,taxes:2870,liens:5800,titleStatus:'Review',potential:'High',issues:2},
{id:'wilmington-42',address:'42 Market Ave',city:'Wilmington',county:'New Castle',parcel:'26-000.00-000',saleDate:'Oct 20, 2026',openingBid:164000,marketValue:286000,arv:305000,repairs:42000,taxes:4100,liens:14500,titleStatus:'High risk',potential:'Low',issues:4},
{id:'milford-88',address:'88 Walnut Ln',city:'Milford',county:'Sussex',parcel:'1-30-00.00-000.00',saleDate:'Nov 03, 2026',openingBid:132000,marketValue:298000,arv:320000,repairs:31000,taxes:2400,liens:0,titleStatus:'Clear scan',potential:'High',issues:0},
{id:'middletown-9',address:'9 Cedar Ct',city:'Middletown',county:'New Castle',parcel:'23-000.00-000',saleDate:'Nov 10, 2026',openingBid:205000,marketValue:410000,arv:438000,repairs:55000,taxes:3900,liens:7200,titleStatus:'Review',potential:'Medium',issues:1}
];
export function maxBid(p:Property){return Math.max(0,Math.round(p.arv*.72-p.repairs-p.taxes-p.liens-15000));}
