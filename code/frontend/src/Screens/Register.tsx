import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { Card } from "../components/card";
import { authAPI } from "../services/registerService";
import registerImage from "../images/register.png";

const RegistrationForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "register" ? false : true;
  const [isLogin, setIsLogin] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    if (!isLogin && password.length < 6) {
      setErrorMsg("The password must have at least 6 characters.");
      return;
    }
    setErrorMsg("");
    setIsLoading(true);

    try {
      if (isLogin) {
        const response = await authAPI.login(email, password);

        if (response.success) {
          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
          }
          localStorage.setItem('userId', response.data.userId);
          localStorage.setItem('email', response.data.email);
          setTimeout(() => {
            navigate('/feed');
          }, 1000);
        } else {
          setErrorMsg("Invalid credentials. Please try again.");
        }
      } else {
        const response = await authAPI.register(email, password);

        if (response.success) {
          if (response.data?.user?.id) {
            localStorage.setItem('userId', response.data.user.id);
          }
          if (response.data?.user?.email) {
            localStorage.setItem('email', response.data.user.email);
          }
          setTimeout(() => {
            navigate('/verify-email', { state: { userId: response.data?.user?.id, email: response.data?.user?.email } });
          }, 1000);
        } else {
          if (
            response.error?.toLowerCase().includes('password') &&
            response.error?.toLowerCase().includes('6 characters')
          ) {
            setErrorMsg('The password must have at least 6 characters.');
          } else if (
            response.error?.toLowerCase().includes('account already exists')
          ) {
            setErrorMsg('An account with this email already exists.');
          } else {
            setErrorMsg("Error creating account.");
          }
        }
      }
    } catch (error) {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
        {/* Background decorative elements */}
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

              {/* Form Section */}
              <div className="flex items-center justify-center p-8 md:p-12 lg:p-14 bg-card/50">
                <div className="w-full max-w-md space-y-6">
                  <div className="text-center space-y-2 mb-8">
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
                      {isLogin ? "Welcome back" : "Join MyLinkedIn"}
                    </h2>
                    <p className="text-base text-muted-foreground">
                      {isLogin ? "Sign in to continue your journey" : "Start your professional journey today"}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-4">
                      <Input
                        id="email"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        className="w-full h-14 text-base placeholder:text-base border-border/60 focus:border-primary transition-colors"
                      />

                      <Input
                        id="password"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        className="w-full h-14 text-base placeholder:text-base border-border/60 focus:border-primary transition-colors"
                      />
                    </div>

                    {errorMsg && (
                      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm text-center">
                        {errorMsg}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-14 text-base font-semibold shadow-md hover:shadow-lg transition-all mt-6"
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading ? "Loading..." : (isLogin ? "Sign In" : "Sign Up")}
                    </Button>
                  </form>

                  <div className="text-center pt-4">
                    <p className="text-sm text-muted-foreground">
                      {isLogin ? "New to MyLinkedIn?" : "Already have an account?"}{" "}
                      <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-primary font-semibold hover:underline transition-all"
                      >
                        {isLogin ? "Sign Up" : "Sign in"}
                      </button>
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

export default RegistrationForm;
