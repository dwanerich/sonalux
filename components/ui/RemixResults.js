import { useEffect, useState } from 'react';

export default function RemixResults({ result }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (result) {
      setIsVisible(true);
    }
  }, [result]);

  if (!isVisible) return null;

  return (
    <div style={{ marginTop: 48, width: '100%', maxWidth: 600 }}>
      <h3 style={{ fontSize: 20, fontWeight: 500, marginBottom: 16 }}>Remix Ready</h3>
      <audio controls style={{ width: '100%', borderRadius: 8 }}>
        <source src={result?.audioUrl} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      <p style={{ marginTop: 12, fontSize: 14, color: '#bbb' }}>{result?.summary}</p>
    </div>
  );
}