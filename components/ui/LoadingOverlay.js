// /components/ui/LoadingOverlay.js

const LoadingOverlay = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.75)',
      color: 'white',
      fontSize: '1.5rem',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      Generating Remix...
    </div>
  );
};

export default LoadingOverlay;
