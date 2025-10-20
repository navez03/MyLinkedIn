import { useState } from "react";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { Card } from "../components/card";
import { authAPI } from "../services/registerService";
import registerImage from "../images/register2.png";

const SetName = () => {
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      const userId = localStorage.getItem('userId');
      const email = localStorage.getItem('email');

      if (!userId || !email) {
        window.location.href = '/';
        return;
      }

      const response = await authAPI.createProfile(userId, fullName, email);

      if (response.success) {
        localStorage.setItem('userName', fullName);



        setTimeout(() => {
          window.location.href = '/feed';
        }, 1000);
      }
    } catch (error) {
      console.error("Error creating profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
          <Card className="overflow-hidden shadow-2xl border-2 border-border/40 backdrop-blur min-h-[380px] md:min-h-[420px]">
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
                  <div className="text-center space-y-4 mb-16">
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-8">
                      Choose your Name
                    </h2>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-2">
                    <div className="space-y-2">
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Full Name"
                        value={fullName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                        className="w-full h-16 text-lg placeholder:text-lg mb-8"
                        autoFocus
                      />
                    </div>

                    <div className="space-y-10">
                      <Button
                        type="submit"
                        className="w-full h-16 text-lg"
                        size="lg"
                        disabled={isLoading}
                      >
                        {isLoading ? "Saving..." : "Continue"}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SetName;
