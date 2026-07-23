import { ImageResponse } from 'next/og';
export const alt = 'Mezgeb — Your business, clearly recorded';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function Image(){ return new ImageResponse(<div style={{ width:'100%',height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',padding:'80px',background:'#f5f5f7',color:'#1d1d1f',fontFamily:'sans-serif' }}><div style={{fontSize:34,color:'#0071e3'}}>Mezgeb መዝገብ</div><div style={{fontSize:92,fontWeight:700,letterSpacing:'-5px',lineHeight:1,marginTop:30}}>Your business.<br/>Clearly recorded.</div><div style={{fontSize:28,color:'#6e6e73',marginTop:36}}>Sales · Expenses · VAT receipts · Dube · Reports</div></div>, size); }
