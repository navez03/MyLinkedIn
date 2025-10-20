import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "../components/card";
import registerImage from "../images/register2.png";
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
          <h1 className="text-4xl font-bold text-primary tracking-tight">MyLinkedIn</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 overflow-hidden">
        <div className="w-full max-w-6xl">
          <Card className="overflow-hidden shadow-2xl border-2 border-border/40 backdrop-blur">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Image Section */}
              <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-white to-gray-50 p-10 relative">
                <img
                  src={registerImage}
                  alt="Professional workspace"
                  className="max-w-[500px] max-h-[450px] object-contain mx-auto rounded-lg"
                />
                {/* Decorative elements */}
                <div className="absolute bottom-4 right-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10"></div>
                <div className="absolute top-4 left-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl -z-10"></div>
              </div>

              {/* Content Section */}
              <div className="flex items-center justify-center p-8 md:p-12 lg:p-14 bg-card/50">
                <div className="w-full max-w-md space-y-6">
                  <div className="text-center space-y-4">

                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-24">
                      Verify your email
                    </h2>
                    <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                      We've sent a confirmation email to your inbox.
                    </p>
                    <p className="text-muted-foreground text-lg leading-relaxed mb-2">
                      Please check your email.
                    </p>
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
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
