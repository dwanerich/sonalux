// /components/ui/RemixStatusBar.js

import { useEffect, useState } from 'react';

const RemixStatusBar = () => {
  const [status, setStatus] = useState('⏳ Checking...');

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch('/api/remix/status');
      const data = await res.json();
      setStatus(data.message);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      marginTop: '30px',
      padding: '12px',
      background: '#111',
      border: '1px solid #333',
      borderRadius: '10px',
      fontSize: '14px',
      color: '#0cf'
    }}>
      Status: {status}
    </div>
  );
};

export default RemixStatusBar;
