'use client';
import React from 'react';

import { motion } from 'framer-motion';

export default function LoadingButton({ isLoading, onClick, text, loadingText }) {
  return (
    <motion.button
      whileHover={{ scale: isLoading ? 1 : 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={isLoading}
      style={{
        padding: '12px 28px',
        borderRadius: '12px',
        background: isLoading ? '#222' : '#0cf',
        color: '#fff',
        fontWeight: 500,
        fontFamily: 'Inter, sans-serif',
        fontSize: 16,
        boxShadow: isLoading ? '0 0 0 #000' : '0 0 12px #0cf',
        transition: 'all 0.3s ease-in-out',
        cursor: isLoading ? 'default' : 'pointer'
      }}
    >
      {isLoading ? loadingText : text}
    </motion.button>
  );
}