import { Home, Users, Briefcase, MessageSquare, Bell, Search, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "./input";
import { useState, useEffect, useRef } from "react";
import { authAPI, UserSearchResult } from "../services/registerService";

const Navigation = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { icon: Home, label: "Home", path: "/feed" },
    { icon: Users, label: "My Network", path: "/network" },
    { icon: MessageSquare, label: "Messages", path: "/messages" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: User, label: "Profile", path: "/profile" },
    { icon: LogOut, label: "LogOut", path: "/" },
  ];

  const handleNavClick = async (path?: string) => {
    if (path === "/") {
      const userId = localStorage.getItem("userId") || "";
      try {
        await authAPI.logout(userId);
      } catch (e) {
      }
      localStorage.clear();
      navigate("/");
    } else if (path) {
      navigate(path);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        setIsSearching(true);
        const userId = localStorage.getItem('userId') || '';
        console.log('Searching with userId:', userId);
        const response = await authAPI.searchUsers(searchQuery, userId);
        console.log('Search response:', response);
        if (response.success) {
          setSearchResults(response.data?.users || []);
          setShowDropdown(true);
        } else {
          console.error('Search failed:', response.error);
          setSearchResults([]);
        }
        setIsSearching(false);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleUserClick = (userId: string) => {
    setShowDropdown(false);
    setSearchQuery("");
    setSearchResults([]);
    navigate(`/profile/${userId}`);
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-[1128px] mx-auto px-4">
        <div className="flex items-center justify-between h-[72px]">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center mr-2 hidden sm:flex cursor-pointer select-none"
              onClick={() => handleNavClick('/feed')}
            >
              <span className="text-2xl font-bold tracking-tight">
                <span className="text-[#004182]">My</span>
                <span className="text-primary">Linked</span>
              </span>
              <span className="ml-1">
                <span className="inline-block align-middle w-8 h-8 bg-primary rounded-md flex items-center justify-center animate-none">
                  <span className="text-xl font-bold text-primary-foreground" style={{ fontFamily: 'inherit' }}>in</span>
                </span>
              </span>
            </div>
            <div className="relative" ref={searchRef}>
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                className="pl-8 w-[280px] bg-secondary border-0 h-[44px]"
                value={searchQuery}
                onChange={handleSearchChange}
              />

              {/* Search Dropdown */}
              {showDropdown && (
                <div className="absolute top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-[400px] overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Searching...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => handleUserClick(user.id)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-secondary cursor-pointer transition-colors"
                        >
                          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <span className="text-sm text-primary-foreground font-bold">
                              {getInitials(user.name)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{user.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      No users found
                    </div>
                  )}
                </div>
              )}
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
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;