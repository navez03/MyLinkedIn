import React from 'react';

const Loading: React.FC = () => {
  return (
  <div className="min-h-screen bg-blue-50 flex flex-col font-sans">
      {/* Card-like loading area */}
  <div className="w-full max-w-2xl mx-auto mt-32 overflow-hidden shadow-2xl border-2 border-border/40 backdrop-blur-md bg-card/95 p-0 md:p-12 lg:p-16 xl:p-24 flex flex-col items-center">
        {/* Logo dentro do card */}
        <div className="flex items-center justify-center mb-10 select-none">
          <span className="text-6xl md:text-7xl font-extrabold tracking-tight" style={{ fontFamily: 'inherit' }}>
            <span className="text-[#004182]">My</span>
            <span className="text-primary">Linked</span>
          </span>
          <span className="ml-2">
            <span className="inline-block align-middle w-16 h-16 bg-primary rounded-md flex items-center justify-center animate-none">
              <span className="text-4xl md:text-5xl font-extrabold text-primary-foreground" style={{ fontFamily: 'inherit' }}>in</span>
            </span>
          </span>
        </div>
  <div className="w-full flex flex-col items-center justify-center py-16">
          {/* Spinner */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex gap-2">
              <div className="w-4 h-4 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-4 h-4 bg-primary rounded-full animate-bounce" style={{ animationDelay: '120ms' }}></div>
              <div className="w-4 h-4 bg-primary rounded-full animate-bounce" style={{ animationDelay: '240ms' }}></div>
            </div>
          </div>
          {/* Loading text */}
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground mb-8" style={{ fontFamily: 'inherit' }}>Loading...</h2>
          <p className="text-base text-muted-foreground mb-4" style={{ fontFamily: 'inherit' }}>Please wait while we load your content</p>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          0% {
            width: 0%;
            margin-left: 0;
          }
          50% {
            width: 75%;
          }
          100% {
            width: 0%;
            margin-left: 100%;
          }
        }
        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Loading;
