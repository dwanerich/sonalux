// /components/ui/Header.js

import Link from 'next/link';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          SONALUX
        </Link>
        <div className={styles.links}>
          <Link href="/remix">Remix</Link>
          <Link href="/history">History</Link>
          <Link href="/about">About</Link>
        </div>

      </nav>
    </header>
  );
}
