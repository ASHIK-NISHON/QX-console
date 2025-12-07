import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Settings2, MessageSquare, Hash, Twitter, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUniqueTokens } from "@/hooks/useUniqueTokens";
import { useIntegrations } from "@/contexts/IntegrationsContext";
import { formatDistanceToNow } from "date-fns";

interface PrebuiltCondition {
  name: string;
  description: string;
  enabled: boolean;
  channels: ("telegram" | "discord" | "x")[];
  settings: Record<string, string | number>;
}

export default function Airdrops() {
  const { toast } = useToast();
  const uniqueTokens = useUniqueTokens();
  const {
    integrationStatus,
    telegramCredentials,
    discordCredentials,
    xCredentials,
    recentAirdrops,
    sendNotification,
    sendTestNotification,
    removeRecentNotification,
    n8nWebhookUrl,
  } = useIntegrations();

  const [prebuiltConditions, setPrebuiltConditions] = useState<PrebuiltCondition[]>(() => {
    const stored = localStorage.getItem("airdropConditions");
    if (stored) {
      return JSON.parse(stored);
    }
    return [
      {
        name: "High-Volume Buyer Reward",
        description: "When a wallet buys more than threshold shares in 24h, send a bonus airdrop.",
        enabled: false,
        channels: [],
        settings: { sharesThreshold: 10000, airdropAmount: 200, token: "QUBIC" },
      },
      {
        name: "Ask Order Completion Reward",
        description: "When a wallet completes an ask order above threshold, reward them with an airdrop.",
        enabled: false,
        channels: [],
        settings: { minSharesSold: 5000, minPrice: 50, airdropAmount: 100 },
      },
    ];
  });

  // Custom airdrop state
  const [customAction, setCustomAction] = useState("AddToBidOrder");
  const [customToken, setCustomToken] = useState("any");
  const [customOperator, setCustomOperator] = useState("greater");
  const [customValue, setCustomValue] = useState("");
  const [airdropAmount, setAirdropAmount] = useState("");
  const [airdropToken, setAirdropToken] = useState("QUBIC");
  const [customChannels, setCustomChannels] = useState<("telegram" | "discord" | "x")[]>([]);
  const [testingRule, setTestingRule] = useState(false);
  const [activatingRule, setActivatingRule] = useState(false);

  const togglePrebuiltChannel = (conditionIdx: number, channel: "telegram" | "discord" | "x") => {
    setPrebuiltConditions((prev) => {
      const updated = prev.map((condition, idx) => {
        if (idx !== conditionIdx) return condition;
        const hasChannel = condition.channels.includes(channel);
        return {
          ...condition,
          channels: hasChannel
            ? condition.channels.filter((c) => c !== channel)
            : [...condition.channels, channel],
        };
      });
      localStorage.setItem("airdropConditions", JSON.stringify(updated));
      return updated;
    });
  };

  const togglePrebuiltEnabled = (conditionIdx: number) => {
    setPrebuiltConditions((prev) => {
      const updated = prev.map((condition, idx) =>
        idx === conditionIdx ? { ...condition, enabled: !condition.enabled } : condition
      );
      localStorage.setItem("airdropConditions", JSON.stringify(updated));
      return updated;
    });
  };

  const updatePrebuiltSetting = (conditionIdx: number, key: string, value: string | number) => {
    setPrebuiltConditions((prev) => {
      const updated = prev.map((condition, idx) =>
        idx === conditionIdx
          ? { ...condition, settings: { ...condition.settings, [key]: value } }
          : condition
      );
      localStorage.setItem("airdropConditions", JSON.stringify(updated));
      return updated;
    });
  };

  const removeAirdropCondition = (conditionIdx: number) => {
    setPrebuiltConditions((prev) => {
      const updated = prev.filter((_, idx) => idx !== conditionIdx);
      localStorage.setItem("airdropConditions", JSON.stringify(updated));
      toast({
        title: "Airdrop Removed",
        description: "Airdrop condition has been removed.",
      });
      return updated;
    });
  };

  const toggleCustomChannel = (channel: "telegram" | "discord" | "x") => {
    setCustomChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  };

  const getChannelName = (channel: "telegram" | "discord" | "x") => {
    if (channel === "telegram") return telegramCredentials?.channelName;
    if (channel === "discord") return discordCredentials?.channelName;
    if (channel === "x") return xCredentials?.channelName;
    return undefined;
  };

  const handleTestRule = async () => {
    if (customChannels.length === 0) {
      toast({
        title: "No Channels Selected",
        description: "Please select at least one notification channel.",
        variant: "destructive",
      });
      return;
    }

    setTestingRule(true);
    const operatorSymbol = customOperator === "greater" ? ">" : customOperator === "less" ? "<" : "=";
    const message = `🧪 TEST AIRDROP: Custom Rule\n\nCondition: ${customAction} on ${customToken === "any" ? "Any Token" : customToken} where shares ${operatorSymbol} ${customValue || "0"}\nReward: ${airdropAmount || "0"} ${airdropToken}`;

    const success = await sendTestNotification("Test Airdrop", message, customChannels);
    setTestingRule(false);

    toast({
      title: success ? "Test Airdrop Sent" : "Test Failed",
      description: success
        ? "Test airdrop notification sent to selected channels."
        : "Failed to send test. Check your configuration.",
      variant: success ? "default" : "destructive",
    });
  };

  const handleActivateRule = async () => {
    if (customChannels.length === 0) {
      toast({
        title: "No Channels Selected",
        description: "Please select at least one notification channel.",
        variant: "destructive",
      });
      return;
    }

    if (!customValue || !airdropAmount) {
      toast({
        title: "Missing Values",
        description: "Please enter threshold and airdrop amount.",
        variant: "destructive",
      });
      return;
    }

    setActivatingRule(true);
    
    const operatorSymbol = customOperator === "greater" ? ">" : customOperator === "less" ? "<" : "=";
    const conditionName = `Custom: ${customAction} on ${customToken === "any" ? "Any Token" : customToken} where shares ${operatorSymbol} ${customValue}`;
    
    // Add custom airdrop to conditions
    const newCondition: PrebuiltCondition = {
      name: conditionName,
      description: `Airdrop ${airdropAmount} ${airdropToken} when condition is met`,
      enabled: true,
      channels: customChannels,
      settings: {
        action: customAction,
        token: customToken,
        operator: customOperator,
        value: customValue,
        airdropAmount: airdropAmount,
        airdropToken: airdropToken,
      },
    };
    
    setPrebuiltConditions((prev) => {
      const updated = [newCondition, ...prev];
      localStorage.setItem("airdropConditions", JSON.stringify(updated));
      return updated;
    });
    
    setActivatingRule(false);

    toast({
      title: "Airdrop Rule Activated",
      description: "Your custom airdrop rule is now active.",
    });

    // Reset form
    setCustomAction("AddToBidOrder");
    setCustomToken("any");
    setCustomOperator("greater");
    setCustomValue("");
    setAirdropAmount("");
    setAirdropToken("QUBIC");
    setCustomChannels([]);
  };

  const ChannelSelector = ({
    channels,
    onToggle,
    prefix,
  }: {
    channels: ("telegram" | "discord" | "x")[];
    onToggle: (channel: "telegram" | "discord" | "x") => void;
    prefix: string;
  }) => (
    <div className="space-y-2">
      <Label className="text-sm text-muted-foreground">Notification Channels</Label>
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`${prefix}-telegram`}
            checked={channels.includes("telegram")}
            onCheckedChange={() => onToggle("telegram")}
            disabled={!integrationStatus.telegram}
          />
          <Label htmlFor={`${prefix}-telegram`} className="flex items-center gap-1.5 cursor-pointer text-sm">
            <MessageSquare className="w-3.5 h-3.5 text-primary" />
            Telegram
            {integrationStatus.telegram && getChannelName("telegram") && (
              <span className="text-xs text-muted-foreground">({getChannelName("telegram")})</span>
            )}
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`${prefix}-discord`}
            checked={channels.includes("discord")}
            onCheckedChange={() => onToggle("discord")}
            disabled={!integrationStatus.discord}
          />
          <Label htmlFor={`${prefix}-discord`} className="flex items-center gap-1.5 cursor-pointer text-sm">
            <Hash className="w-3.5 h-3.5 text-primary" />
            Discord
            {integrationStatus.discord && getChannelName("discord") && (
              <span className="text-xs text-muted-foreground">({getChannelName("discord")})</span>
            )}
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`${prefix}-x`}
            checked={channels.includes("x")}
            onCheckedChange={() => onToggle("x")}
            disabled={!integrationStatus.x}
          />
          <Label htmlFor={`${prefix}-x`} className="flex items-center gap-1.5 cursor-pointer text-sm">
            <Twitter className="w-3.5 h-3.5 text-primary" />
            X
            {integrationStatus.x && getChannelName("x") && (
              <span className="text-xs text-muted-foreground">({getChannelName("x")})</span>
            )}
          </Label>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout title="Airdrops">
      <div className="max-w-5xl space-y-6">
        {/* Description */}
        <Card className="gradient-card border-border">
          <CardContent className="pt-6 space-y-4">
            <p className="text-muted-foreground">
              Automate airdrops based on token purchases in QX. When conditions are met, 
              airdrops are automatically triggered and announced across your connected channels.
            </p>
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

        {/* Prebuilt Conditions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Prebuilt Airdrop Conditions
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* High-Volume Buyer Reward */}
            <Card className="gradient-card border-border hover:border-primary/30 transition-smooth">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {prebuiltConditions[0].name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      {prebuiltConditions[0].description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={prebuiltConditions[0].enabled}
                      onCheckedChange={() => togglePrebuiltEnabled(0)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAirdropCondition(0)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Shares Threshold</Label>
                    <Input
                      type="number"
                      value={prebuiltConditions[0].settings.sharesThreshold}
                      onChange={(e) => updatePrebuiltSetting(0, "sharesThreshold", e.target.value)}
                      className="w-32 h-8 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Airdrop Amount</Label>
                    <Input
                      type="number"
                      value={prebuiltConditions[0].settings.airdropAmount}
                      onChange={(e) => updatePrebuiltSetting(0, "airdropAmount", e.target.value)}
                      className="w-32 h-8 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Token</Label>
                    <Select
                      value={String(prebuiltConditions[0].settings.token)}
                      onValueChange={(v) => updatePrebuiltSetting(0, "token", v)}
                    >
                      <SelectTrigger className="w-32 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueTokens.map((token) => (
                          <SelectItem key={token} value={token}>
                            {token}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <ChannelSelector
                  channels={prebuiltConditions[0].channels}
                  onToggle={(c) => togglePrebuiltChannel(0, c)}
                  prefix="prebuilt-0"
                />
              </CardContent>
            </Card>

            {/* Ask Order Completion Reward */}
            <Card className="gradient-card border-border hover:border-primary/30 transition-smooth">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-base sm:text-lg">{prebuiltConditions[1].name}</CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                      {prebuiltConditions[1].description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={prebuiltConditions[1].enabled}
                      onCheckedChange={() => togglePrebuiltEnabled(1)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAirdropCondition(1)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Min Shares Sold</Label>
                    <Input
                      type="number"
                      value={prebuiltConditions[1].settings.minSharesSold}
                      onChange={(e) => updatePrebuiltSetting(1, "minSharesSold", e.target.value)}
                      className="w-32 h-8 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Min Price</Label>
                    <Input
                      type="number"
                      value={prebuiltConditions[1].settings.minPrice}
                      onChange={(e) => updatePrebuiltSetting(1, "minPrice", e.target.value)}
                      className="w-32 h-8 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Airdrop Amount</Label>
                    <Input
                      type="number"
                      value={prebuiltConditions[1].settings.airdropAmount}
                      onChange={(e) => updatePrebuiltSetting(1, "airdropAmount", e.target.value)}
                      className="w-32 h-8 text-sm"
                    />
                  </div>
                </div>
                <ChannelSelector
                  channels={prebuiltConditions[1].channels}
                  onToggle={(c) => togglePrebuiltChannel(1, c)}
                  prefix="prebuilt-1"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Custom Condition */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            Custom Airdrop Condition
          </h2>

          <Card className="gradient-card border-border border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Build Your Own Rule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3 text-sm">
                  <span className="text-muted-foreground">When</span>
                  <Select value={customAction} onValueChange={setCustomAction}>
                    <SelectTrigger className="w-full sm:w-44 h-9 text-sm">
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

                  <span className="text-muted-foreground">on</span>
                  <Select value={customToken} onValueChange={setCustomToken}>
                    <SelectTrigger className="w-full sm:w-28 h-9 text-sm">
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

                  <span className="text-muted-foreground">where shares</span>
                  <Select value={customOperator} onValueChange={setCustomOperator}>
                    <SelectTrigger className="w-full sm:w-20 h-9 text-sm">
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
                    placeholder="1000"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    className="w-full sm:w-28 h-9 text-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3 text-sm">
                  <span className="text-muted-foreground">then</span>
                  <Select defaultValue="airdrop">
                    <SelectTrigger className="w-full sm:w-36 h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="airdrop">Send Airdrop</SelectItem>
                    </SelectContent>
                  </Select>

                  <span className="text-muted-foreground">of</span>
                  <Input
                    type="number"
                    placeholder="100"
                    value={airdropAmount}
                    onChange={(e) => setAirdropAmount(e.target.value)}
                    className="w-full sm:w-28 h-9 text-sm"
                  />

                  <Select value={airdropToken} onValueChange={setAirdropToken}>
                    <SelectTrigger className="w-full sm:w-28 h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueTokens.map((token) => (
                        <SelectItem key={token} value={token}>
                          {token}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <ChannelSelector
                  channels={customChannels}
                  onToggle={toggleCustomChannel}
                  prefix="custom"
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleTestRule}
                    disabled={testingRule}
                  >
                    {testingRule && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Test Rule
                  </Button>
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={handleActivateRule}
                    disabled={activatingRule}
                  >
                    {activatingRule && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Activate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Airdrops */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Airdrops</h2>
          <Card className="gradient-card border-border">
            <CardContent className="p-0">
              {recentAirdrops.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No airdrops sent yet. Configure and activate airdrop rules above to start sending notifications.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentAirdrops.map((airdrop) => (
                    <div key={airdrop.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          {airdrop.title}
                        </Badge>
                        <span className="text-sm">{airdrop.message.slice(0, 60)}...</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{airdrop.channels.join(", ")}</span>
                          <span>{formatDistanceToNow(new Date(airdrop.timestamp), { addSuffix: true })}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRecentNotification("airdrop", airdrop.id)}
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
