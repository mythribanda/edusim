import { createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/Card";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "sonner";
import { Moon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);

  const handleToggle = (checked: boolean) => {
    setDarkMode(checked);
    toast.success("Settings saved");
  };

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-6 px-4 py-8">
        <div className="flex items-center gap-4">
          <Link to="/profile">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-foreground">Settings</h1>
        </div>

        <div className="glass-strong rounded-3xl overflow-hidden border border-border">
          <div className="px-6 py-4 border-b border-border bg-secondary/20">
            <h2 className="text-xl font-bold text-gradient">Appearance</h2>
          </div>
          <div className="p-6">
            <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">Toggle the application theme</p>
                </div>
              </div>
              <Switch checked={darkMode} onCheckedChange={handleToggle} />
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
