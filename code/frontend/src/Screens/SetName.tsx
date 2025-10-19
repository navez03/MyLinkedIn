import { useState } from "react";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { Card } from "../components/card";
import { authAPI } from "../services/registerService";
import registerImage from "../images/register.jpg";

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

      // Call API to create profile
      const response = await authAPI.createProfile(userId, fullName, email);

      if (response.success) {
        // Store the name in localStorage
        localStorage.setItem('userName', fullName);



        // Redirect to feed after success
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-2 py-8">
        <div className="w-full max-w-7xl">
          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left Side - Image */}
              <div className="hidden md:block relative">
                <img
                  src={registerImage}
                  alt="Professional workspace"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Right Side - Form */}
              <div className="flex items-center justify-center p-8 md:p-12 lg:p-16">
                <div className="w-full max-w-md space-y-8">
                  {/* Header */}
                  <div className="text-center space-y-4 mb-20">
                    <h2 className="text-4xl font-bold tracking-tight text-foreground mb-4">
                      Complete Your Profile
                    </h2>
                  </div>

                  {/* Form */}
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
                      <div className="flex items-center justify-between"></div>
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
