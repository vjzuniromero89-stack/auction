import {LayoutDashboard,Gavel,Search,Building2,FileCheck,Landmark,Calculator,Database} from 'lucide-react';

const items=[
 ['Dashboard','/',LayoutDashboard],
 ['Subastas','/',Gavel],
 ['Oportunidades','/',Search],
 ['Propiedades','/',Building2],
 ['Due Diligence','/',FileCheck],
 ['Title & Liens','/',Landmark],
 ['Bid Calculator','/',Calculator],
 ['Fuentes','/sources',Database]
] as const;

const S={
 aside:{width:298,minWidth:298,height:'100vh',position:'fixed' as const,left:0,top:0,boxSizing:'border-box' as const,background:'#091827',borderRight:'1px solid #1b3142',padding:'26px 18px',display:'flex',flexDirection:'column' as const,zIndex:50,overflowY:'auto' as const},
 brand:{display:'flex',alignItems:'center',gap:14,marginBottom:34},
 logo:{width:52,height:52,minWidth:52,borderRadius:14,background:'#29d6ad',color:'#052019',display:'grid',placeItems:'center',fontWeight:900,fontSize:18},
 brandText:{display:'flex',flexDirection:'column' as const,gap:3,minWidth:0},
 title:{fontSize:18,fontWeight:800,color:'#fff',lineHeight:1.15,whiteSpace:'nowrap' as const},
 sub:{fontSize:12,letterSpacing:2,color:'#789bb5',whiteSpace:'nowrap' as const},
 nav:{display:'flex',flexDirection:'column' as const,gap:7,width:'100%'},
 link:{display:'flex',alignItems:'center',gap:13,width:'100%',boxSizing:'border-box' as const,padding:'13px 14px',borderRadius:11,color:'#8fb0c8',textDecoration:'none',fontSize:16,lineHeight:1.25,whiteSpace:'nowrap' as const},
 active:{background:'#123044',color:'#37e0b8'},
 note:{marginTop:'auto',border:'1px solid #1e3b4e',background:'#0e2637',borderRadius:14,padding:16,display:'flex',flexDirection:'column' as const,gap:6},
 noteTitle:{fontWeight:800,color:'#fff',fontSize:16},
 noteLive:{color:'#35deb7',fontSize:14},
 noteSmall:{color:'#789bb5',lineHeight:1.4,fontSize:12}
};

export default function Nav(){
 return <aside className="sidebar fixedSidebar" style={S.aside}>
   <div style={S.brand}>
     <div style={S.logo}>DA</div>
     <div style={S.brandText}>
       <b style={S.title}>Delaware Auction</b>
       <span style={S.sub}>INTELLIGENCE</span>
     </div>
   </div>
   <nav style={S.nav}>
     {items.map(([name,href,Icon],i)=>
       <a key={name} href={href} style={{...S.link,...(i===0?S.active:{})}}>
         <Icon size={20} style={{minWidth:20}}/>
         <span>{name}</span>
       </a>
     )}
   </nav>
   <div style={S.note}>
     <b style={S.noteTitle}>Evidence Engine</b>
     <span style={S.noteLive}>Live auction discovery</span>
     <small style={S.noteSmall}>Title conclusions require verified sources.</small>
   </div>
 </aside>
}
