export function Button({ children, className = '', ...props }) {
  return (
    <button
      className={`bg-white text-black font-bold px-4 py-2 rounded-md hover:opacity-90 transition duration-200 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
