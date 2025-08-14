// components/Footer.jsx
import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <p>© {new Date().getFullYear()} SonaLux. All rights reserved.</p>
        <nav className={styles.footerNav}>
          <Link href="/legal/tos">Terms of Service</Link>
          <Link href="/legal/privacy">Privacy Policy</Link>
        </nav>
      </div>
    </footer>
  );
}
