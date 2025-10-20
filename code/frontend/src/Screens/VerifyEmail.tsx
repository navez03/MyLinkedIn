import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "../components/card";
import registerImage from "../images/register.jpg";
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
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center px-2 py-8">
        <div className="w-full max-w-7xl">
          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="hidden md:block relative">
                <img
                  src={registerImage}
                  alt="Professional workspace"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center justify-center p-8 md:p-12 lg:p-16">
                <div className="w-full max-w-md space-y-8">
                  <div className="text-center space-y-3 mb-10">
                    <h2 className="text-4xl font-bold tracking-tight text-foreground mb-4">
                      {isVerifying ? "Verifying your email..." : "Verify your email"}
                    </h2>
                    <p className="text-muted-foreground text-lg">
                      {isVerifying
                        ? "Please wait while we confirm your email."
                        : "Confirm your email address to continue."
                      }
                    </p>
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
