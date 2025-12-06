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
import { useUniqueTokens } from "@/hooks/useUniqueTokens";

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
    description: "Trigger when a whale wallet adds a bid order with shares above threshold",
    condition: "AddToBidOrder > 10,000 shares from whale wallet",
    enabled: true,
    channels: ["telegram", "discord"],
  },
  {
    name: "Whale Sell Alert",
    description: "Trigger when a whale wallet adds an ask order with shares above threshold",
    condition: "AddToAskOrder > 5,000 shares from whale wallet",
    enabled: true,
    channels: ["telegram", "discord", "x"],
  },
];

const recentAlerts = [
  {
    type: "Whale Buy",
    message: "Whale EJAV...VYJC added bid order for 15,420 QXMR shares",
    channels: "Telegram, Discord",
    time: "2 min ago",
  },
  {
    type: "Whale Sell",
    message: "Whale QXMR...OEYB added ask order for 8,750 shares",
    channels: "Telegram, Discord, X",
    time: "1 hour ago",
  },
  {
    type: "Whale Buy",
    message: "Whale ABCD...XYZ1 added bid order for 23,100 CFB shares",
    channels: "Telegram, Discord",
    time: "5 hours ago",
  },
];

export default function Alerts() {
  const { toast } = useToast();
  const uniqueTokens = useUniqueTokens();

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
                  placeholder="e.g., Large Bid Order Alert"
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
                  <Select defaultValue="AddToBidOrder">
                    <SelectTrigger className="w-[160px] bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AddToBidOrder">Add Bid Order</SelectItem>
                      <SelectItem value="AddToAskOrder">Add Ask Order</SelectItem>
                      <SelectItem value="RemoveFromBidOrder">Remove Bid Order</SelectItem>
                      <SelectItem value="RemoveFromAskOrder">Remove Ask Order</SelectItem>
                      <SelectItem value="TransferShareOwnershipAndPossession">Transfer Shares</SelectItem>
                      <SelectItem value="IssueAsset">Issue Asset</SelectItem>
                    </SelectContent>
                  </Select>

                  <span className="text-sm text-muted-foreground">on</span>
                  <Select defaultValue="any">
                    <SelectTrigger className="w-[120px] bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Token</SelectItem>
                      {uniqueTokens.map((token) => (
                        <SelectItem key={token} value={token}>
                          {token}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span className="text-sm text-muted-foreground">where</span>
                  <Select defaultValue="shares">
                    <SelectTrigger className="w-[120px] bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shares">Shares</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select defaultValue="greater">
                    <SelectTrigger className="w-[80px] bg-background border-border">
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
                    className="w-[120px] bg-background border-border"
                  />
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

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={handleTestAlert}>
                  Test Alert
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90">
                  Activate Alert
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Alerts */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Alerts</h2>
          <Card className="gradient-card border-border">
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recentAlerts.map((alert, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {alert.type}
                      </Badge>
                      <span className="text-sm">{alert.message}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{alert.channels}</span>
                      <span>{alert.time}</span>
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
