import { useNavigate } from "react-router-dom";
import { Button } from "../components/button";
import { Card } from "../components/card";

const BackToRegister = () => {
  const navigate = useNavigate();

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
        <div className="w-full max-w-4xl">
          <Card className="overflow-hidden shadow-2xl border-2 border-border/40 backdrop-blur bg-card/50">
            <div className="flex items-center justify-center p-12 md:p-16 lg:p-20 min-h-[500px]">
              <div className="w-full max-w-xl space-y-8 text-center">

                {/* Content */}
                <div className="space-y-6">
                  <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-16">
                    Email Confirmed Successfully!
                  </h2>
                  <p className="text-xl text-muted-foreground leading-relaxed max-w-md mx-auto">
                    Your email has been verified. You can now continue setting up your profile.
                  </p>
                </div>

                {/* Decorative elements */}
                <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-primary/5 rounded-full blur-3xl -z-10"></div>
                <div className="absolute -top-8 -left-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl -z-10"></div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default BackToRegister;
