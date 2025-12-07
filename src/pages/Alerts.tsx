import { useState } from "react";
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
import { Bell, MessageSquare, Hash, Twitter, AlertCircle, Plus, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUniqueTokens } from "@/hooks/useUniqueTokens";
import { useIntegrations } from "@/contexts/IntegrationsContext";
import { formatDistanceToNow } from "date-fns";

interface AlertTemplate {
  name: string;
  description: string;
  condition: string;
  enabled: boolean;
  channels: ("telegram" | "discord" | "x")[];
}

export default function Alerts() {
  const { toast } = useToast();
  const uniqueTokens = useUniqueTokens();
  const {
    integrationStatus,
    telegramCredentials,
    discordCredentials,
    xCredentials,
    recentAlerts,
    sendNotification,
    sendTestNotification,
    removeRecentNotification,
    n8nWebhookUrl,
  } = useIntegrations();

  const [alertTemplates, setAlertTemplates] = useState<AlertTemplate[]>(() => {
    const stored = localStorage.getItem("alertTemplates");
    if (stored) {
      return JSON.parse(stored);
    }
    return [
      {
        name: "Whale Buy Alert",
        description: "Trigger when a whale wallet adds a bid order with shares above threshold",
        condition: "AddToBidOrder > 10,000 shares from whale wallet",
        enabled: false,
        channels: [],
      },
      {
        name: "Whale Sell Alert",
        description: "Trigger when a whale wallet adds an ask order with shares above threshold",
        condition: "AddToAskOrder > 5,000 shares from whale wallet",
        enabled: false,
        channels: [],
      },
    ];
  });

  // Custom alert state
  const [customAlertName, setCustomAlertName] = useState("");
  const [customAlertDescription, setCustomAlertDescription] = useState("");
  const [customAction, setCustomAction] = useState("AddToBidOrder");
  const [customToken, setCustomToken] = useState("any");
  const [customField, setCustomField] = useState("shares");
  const [customOperator, setCustomOperator] = useState("greater");
  const [customValue, setCustomValue] = useState("");
  const [customChannels, setCustomChannels] = useState<("telegram" | "discord" | "x")[]>([]);
  const [testingAlert, setTestingAlert] = useState(false);
  const [activatingAlert, setActivatingAlert] = useState(false);

  const toggleTemplateChannel = (templateIdx: number, channel: "telegram" | "discord" | "x") => {
    setAlertTemplates((prev) => {
      const updated = prev.map((template, idx) => {
        if (idx !== templateIdx) return template;
        const hasChannel = template.channels.includes(channel);
        return {
          ...template,
          channels: hasChannel
            ? template.channels.filter((c) => c !== channel)
            : [...template.channels, channel],
        };
      });
      localStorage.setItem("alertTemplates", JSON.stringify(updated));
      return updated;
    });
  };

  const toggleTemplateEnabled = (templateIdx: number) => {
    setAlertTemplates((prev) => {
      const updated = prev.map((template, idx) =>
        idx === templateIdx ? { ...template, enabled: !template.enabled } : template
      );
      localStorage.setItem("alertTemplates", JSON.stringify(updated));
      return updated;
    });
  };

  const removeAlertTemplate = (templateIdx: number) => {
    setAlertTemplates((prev) => {
      const updated = prev.filter((_, idx) => idx !== templateIdx);
      localStorage.setItem("alertTemplates", JSON.stringify(updated));
      toast({
        title: "Alert Removed",
        description: "Alert template has been removed.",
      });
      return updated;
    });
  };

  const toggleCustomChannel = (channel: "telegram" | "discord" | "x") => {
    setCustomChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  };

  const handleTestAlert = async () => {
    if (customChannels.length === 0) {
      toast({
        title: "No Channels Selected",
        description: "Please select at least one notification channel.",
        variant: "destructive",
      });
      return;
    }

    setTestingAlert(true);
    const operatorSymbol = customOperator === "greater" ? ">" : customOperator === "less" ? "<" : "=";
    const message = `🧪 TEST ALERT: ${customAlertName || "Custom Alert"}\n\nCondition: ${customAction} on ${customToken === "any" ? "Any Token" : customToken} where ${customField} ${operatorSymbol} ${customValue || "0"}`;

    const success = await sendTestNotification(customAlertName || "Test Alert", message, customChannels);
    setTestingAlert(false);

    toast({
      title: success ? "Test Alert Sent" : "Test Failed",
      description: success
        ? "Test alert sent to selected channels."
        : "Failed to send test alert. Check your configuration.",
      variant: success ? "default" : "destructive",
    });
  };

  const handleActivateAlert = async () => {
    if (!customAlertName) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your alert.",
        variant: "destructive",
      });
      return;
    }

    if (customChannels.length === 0) {
      toast({
        title: "No Channels Selected",
        description: "Please select at least one notification channel.",
        variant: "destructive",
      });
      return;
    }

    setActivatingAlert(true);
    
    const operatorSymbol = customOperator === "greater" ? ">" : customOperator === "less" ? "<" : "=";
    const condition = `${customAction} on ${customToken === "any" ? "Any Token" : customToken} where ${customField} ${operatorSymbol} ${customValue || "0"}`;
    
    // Add custom alert to templates
    const newAlert: AlertTemplate = {
      name: customAlertName,
      description: customAlertDescription || `Custom alert: ${condition}`,
      condition: condition,
      enabled: true,
      channels: customChannels,
    };
    
    setAlertTemplates((prev) => {
      const updated = [newAlert, ...prev];
      localStorage.setItem("alertTemplates", JSON.stringify(updated));
      return updated;
    });
    
    setActivatingAlert(false);

    toast({
      title: "Alert Activated",
      description: `"${customAlertName}" is now active and will send notifications when triggered.`,
    });

    // Reset form
    setCustomAlertName("");
    setCustomAlertDescription("");
    setCustomValue("");
    setCustomChannels([]);
  };

  const getChannelName = (channel: "telegram" | "discord" | "x") => {
    if (channel === "telegram") return telegramCredentials?.channelName;
    if (channel === "discord") return discordCredentials?.channelName;
    if (channel === "x") return xCredentials?.channelName;
    return undefined;
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
                <strong>Whale Detection:</strong> This app identifies whale transactions based on transaction amounts exceeding configured thresholds per token (e.g., 1,000,000 for QUBIC, 500,000 for QMINE). 
                You can edit these thresholds in the Settings → Whale Detection Thresholds tab.
              </AlertDescription>
            </Alert>
            {!n8nWebhookUrl && (
              <Alert className="border-destructive/30 bg-destructive/5">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-sm">
                  <strong>Setup Required:</strong> Please configure your n8n webhook URL in the Integrations tab first.
                </AlertDescription>
              </Alert>
            )}
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
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="flex-1 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-base sm:text-lg">
                            {template.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            {template.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={template.enabled}
                            onCheckedChange={() => toggleTemplateEnabled(idx)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAlertTemplate(idx)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
                                  checked={template.channels.includes("telegram")}
                                  onCheckedChange={() => toggleTemplateChannel(idx, "telegram")}
                                  disabled={!integrationStatus.telegram}
                                />
                                <Label
                                  htmlFor={`${idx}-telegram`}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <MessageSquare className="w-4 h-4 text-primary" />
                                  Telegram
                                  {integrationStatus.telegram && getChannelName("telegram") && (
                                    <span className="text-xs text-muted-foreground">
                                      ({getChannelName("telegram")})
                                    </span>
                                  )}
                                </Label>
                              </div>
                              {!integrationStatus.telegram && (
                                <p className="text-xs text-destructive mt-1 ml-6">
                                  Please connect your account in Integrations tab
                                </p>
                              )}
                            </div>

                            <div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${idx}-discord`}
                                  checked={template.channels.includes("discord")}
                                  onCheckedChange={() => toggleTemplateChannel(idx, "discord")}
                                  disabled={!integrationStatus.discord}
                                />
                                <Label
                                  htmlFor={`${idx}-discord`}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <Hash className="w-4 h-4 text-primary" />
                                  Discord
                                  {integrationStatus.discord && getChannelName("discord") && (
                                    <span className="text-xs text-muted-foreground">
                                      ({getChannelName("discord")})
                                    </span>
                                  )}
                                </Label>
                              </div>
                              {!integrationStatus.discord && (
                                <p className="text-xs text-destructive mt-1 ml-6">
                                  Please connect your account in Integrations tab
                                </p>
                              )}
                            </div>

                            <div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${idx}-x`}
                                  checked={template.channels.includes("x")}
                                  onCheckedChange={() => toggleTemplateChannel(idx, "x")}
                                  disabled={!integrationStatus.x}
                                />
                                <Label
                                  htmlFor={`${idx}-x`}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <Twitter className="w-4 h-4 text-primary" />
                                  X (Twitter)
                                  {integrationStatus.x && getChannelName("x") && (
                                    <span className="text-xs text-muted-foreground">
                                      ({getChannelName("x")})
                                    </span>
                                  )}
                                </Label>
                              </div>
                              {!integrationStatus.x && (
                                <p className="text-xs text-destructive mt-1 ml-6">
                                  Please connect your account in Integrations tab
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
                  value={customAlertName}
                  onChange={(e) => setCustomAlertName(e.target.value)}
                  className="bg-background/50 border-border"
                />
              </div>

              {/* Alert Description */}
              <div className="space-y-2">
                <Label htmlFor="alert-description">Description</Label>
                <Textarea
                  id="alert-description"
                  placeholder="Describe what this alert monitors..."
                  value={customAlertDescription}
                  onChange={(e) => setCustomAlertDescription(e.target.value)}
                  className="bg-background/50 border-border min-h-[80px]"
                />
              </div>

              {/* Condition Builder */}
              <div className="space-y-4">
                <Label className="text-base">Alert Condition</Label>
                <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg bg-background/30 border border-border">
                  <span className="text-sm text-muted-foreground">When</span>
                  <Select value={customAction} onValueChange={setCustomAction}>
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
                  <Select value={customToken} onValueChange={setCustomToken}>
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
                  <Select value={customField} onValueChange={setCustomField}>
                    <SelectTrigger className="w-[120px] bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shares">Shares</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={customOperator} onValueChange={setCustomOperator}>
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
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
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
                        checked={customChannels.includes("telegram")}
                        onCheckedChange={() => toggleCustomChannel("telegram")}
                        disabled={!integrationStatus.telegram}
                      />
                      <Label
                        htmlFor="custom-telegram"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 text-primary" />
                        Telegram
                        {integrationStatus.telegram && getChannelName("telegram") && (
                          <span className="text-xs text-muted-foreground">
                            ({getChannelName("telegram")})
                          </span>
                        )}
                      </Label>
                    </div>
                    {!integrationStatus.telegram && (
                      <p className="text-xs text-destructive mt-1 ml-6">
                        Please connect your account in Integrations tab
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="custom-discord"
                        checked={customChannels.includes("discord")}
                        onCheckedChange={() => toggleCustomChannel("discord")}
                        disabled={!integrationStatus.discord}
                      />
                      <Label
                        htmlFor="custom-discord"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Hash className="w-4 h-4 text-primary" />
                        Discord
                        {integrationStatus.discord && getChannelName("discord") && (
                          <span className="text-xs text-muted-foreground">
                            ({getChannelName("discord")})
                          </span>
                        )}
                      </Label>
                    </div>
                    {!integrationStatus.discord && (
                      <p className="text-xs text-destructive mt-1 ml-6">
                        Please connect your account in Integrations tab
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="custom-x"
                        checked={customChannels.includes("x")}
                        onCheckedChange={() => toggleCustomChannel("x")}
                        disabled={!integrationStatus.x}
                      />
                      <Label
                        htmlFor="custom-x"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Twitter className="w-4 h-4 text-primary" />
                        X (Twitter)
                        {integrationStatus.x && getChannelName("x") && (
                          <span className="text-xs text-muted-foreground">
                            ({getChannelName("x")})
                          </span>
                        )}
                      </Label>
                    </div>
                    {!integrationStatus.x && (
                      <p className="text-xs text-destructive mt-1 ml-6">
                        Please connect your account in Integrations tab
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleTestAlert}
                  disabled={testingAlert}
                >
                  {testingAlert && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Test Alert
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={handleActivateAlert}
                  disabled={activatingAlert}
                >
                  {activatingAlert && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
              {recentAlerts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No alerts sent yet. Configure and activate alerts above to start receiving notifications.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentAlerts.map((alert) => (
                    <div key={alert.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          {alert.title}
                        </Badge>
                        <span className="text-sm">{alert.message.slice(0, 60)}...</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{alert.channels.join(", ")}</span>
                          <span>{formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRecentNotification("alert", alert.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
