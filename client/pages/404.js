import Link from 'next/link';

export default function Custom404() {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'70vh'}}>
      <h1 style={{fontSize:48,marginBottom:12}}>404 — Page not found</h1>
      <p style={{marginBottom:16}}>We couldn't find that page. Try returning home.</p>
      <Link href="/">
        <a style={{padding:'8px 12px',background:'#ff7a18',color:'#fff',borderRadius:6}}>Go home</a>
      </Link>
    </div>
  );
}
