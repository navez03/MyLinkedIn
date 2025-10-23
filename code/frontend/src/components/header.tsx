import { Home, Users, Briefcase, MessageSquare, Bell, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "./input";

const Navigation = () => {
  const navigate = useNavigate();

  const navItems = [
    { icon: Home, label: "Home", path: "/feed" },
    { icon: Users, label: "My Network", path: "/network" },
    { icon: MessageSquare, label: "Messages", path: "/messages" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
  ];

  const handleNavClick = (path?: string) => {
    if (path) {
      navigate(path);
    }
  };

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-[1128px] mx-auto px-4">
        <div className="flex items-center justify-between h-[72px]">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-primary tracking-tight mr-2 hidden sm:block">MyLinkedIn</h1>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                className="pl-8 w-[280px] bg-secondary border-0 h-[44px]"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            {navItems.map((item) => (
              <div
                key={item.label}
                onClick={() => handleNavClick(item.path)}
                className={`flex flex-col items-center gap-1 px-3 py-1 hover:text-foreground transition-colors cursor-pointer`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-normal">{item.label}</span>
              </div>
            ))}
            <div className="flex flex-col items-center gap-1">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                <span className="text-xs text-primary-foreground font-bold">Eu</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;