import React from 'react';

const Loading: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        {/* LinkedIn-style animated logo */}
        <div className="relative inline-block">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mb-6 animate-pulse">
            <span className="text-2xl font-bold text-primary-foreground">in</span>
          </div>

          {/* Loading spinner */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>

        {/* Loading text */}
        <div className="mt-8 space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Loading...</h2>
          <p className="text-sm text-muted-foreground">Please wait while we load your content</p>
        </div>

        {/* Progress bar */}
        <div className="mt-6 w-64 h-1 bg-secondary rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-primary rounded-full animate-progress"></div>
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
