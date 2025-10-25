import { Button } from "../components/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import landingImage from "../images/landing.png";

const Landing = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Network",
      description: "Connect with industry leaders and peers"
    },
    {
      title: "Explore",
      description: "Discover job opportunities"
    },
    {
      title: "Grow",
      description: "Build your professional presence online"
    }
  ];

  const nextStep = () => {
    setCurrentStep((prev) => (prev + 1) % steps.length);
  };

  const prevStep = () => {
    setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex flex-col">
      {/* Header Section */}
      <header className="py-5 px-6 bg-card/90 backdrop-blur-xl shadow-sm border-b border-border/60">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center mr-2 select-none">
            <span className="text-4xl font-bold tracking-tight">
              <span className="text-[#004182]">My</span>
              <span className="text-primary">Linked</span>
            </span>
            <span className="ml-1">
              <span className="inline-block align-middle w-10 h-10 bg-primary rounded-md flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground" style={{ fontFamily: 'inherit' }}>in</span>
              </span>
            </span>
          </div>
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
      <main className="flex-1 flex flex-col justify-between">
        <div className="max-w-7xl w-full mx-auto px-16 py-8 flex-1 flex items-center">
          <div className="grid md:grid-cols-2 gap-32 items-center w-full">
            {/* Text Content Section */}

            <div className="flex flex-col items-center justify-center text-center space-y-8 animate-fadeIn pr-8">
              <h1 className="text-5xl md:text-6xl font-extrabold text-primary drop-shadow-sm leading-tight">
                Your <span className="text-[#004182]">Professional</span> Network
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-2xl mx-auto">
                Join professionals from around the world, discover new opportunities, and make connections that boost your career.
              </p>
              <div className="flex gap-6 items-center pt-4">
                <Button
                  onClick={() => navigate("/register?mode=register")}
                  className="px-10 py-4 text-xl font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  Start Now
                </Button>
              </div>
            </div>

            {/* Image Section */}
            <div className="flex items-center justify-center animate-fadeIn pl-0 md:pl-8 w-full">
              <img
                src={landingImage}
                alt="Professional networking"
                className="w-full h-auto object-contain max-w-[90vw] md:max-w-[700px] md:scale-150 scale-100"
              />
            </div>
          </div>
        </div>

        {/* Steps Section */}
  <div className="bg-primary/80 backdrop-blur-md py-10">
          <div className="max-w-6xl mx-auto px-2 md:px-8">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 w-full">
              {/* Left navigation arrow */}
              <button
                onClick={prevStep}
                className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-white/80 flex items-center justify-center text-white hover:bg-white hover:text-primary transition-all shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Steps */}
              <div className="flex flex-col md:flex-row gap-6 md:gap-12 justify-center items-center w-full">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={`transition-all duration-500 w-full max-w-xs md:max-w-[400px] ${
                      index === currentStep ? 'scale-105' : 'scale-95 opacity-80'
                    }`}
                  >
                    <div className={`p-8 rounded-xl shadow-lg transition-all duration-300 w-full ${
                      index === currentStep 
                        ? 'bg-card border border-border/40' 
                        : 'bg-primary-foreground/10 backdrop-blur-sm border border-white/20'
                    }`}>
                      <div className={`flex flex-col items-center text-center ${
                        index === currentStep ? '' : 'text-white'
                      }`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-lg transition-all ${
                          index === currentStep 
                            ? 'bg-primary/10' 
                            : 'bg-white/20'
                        }`}>
                          {index === 0 && (
                            <svg className={`w-6 h-6 ${index === currentStep ? 'text-primary' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          )}
                          {index === 1 && (
                            <svg className={`w-6 h-6 ${index === currentStep ? 'text-primary' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          )}
                          {index === 2 && (
                            <svg className={`w-6 h-6 ${index === currentStep ? 'text-primary' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          )}
                        </div>
                        <h3 className={`text-lg font-bold mb-2 ${
                          index === currentStep ? 'text-foreground' : 'text-white'
                        }`}>
                          {step.title}
                        </h3>
                        <p className={`text-sm leading-relaxed ${
                          index === currentStep ? 'text-muted-foreground' : 'text-white/90'
                        }`}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right navigation arrow */}
              <button
                onClick={nextStep}
                className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-white/80 flex items-center justify-center text-white hover:bg-white hover:text-primary transition-all shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;
