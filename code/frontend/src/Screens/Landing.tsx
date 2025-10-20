import { Button } from "../components/button";
import { useNavigate } from "react-router-dom";
import registerImage from "../images/landing.jpg";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex flex-col relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-[22rem] h-[22rem] bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '4s' }}></div>
      <div className="absolute bottom-0 left-0 w-[22rem] h-[22rem] bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '6s' }}></div>

      {/* Header Section */}
      <header className="border-b border-border/60 py-5 px-6 bg-card/90 backdrop-blur-xl shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-4xl font-bold text-primary tracking-tight hover:scale-105 transition-transform cursor-pointer">
            MyLinkedIn
          </h1>
          <div className="flex gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/register?mode=login")}
              className="px-7 py-2.5 text-base font-medium hover:bg-primary/5 transition-all duration-200"
            >
              Sign In
            </Button>
            <Button
              onClick={() => navigate("/register?mode=register")}
              className="px-7 py-2.5 text-base font-medium shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center px-8 py-12 overflow-hidden">
        <div className="max-w-6xl w-full mx-auto">
          <div className="grid md:grid-cols-2 gap-14 items-center w-full mb-12">
            {/* Text Content Section */}
            <div className="flex flex-col justify-center space-y-8 md:pr-8 animate-fadeIn">
              <div className="space-y-5">
                <h2 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight tracking-tight">
                  Welcome to your{" "}
                  <span className="text-primary bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    professional community
                  </span>
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-light max-w-xl">
                  Connect with professionals worldwide, discover exciting career opportunities,
                  and build meaningful relationships that drive your professional growth.
                </p>
              </div>

              {/* CTA Button */}
              <div className="flex gap-4 pt-3">
                <Button
                  onClick={() => navigate("/register?mode=login")}
                  className="px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  Get Started
                </Button>
              </div>
            </div>

            {/* Image Section */}
            <div className="flex items-center justify-center animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              <div className="relative w-full max-w-lg group">
                <div className="bg-gradient-to-br from-white to-gray-50 px-1 py-3 rounded-2xl border border-border/40 shadow-2xl hover:shadow-3xl transition-all duration-500 backdrop-blur group-hover:scale-[1.02]">
                  <img
                    src={registerImage}
                    alt="Professional workspace"
                    className="w-full h-auto max-h-[340px] object-contain rounded-xl"
                  />
                </div>
                {/* Decorative elements */}
                <div className="absolute -bottom-7 -right-7 w-28 h-28 bg-primary/15 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '3s' }}></div>
                <div className="absolute -top-7 -left-7 w-28 h-28 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '4s' }}></div>
              </div>
            </div>
          </div>


          {/* Separador criativo */}
          <div className="flex justify-center items-center my-14">
            <div className="relative w-full max-w-6xl">
              {/* Linha superior */}
              <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-primary/0 via-primary/70 to-secondary/0 rounded-full blur-[1px]" style={{ zIndex: 1 }}></div>
              {/* Linha inferior */}
              <div className="absolute left-0 right-0 top-3 h-1 bg-gradient-to-r from-secondary/0 via-secondary/60 to-primary/0 rounded-full blur-[1px]" style={{ zIndex: 1 }}></div>
              {/* Efeito de brilho central */}
              <div className="absolute left-1/2 top-1.5 -translate-x-1/2 w-[22rem] h-10 bg-primary/25 blur-2xl rounded-full opacity-80 pointer-events-none animate-pulse" style={{ zIndex: 2, animationDuration: '3s' }}></div>
              {/* Container para espaçamento vertical */}
              <div className="h-5" />
            </div>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8 px-3">
            <div className="group flex flex-col items-center text-center p-8 bg-card/60 rounded-xl border border-border/40 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl backdrop-blur-sm hover:-translate-y-1 cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/15 to-primary/5 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Network</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Connect with industry leaders and peers</p>
            </div>

            <div className="group flex flex-col items-center text-center p-8 bg-card/60 rounded-xl border border-border/40 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl backdrop-blur-sm hover:-translate-y-1 cursor-pointer" style={{ animationDelay: '0.1s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-primary/15 to-primary/5 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Explore</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Discover job opportunities tailored for you</p>
            </div>

            <div className="group flex flex-col items-center text-center p-8 bg-card/60 rounded-xl border border-border/40 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl backdrop-blur-sm hover:-translate-y-1 cursor-pointer" style={{ animationDelay: '0.2s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-primary/15 to-primary/5 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Grow</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Build your professional presence online</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;
