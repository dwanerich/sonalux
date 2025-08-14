// components/TermsPopup.js
import { useState, useEffect } from 'react';
import styles from '../styles/TermsPopup.module.css';

export default function TermsPopup({ onAgree }) {
  const [visible, setVisible] = useState(true);

  const handleAgree = () => {
    // localStorage.setItem('sonalux-terms-agreed', 'true'); // temporarily disabled
    setVisible(false);
    if (onAgree) onAgree();
  };

  useEffect(() => {
    // const agreed = localStorage.getItem('sonalux-terms-agreed');
    // if (agreed) setVisible(false);
    setVisible(true); // Always show for now
  }, []);

  if (!visible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <h2>SONALUX TERMS</h2>
        <p className={styles.summary}>
          By using SONALUX, you agree to our remix guidelines and AI usage terms.
        </p>
        <button className={styles.button} onClick={handleAgree}>
          I AGREE
        </button>
      </div>
    </div>
  );
}
