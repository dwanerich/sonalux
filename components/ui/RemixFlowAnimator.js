// components/ui/RemixFlowAnimator.js
import { motion } from 'framer-motion';

export default function RemixFlowAnimator({ progress }) {
  return (
    <div style={{ marginTop: 32, width: '100%', maxWidth: 600 }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3 }}
        style={{
          height: 6,
          background: '#0cf',
          borderRadius: 12,
          boxShadow: '0 0 12px #0cf',
        }}
      />
    </div>
  );
}

// --- Insert in RemixModule.js ---
// At the top:
// import useRemixSubmit from '@/hooks/useRemixSubmit';
// import RemixFlowAnimator from './RemixFlowAnimator';

// Inside component:
// const {
//   isSubmitting,
//   progress,
//   submitRemix,
// } = useRemixSubmit();

// In render JSX:
// {isSubmitting && <RemixFlowAnimator progress={progress} />} // Below the submit button
