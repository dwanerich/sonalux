import './globals.css';
import Link from 'next/link';
// import TermsPopup from '@/components/ui/TermsPopup';

export const metadata = { title: 'Sonalux Audio', description: 'Genre·Mood·Intensity repattern engine' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <div className="header-inner">
            <div className="logo">SONALUX <span className="tag">LABS</span></div>
            <nav className="nav">
              <Link href="/">Home</Link><Link href="/packs">Packs</Link><Link href="/bank">Bank</Link>
            <Link href="/">Lab</Link>
              {/* <Link href="/api/health">Health</Link> */}
              {/* <a href="https://example.com" target="_blank" rel="noreferrer">Docs</a> */}
            </nav>
          </div>
        </header>
        <main className="main">{children}</main>
        {/* <TermsPopup /> */}
        <PlayerBar />
      </body>
    </html>
  );
}

function TermsGate(){
  if (typeof window === 'undefined') return null;
  const agreed = typeof window !== 'undefined' && window.localStorage.getItem('gmi_terms_agree') === '1';
  if (agreed) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Terms</h3>
        <p className="opacity-80 text-sm">By continuing, you agree that you have rights to process the uploaded audio and that outputs are for evaluation. No unlawful or infringing uploads.</p>
        <div style={{display:'flex', gap:8, marginTop:12, justifyContent:'flex-end'}}>
          <button className="button" onClick={()=>{ localStorage.setItem('gmi_terms_agree','1'); location.reload(); }}>Agree & Continue</button>
        </div>
      </div>
    </div>
  );
}

function PlayerBar(){
  return (
    <div className="player-bar">
      <audio id="site-player" controls style={{width:'100%'}} />
    </div>
  );
}
