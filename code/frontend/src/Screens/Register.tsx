import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { Card } from "../components/card";
import { authAPI } from "../services/registerService";
import registerImage from "../images/register.jpg";

const RegistrationForm = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setErrorMsg("Por favor preencha todos os campos.");
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
          setErrorMsg(response.error || "Erro ao iniciar sessão.");
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
          setErrorMsg(response.error || "Erro ao criar conta.");
        }
      }
    } catch (error) {
      setErrorMsg("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

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
                      {isLogin ? "Welcome back" : "Join MyLinkedIn"}
                    </h2>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-2">

                    <div className="space-y-2">
                      <Input
                        id="email"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        className="w-full h-16 text-lg placeholder:text-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                      </div>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        className="w-full h-16 text-lg placeholder:text-lg mb-8"
                      />
                    </div>

                    {errorMsg && (
                      <div className="text-center text-red-500 text-sm mb-4">{errorMsg}</div>
                    )}

                    <div className="space-y-10">
                      <div className="flex items-center justify-between"></div>
                      <Button
                        type="submit"
                        className="w-full h-16 text-lg"
                        size="lg"
                        disabled={isLoading}
                      >
                        {isLoading ? "Loading..." : (isLogin ? "Sign In" : "Sign Up")}
                      </Button>
                    </div>

                  </form>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      {isLogin ? "New to MyLinkedIn?" : "Already have an account?"}{" "}
                      <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-primary"
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
