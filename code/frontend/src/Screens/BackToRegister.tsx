import { useNavigate } from "react-router-dom";
import { Card } from "../components/card";

const BackToRegister = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex flex-col">
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

      <div className="flex-1 flex items-center justify-center px-6 py-8 overflow-hidden relative">
        <div className="w-full max-w-[110rem] relative z-10">
          <Card className="overflow-hidden shadow-2xl border-2 border-border/40 backdrop-blur-md bg-card/95 p-0 md:p-6 lg:p-10 xl:p-16">
            <div className="flex items-center justify-center p-8 md:p-12 lg:p-14 min-h-[480px] md:min-h-[540px]">
              <div className="w-full max-w-md space-y-8 text-center">
                <div className="space-y-6">
                  <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-16">
                    Email Confirmed Successfully!
                  </h2>
                  <p className="text-xl text-muted-foreground leading-relaxed max-w-md mx-auto">
                    Your email has been verified. You can now continue setting up your profile.
                  </p>
                </div>
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
