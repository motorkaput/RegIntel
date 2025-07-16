export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-neon-green mx-auto mb-4"></div>
          <div className="animate-ping absolute top-0 left-1/2 transform -translate-x-1/2 h-16 w-16 rounded-full bg-neon-green opacity-20"></div>
        </div>
        <p className="text-gray-300 text-lg">Loading...</p>
        <div className="mt-4 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-neon-green rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-neon-green rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-neon-green rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}
