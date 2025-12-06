import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Bell, MessageSquare, Hash, Twitter, AlertCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock integration status - in real app, this would come from state/API
const integrationStatus = {
  telegram: true, // Connected
  discord: true,  // Connected
  x: false,       // Not connected
};

// Mock channel names from integrations
const channelNames = {
  telegram: "@qubic_activity",
  discord: "#qubic-activity",
  x: "",
};

const alertTemplates = [
  {
    name: "Whale Buy Alert",
    description: "Trigger when a whale wallet buys more than 10K QUBIC in 1 hour",
    condition: "Buy > 10,000 QUBIC in 1h from whale wallet",
    enabled: true,
    channels: ["telegram", "discord"],
  },
  {
    name: "Whale Sell Alert",
    description: "Trigger when a whale wallet sells more than 5K QUBIC in 1 hour",
    condition: "Sell > 5,000 QUBIC in 1h from whale wallet",
    enabled: true,
    channels: ["telegram", "discord", "x"],
  },
  {
    name: "High Volume Spike",
    description: "Alert when total trading volume increases by 50% in 15 minutes",
    condition: "Volume spike > 50% in 15min",
    enabled: false,
    channels: ["discord"],
  },
  {
    name: "New Active Wallet",
    description: "Notify when a previously inactive wallet becomes active",
    condition: "Wallet inactive > 30d makes first transaction",
    enabled: true,
    channels: ["telegram"],
  },
];

const recentAlerts = [
  {
    type: "Whale Buy",
    message: "Whale Qb3x...k9d2 bought 15,420 QUBIC",
    channels: "Telegram, Discord",
    time: "2 min ago",
  },
  {
    type: "Whale Sell",
    message: "Whale Qm5t...r4c9 sold 8,750 QUBIC",
    channels: "Telegram, Discord, X",
    time: "1 hour ago",
  },
  {
    type: "New Active",
    message: "Wallet Qa2c...f8e1 became active after 45 days",
    channels: "Telegram",
    time: "3 hours ago",
  },
  {
    type: "Whale Buy",
    message: "Whale Qr8n...d2s5 bought 23,100 QUBIC",
    channels: "Telegram, Discord",
    time: "5 hours ago",
  },
];

export default function Alerts() {
  const { toast } = useToast();

  const handleTestAlert = () => {
    toast({
      title: "Alert Test Successful",
      description: "Your custom alert condition is valid and ready to activate.",
    });
  };

  return (
    <DashboardLayout title="Alerts">
      <div className="max-w-5xl space-y-6">
        {/* Description */}
        <Card className="gradient-card border-border">
          <CardContent className="pt-6 space-y-4">
            <p className="text-muted-foreground">
              Set alerts for whale wallet movements and key market signals. When
              enabled, alerts will be sent to connected Telegram, Discord, or X
              channels.
            </p>
            <Alert className="border-primary/30 bg-primary/5">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                <strong>Whale Detection:</strong> This app identifies whale users based on wallet balance exceeding 1,000,000 QX tokens. 
                You can edit this threshold in the Settings → Data Parameters tab.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Alert Templates */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Alert Templates
          </h2>

          <div className="space-y-3">
            {alertTemplates.map((template, idx) => (
              <Card
                key={idx}
                className="gradient-card border-border hover:border-primary/30 transition-smooth"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {template.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.description}
                          </p>
                        </div>
                        <Switch defaultChecked={template.enabled} />
                      </div>

                      <div className="mt-4 space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Condition
                          </p>
                          <p className="text-sm font-mono bg-background/30 px-3 py-2 rounded border border-border">
                            {template.condition}
                          </p>
                        </div>

                        {/* Channels */}
                        <div>
                          <Label className="text-sm text-muted-foreground mb-2 block">
                            Notification Channels
                          </Label>
                          <div className="space-y-3">
                            <div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${idx}-telegram`}
                                  defaultChecked={template.channels.includes(
                                    "telegram"
                                  )}
                                  disabled={!integrationStatus.telegram}
                                />
                                <Label
                                  htmlFor={`${idx}-telegram`}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <MessageSquare className="w-4 h-4 text-primary" />
                                  Telegram
                                  {integrationStatus.telegram && channelNames.telegram && (
                                    <span className="text-xs text-muted-foreground">
                                      ({channelNames.telegram})
                                    </span>
                                  )}
                                </Label>
                              </div>
                              {!integrationStatus.telegram && (
                                <p className="text-xs text-destructive mt-1 ml-6">
                                  Please connect your account in Integrations tab to use this platform
                                </p>
                              )}
                            </div>

                            <div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${idx}-discord`}
                                  defaultChecked={template.channels.includes(
                                    "discord"
                                  )}
                                  disabled={!integrationStatus.discord}
                                />
                                <Label
                                  htmlFor={`${idx}-discord`}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <Hash className="w-4 h-4 text-primary" />
                                  Discord
                                  {integrationStatus.discord && channelNames.discord && (
                                    <span className="text-xs text-muted-foreground">
                                      ({channelNames.discord})
                                    </span>
                                  )}
                                </Label>
                              </div>
                              {!integrationStatus.discord && (
                                <p className="text-xs text-destructive mt-1 ml-6">
                                  Please connect your account in Integrations tab to use this platform
                                </p>
                              )}
                            </div>

                            <div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${idx}-x`}
                                  defaultChecked={template.channels.includes("x")}
                                  disabled={!integrationStatus.x}
                                />
                                <Label
                                  htmlFor={`${idx}-x`}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <Twitter className="w-4 h-4 text-primary" />
                                  X (Twitter)
                                  {integrationStatus.x && channelNames.x && (
                                    <span className="text-xs text-muted-foreground">
                                      ({channelNames.x})
                                    </span>
                                  )}
                                </Label>
                              </div>
                              {!integrationStatus.x && (
                                <p className="text-xs text-destructive mt-1 ml-6">
                                  Please connect your account in Integrations tab to use this platform
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Custom Alert */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Custom Alert
          </h2>

          <Card className="gradient-card border-border">
            <CardContent className="p-6 space-y-6">
              {/* Alert Name */}
              <div className="space-y-2">
                <Label htmlFor="alert-name">Alert Name</Label>
                <Input
                  id="alert-name"
                  placeholder="e.g., Large Transaction Alert"
                  className="bg-background/50 border-border"
                />
              </div>

              {/* Alert Description */}
              <div className="space-y-2">
                <Label htmlFor="alert-description">Description</Label>
                <Textarea
                  id="alert-description"
                  placeholder="Describe what this alert monitors..."
                  className="bg-background/50 border-border min-h-[80px]"
                />
              </div>

              {/* Condition Builder */}
              <div className="space-y-4">
                <Label className="text-base">Alert Condition</Label>
                <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg bg-background/30 border border-border">
                  <span className="text-sm text-muted-foreground">When</span>
                  <Select defaultValue="buy">
                    <SelectTrigger className="w-[140px] bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="contract">Contract Call</SelectItem>
                    </SelectContent>
                  </Select>

                  <span className="text-sm text-muted-foreground">on</span>
                  <Select defaultValue="qubic">
                    <SelectTrigger className="w-[120px] bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qubic">QUBIC</SelectItem>
                      <SelectItem value="any">Any Token</SelectItem>
                    </SelectContent>
                  </Select>

                  <span className="text-sm text-muted-foreground">where</span>
                  <Select defaultValue="amount">
                    <SelectTrigger className="w-[140px] bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amount">Amount</SelectItem>
                      <SelectItem value="volume">Volume</SelectItem>
                      <SelectItem value="frequency">Frequency</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select defaultValue="greater">
                    <SelectTrigger className="w-[100px] bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="greater">&gt;</SelectItem>
                      <SelectItem value="less">&lt;</SelectItem>
                      <SelectItem value="equal">=</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    placeholder="10000"
                    className="w-[140px] bg-background border-border"
                  />

                  <span className="text-sm text-muted-foreground">in</span>
                  <Select defaultValue="1h">
                    <SelectTrigger className="w-[100px] bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5m">5 min</SelectItem>
                      <SelectItem value="15m">15 min</SelectItem>
                      <SelectItem value="1h">1 hour</SelectItem>
                      <SelectItem value="24h">24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notification Channels */}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Notification Channels
                </Label>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="custom-telegram"
                        disabled={!integrationStatus.telegram}
                      />
                      <Label
                        htmlFor="custom-telegram"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 text-primary" />
                        Telegram
                        {integrationStatus.telegram && channelNames.telegram && (
                          <span className="text-xs text-muted-foreground">
                            ({channelNames.telegram})
                          </span>
                        )}
                      </Label>
                    </div>
                    {!integrationStatus.telegram && (
                      <p className="text-xs text-destructive mt-1 ml-6">
                        Please connect your account in Integrations tab to use this platform
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="custom-discord"
                        disabled={!integrationStatus.discord}
                      />
                      <Label
                        htmlFor="custom-discord"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Hash className="w-4 h-4 text-primary" />
                        Discord
                        {integrationStatus.discord && channelNames.discord && (
                          <span className="text-xs text-muted-foreground">
                            ({channelNames.discord})
                          </span>
                        )}
                      </Label>
                    </div>
                    {!integrationStatus.discord && (
                      <p className="text-xs text-destructive mt-1 ml-6">
                        Please connect your account in Integrations tab to use this platform
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="custom-x"
                        disabled={!integrationStatus.x}
                      />
                      <Label
                        htmlFor="custom-x"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Twitter className="w-4 h-4 text-primary" />
                        X (Twitter)
                        {integrationStatus.x && channelNames.x && (
                          <span className="text-xs text-muted-foreground">
                            ({channelNames.x})
                          </span>
                        )}
                      </Label>
                    </div>
                    {!integrationStatus.x && (
                      <p className="text-xs text-destructive mt-1 ml-6">
                        Please connect your account in Integrations tab to use this platform
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleTestAlert}
                  className="border-primary/30 hover:bg-primary/10"
                >
                  Test Alert
                </Button>
                <Button className="bg-primary hover:bg-primary/90">
                  Activate Alert
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Alerts */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Alert Activity</h2>
          <Card className="gradient-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Last 5 Alerts Fired</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-lg bg-background/30 border border-border"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Badge variant="outline" className="border-primary/30 text-primary">
                        {alert.type}
                      </Badge>
                      <p className="text-sm">{alert.message}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        {alert.channels}
                      </span>
                      <span className="text-muted-foreground w-24 text-right">
                        {alert.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
