import { createFileRoute, Link } from "@tanstack/react-router";
import { PageWrapper } from "@/components/Card";
import { Mail, Calendar, Shield, Camera, Edit2, Check, X, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/useAuthStore";
import { useRef, useState, useEffect } from "react";
import { fetchJsonWithRetry } from "@/services/apiClient";
import { getApiUrl } from "@/config/api";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user: authUser, logout } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState("");
  
  const getFormattedJoinedDate = (createdAtStr?: string) => {
    if (!createdAtStr) return "Oct 2023";
    try {
      const date = new Date(createdAtStr);
      if (isNaN(date.getTime())) return "Oct 2023";
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch (e) {
      return "Oct 2023";
    }
  };

  const user = {
    name: authUser?.name || "Alex Johnson",
    email: authUser?.email || "alex.johnson@science.edu",
    avatar: authUser?.avatar || "",
    joined: getFormattedJoinedDate(authUser?.created_at),
  };

  useEffect(() => {
    if (authUser?.name) {
      setDisplayNameInput(authUser.name);
    }
  }, [authUser?.name]);

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File rejected: Only image uploads are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File rejected: Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64String = reader.result as string;
      try {
        const token = useAuthStore.getState().token;
        const response = await fetchJsonWithRetry<{ success: boolean; profile: any }>(
          getApiUrl("/api/persistence/profile"),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              avatar: base64String,
            }),
          }
        );

        if (response.success) {
          if (authUser) {
            useAuthStore.setState({
              user: {
                ...authUser,
                avatar: base64String,
              },
            });
          }
          toast.success("Avatar updated successfully!");
        } else {
          toast.error("Failed to update avatar");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to update avatar");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveName = async () => {
    if (!displayNameInput.trim()) {
      toast.warning("Display name cannot be empty");
      return;
    }

    try {
      const token = useAuthStore.getState().token;
      const response = await fetchJsonWithRetry<{ success: boolean; profile: any }>(
        getApiUrl("/api/persistence/profile"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            display_name: displayNameInput.trim(),
          }),
        }
      );

      if (response.success) {
        if (authUser) {
          useAuthStore.setState({
            user: {
              ...authUser,
              name: displayNameInput.trim(),
            },
          });
        }
        setIsEditingName(false);
        toast.success("Profile updated successfully!");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="glass-strong rounded-[2.5rem] p-8 relative overflow-hidden border border-border">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--neon-purple)]/20 to-[var(--neon-blue)]/20 blur-3xl -z-10" />
          
          {/* Logout button at top right */}
          <div className="absolute top-6 right-6 hidden md:block">
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="rounded-xl border-red-500/20 text-muted-foreground hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
              <Avatar className="w-32 h-32 border-4 border-border shadow-2xl animate-fade-in">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-4xl bg-gradient-to-br from-[var(--neon-purple)]/20 to-[var(--neon-blue)]/20 text-foreground font-bold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <button 
                onClick={handleCameraClick}
                className="absolute bottom-0 right-0 p-2 rounded-xl bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            
            <div className="flex-1 text-center md:text-left w-full">
              {isEditingName ? (
                <div className="flex flex-col sm:flex-row items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    className="text-2xl font-bold bg-background border border-border rounded-xl px-3 py-1.5 outline-none focus:border-primary text-foreground w-full max-w-sm"
                    maxLength={50}
                    autoFocus
                  />
                  <div className="flex gap-2 shrink-0">
                    <Button onClick={handleSaveName} size="icon" className="rounded-xl h-10 w-10">
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => { setIsEditingName(false); setDisplayNameInput(user.name); }} variant="outline" size="icon" className="rounded-xl h-10 w-10">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 justify-center md:justify-start mb-2">
                  <h1 className="text-4xl font-bold text-foreground">{user.name}</h1>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsEditingName(true)} 
                    className="rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground h-8 w-8"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {user.email}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Joined {user.joined}</span>
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> 
                  {authUser?.role ? authUser.role.charAt(0).toUpperCase() + authUser.role.slice(1) : "Student"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-strong rounded-3xl overflow-hidden border border-border">
          <div className="px-6 py-4 border-b border-border bg-secondary/20">
            <h2 className="text-xl font-bold text-gradient">Account Options</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Account Settings</p>
                <p className="text-xs text-muted-foreground">Manage your settings and preferences</p>
              </div>
              <Link
                to="/settings"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Settings
              </Link>
            </div>

            <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Account Session</p>
                <p className="text-xs text-muted-foreground">Sign out of your account on this device</p>
              </div>
              <Button 
                variant="outline" 
                onClick={logout} 
                className="rounded-xl border-red-500/20 text-red-400 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

