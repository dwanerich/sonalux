export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-md border border-gray-700 bg-black text-white px-3 py-2 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 ${className}`}
      {...props}
    />
  );
}
