import React from 'react';
import styles from '@/styles/Loader.module.css';

export default function Loader() {
  return (
    <div className={styles.loaderOverlay}>
      <div className={styles.loaderSpinner}></div>
      <p className={styles.loaderText}>Generating your remix...</p>
    </div>
  );
}
