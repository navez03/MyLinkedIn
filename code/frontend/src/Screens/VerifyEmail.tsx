import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "../components/card";
import registerImage from "../images/register.png";
import { authAPI } from "../services/registerService";

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const userId = location.state?.userId;

  useEffect(() => {
    const checkVerification = async () => {
      if (!userId) {
        setIsVerifying(false);
        return;
      }

      try {
        const response = await authAPI.checkEmailVerified(userId);

        if (response.success && response.data?.isVerified) {
          navigate('/set-name', { state: { userId, email: location.state?.email } });
        } else {
          setIsVerifying(false);
          setTimeout(checkVerification, 3000);
        }
      } catch (error) {
        console.error('Error checking email verification:', error);
        setIsVerifying(false);
      }
    };

    checkVerification();
  }, [userId, navigate, location.state?.email]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex flex-col">
      {/* Header Section */}
      <header className="border-b border-border/60 py-5 px-6 bg-card/80 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center mr-2 select-none">
            <span className="text-4xl font-bold tracking-tight">
              <span className="text-[#004182]">My</span>
              <span className="text-primary">Linked</span>
            </span>
            <span className="ml-1">
              <span className="inline-block align-middle w-10 h-10 bg-primary rounded-md flex items-center justify-center animate-none">
                <span className="text-2xl font-bold text-primary-foreground" style={{ fontFamily: 'inherit' }}>in</span>
              </span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 overflow-hidden relative">
        {/* Background decorative elements (igual ao Register) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#004182]/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-primary/3 rounded-full blur-2xl"></div>
        </div>

        <div className="w-full max-w-[110rem] relative z-10">
          <Card className="overflow-hidden shadow-2xl border-2 border-border/40 backdrop-blur-md bg-card/95 p-0 md:p-6 lg:p-10 xl:p-16">
            <div className="grid md:grid-cols-2 gap-0 min-h-[480px] md:min-h-[540px]">
              {/* Image Section */}
              <div className="hidden md:flex items-center justify-center p-4 relative bg-transparent">
                <img
                  src={registerImage}
                  alt="Professional workspace"
                  className="w-full h-full max-w-[600px] max-h-[80vh] object-contain mx-auto"
                  style={{ aspectRatio: '1.1/1', width: '100%', height: 'auto' }}
                />
              </div>

              {/* Content Section */}
              <div className="flex items-center justify-center p-8 md:p-12 lg:p-14 bg-card/50">
                <div className="w-full max-w-md space-y-6">
                  <div className="text-center space-y-2 mb-8">
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-12">
                      Verify your email
                    </h2>
                    <p className="text-base text-muted-foreground">
                      We've sent a confirmation email to your inbox.
                    </p>
                    <p className="text-base text-muted-foreground">
                      Please check your email.
                    </p>
                  </div>
                  {isVerifying && (
                    <div className="pt-6">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-4">Waiting for verification...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
