import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings as SettingsIcon, Globe, Clock, Shield, TrendingUp } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

export default function Settings() {
  const { whaleThresholds, setWhaleThresholds } = useSettings();
  
  const [thresholdInputs, setThresholdInputs] = useState<Record<string, string>>(() => {
    const inputs: Record<string, string> = {};
    whaleThresholds.forEach((t) => {
      inputs[t.token] = t.amount.toString();
    });
    return inputs;
  });

  const handleThresholdChange = (token: string, value: string) => {
    setThresholdInputs((prev) => ({
      ...prev,
      [token]: value,
    }));
  };

  const handleSaveThresholds = () => {
    const newThresholds = whaleThresholds.map((t) => ({
      token: t.token,
      amount: parseInt(thresholdInputs[t.token]) || t.amount,
    }));
    setWhaleThresholds(newThresholds);
  };

  return (
    <DashboardLayout title="Settings">
      <div className="max-w-3xl space-y-6">
        {/* General Settings */}
        <Card className="gradient-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-primary" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <Label className="text-base">Timezone</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Set your preferred timezone for timestamps
                  </p>
                </div>
              </div>
              <Select defaultValue="utc">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utc">UTC (GMT+0)</SelectItem>
                  <SelectItem value="est">EST (GMT-5)</SelectItem>
                  <SelectItem value="cst">CST (GMT-6)</SelectItem>
                  <SelectItem value="pst">PST (GMT-8)</SelectItem>
                  <SelectItem value="cet">CET (GMT+1)</SelectItem>
                  <SelectItem value="jst">JST (GMT+9)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-6">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <Label className="text-base">Default Time Range</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Default period for charts and tables
                  </p>
                </div>
              </div>
              <Select defaultValue="24h">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last 1 hour</SelectItem>
                  <SelectItem value="24h">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-6">
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <Label className="text-base">Language</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select your preferred language
                  </p>
                </div>
              </div>
              <Select defaultValue="en">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Display */}
        <Card className="gradient-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Privacy & Display
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Show Demo Data</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Display demo data when n8n is disconnected
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between border-t border-border pt-6">
              <div>
                <Label className="text-base">Anonymize Wallet Addresses</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Show shortened wallet addresses by default
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between border-t border-border pt-6">
              <div>
                <Label className="text-base">Auto-refresh Dashboard</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Automatically refresh data every 30 seconds
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between border-t border-border pt-6">
              <div>
                <Label className="text-base">Sound Notifications</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Play sound when whale alerts are triggered
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Data Parameters - Whale Detection Thresholds */}
        <Card className="gradient-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Whale Detection Thresholds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set the minimum token amount to classify a transaction as a whale event. 
              When an event exceeds these thresholds, it will be tagged as "Whale" across all pages.
            </p>
            
            <div className="grid gap-4">
              {whaleThresholds.map((threshold) => (
                <div key={threshold.token} className="flex items-center justify-between gap-4">
                  <Label className="text-base font-medium min-w-[80px]">
                    {threshold.token}
                  </Label>
                  <div className="flex items-center gap-2 flex-1 max-w-xs">
                    <Input
                      type="number"
                      value={thresholdInputs[threshold.token] || ""}
                      onChange={(e) => handleThresholdChange(threshold.token, e.target.value)}
                      className="font-mono"
                      placeholder={threshold.amount.toString()}
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {threshold.token}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              className="w-full bg-primary hover:bg-primary/90 mt-4"
              onClick={handleSaveThresholds}
            >
              Save Thresholds
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
