import React, { useEffect, useState } from 'react';
import styles from '../../styles/RemixModule.module.css';
import Link from 'next/link';

export default function RemixHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('remixHistory');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  return (
    <div className={styles.remixModulePanelCompact}>
      <h1 className={styles.sectionTitle}>Remix History</h1>

      {history.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#888' }}>
          No remixes found yet.
        </p>
      ) : (
        <div className={styles.remixFormPanelCompact}>
          {history.map((entry, idx) => (
            <div key={idx} style={{ borderBottom: '1px solid #222', paddingBottom: 12, marginBottom: 12 }}>
              <div><strong>Prompt:</strong> {entry.prompt}</div>
              <div><strong>Genre:</strong> {entry.genre}</div>
              <div><strong>Vocal:</strong> {entry.vocal}</div>
              <div><strong>Power:</strong> {entry.remixPower}</div>
            </div>
          ))}
        </div>
      )}

      <Link href="/remix" className={styles.remixButtonModern} style={{ display: 'block', marginTop: 20, textAlign: 'center' }}>
        Back to Remix
      </Link>
    </div>
  );
}
