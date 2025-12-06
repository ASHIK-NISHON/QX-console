import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Hash, Twitter, CheckCircle2, XCircle, Loader2, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIntegrations } from "@/contexts/IntegrationsContext";

export default function Integrations() {
  const { toast } = useToast();
  const {
    telegramCredentials,
    discordCredentials,
    xCredentials,
    n8nWebhookUrl,
    integrationStatus,
    setTelegramCredentials,
    setDiscordCredentials,
    setXCredentials,
    setN8nWebhookUrl,
    testTelegramConnection,
    testDiscordConnection,
    testXConnection,
  } = useIntegrations();

  // Form states
  const [telegramToken, setTelegramToken] = useState(telegramCredentials?.telegramToken || "");
  const [telegramChatId, setTelegramChatId] = useState(telegramCredentials?.telegramChatId || "");
  const [telegramChannelName, setTelegramChannelName] = useState(telegramCredentials?.channelName || "");
  
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState(discordCredentials?.discordWebhookUrl || "");
  const [discordChannelName, setDiscordChannelName] = useState(discordCredentials?.channelName || "");
  
  const [xApiKey, setXApiKey] = useState(xCredentials?.xApiKey || "");
  const [xApiSecret, setXApiSecret] = useState(xCredentials?.xApiSecret || "");
  const [xAccessToken, setXAccessToken] = useState(xCredentials?.xAccessToken || "");
  const [xAccessSecret, setXAccessSecret] = useState(xCredentials?.xAccessSecret || "");
  const [xChannelName, setXChannelName] = useState(xCredentials?.channelName || "");

  const [webhookUrl, setWebhookUrl] = useState(n8nWebhookUrl);

  // Loading states
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [testingDiscord, setTestingDiscord] = useState(false);
  const [testingX, setTestingX] = useState(false);

  const handleSaveWebhook = () => {
    setN8nWebhookUrl(webhookUrl);
    toast({
      title: "Webhook Saved",
      description: "Your n8n webhook URL has been saved.",
    });
  };

  const handleTestTelegram = async () => {
    if (!telegramToken || !telegramChatId) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both Bot Token and Chat ID.",
        variant: "destructive",
      });
      return;
    }

    setTestingTelegram(true);
    const success = await testTelegramConnection({
      telegramToken,
      telegramChatId,
      channelName: telegramChannelName,
    });
    setTestingTelegram(false);

    toast({
      title: success ? "Test Sent" : "Test Failed",
      description: success
        ? "Test message sent via n8n. Check your Telegram channel."
        : "Failed to send test message. Check your credentials and n8n webhook.",
      variant: success ? "default" : "destructive",
    });
  };

  const handleSaveTelegram = () => {
    if (!telegramToken || !telegramChatId) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both Bot Token and Chat ID.",
        variant: "destructive",
      });
      return;
    }

    setTelegramCredentials({
      telegramToken,
      telegramChatId,
      channelName: telegramChannelName || undefined,
    });
    toast({
      title: "Telegram Saved",
      description: "Your Telegram credentials have been saved.",
    });
  };

  const handleTestDiscord = async () => {
    if (!discordWebhookUrl) {
      toast({
        title: "Missing Webhook URL",
        description: "Please enter your Discord webhook URL.",
        variant: "destructive",
      });
      return;
    }

    setTestingDiscord(true);
    const success = await testDiscordConnection({
      discordWebhookUrl,
      channelName: discordChannelName,
    });
    setTestingDiscord(false);

    toast({
      title: success ? "Connection Successful" : "Connection Failed",
      description: success
        ? "Test message sent to Discord successfully!"
        : "Failed to connect. Please check your webhook URL.",
      variant: success ? "default" : "destructive",
    });
  };

  const handleSaveDiscord = () => {
    if (!discordWebhookUrl) {
      toast({
        title: "Missing Webhook URL",
        description: "Please enter your Discord webhook URL.",
        variant: "destructive",
      });
      return;
    }

    setDiscordCredentials({
      discordWebhookUrl,
      channelName: discordChannelName || undefined,
    });
    toast({
      title: "Discord Saved",
      description: "Your Discord credentials have been saved.",
    });
  };

  const handleTestX = async () => {
    if (!xApiKey || !xApiSecret || !xAccessToken || !xAccessSecret) {
      toast({
        title: "Missing Credentials",
        description: "Please enter all X OAuth 1.0a credentials.",
        variant: "destructive",
      });
      return;
    }

    setTestingX(true);
    const success = await testXConnection({
      xApiKey,
      xApiSecret,
      xAccessToken,
      xAccessSecret,
      channelName: xChannelName,
    });
    setTestingX(false);

    toast({
      title: success ? "Test Sent" : "Test Failed",
      description: success
        ? "Test message sent via n8n. Check your X timeline."
        : "Failed to send test message. Check your credentials and n8n webhook.",
      variant: success ? "default" : "destructive",
    });
  };

  const handleSaveX = () => {
    if (!xApiKey || !xApiSecret || !xAccessToken || !xAccessSecret) {
      toast({
        title: "Missing Credentials",
        description: "Please enter all X OAuth 1.0a credentials.",
        variant: "destructive",
      });
      return;
    }

    setXCredentials({
      xApiKey,
      xApiSecret,
      xAccessToken,
      xAccessSecret,
      channelName: xChannelName || undefined,
    });
    toast({
      title: "X (Twitter) Saved",
      description: "Your X credentials have been saved.",
    });
  };

  const handleDisconnect = (platform: "telegram" | "discord" | "x") => {
    if (platform === "telegram") {
      setTelegramCredentials(null);
      setTelegramToken("");
      setTelegramChatId("");
      setTelegramChannelName("");
    } else if (platform === "discord") {
      setDiscordCredentials(null);
      setDiscordWebhookUrl("");
      setDiscordChannelName("");
    } else {
      setXCredentials(null);
      setXApiKey("");
      setXApiSecret("");
      setXAccessToken("");
      setXAccessSecret("");
      setXChannelName("");
    }
    toast({
      title: "Disconnected",
      description: `${platform.charAt(0).toUpperCase() + platform.slice(1)} has been disconnected.`,
    });
  };

  return (
    <DashboardLayout title="Integrations">
      <div className="max-w-4xl space-y-6">
        <Card className="gradient-card border-border">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Connect your Telegram, Discord, and X accounts to enable alerts and
              airdrop notifications across your communities.
            </p>
          </CardContent>
        </Card>

        {/* n8n Webhook Configuration */}
        <Card className="gradient-card border-primary/30 hover:border-primary/50 transition-smooth">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Link2 className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">n8n Webhook</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Required for sending alerts & airdrops
                </p>
              </div>
              {n8nWebhookUrl ? (
                <Badge variant="outline" className="gap-1.5 border-success/30 text-success">
                  <CheckCircle2 className="w-3 h-3" />
                  Configured
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1.5 border-destructive/30 text-destructive">
                  <XCircle className="w-3 h-3" />
                  Not Set
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input
                type="url"
                placeholder="https://your-n8n.com/webhook/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                This URL will receive all alert and airdrop notifications
              </p>
            </div>
            <Button onClick={handleSaveWebhook} className="w-full bg-primary hover:bg-primary/90">
              Save Webhook URL
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Telegram Integration */}
          <Card className="gradient-card border-border hover:border-primary/30 transition-smooth">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">Telegram</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Bot alerts & notifications
                  </p>
                </div>
                {integrationStatus.telegram ? (
                  <Badge variant="outline" className="gap-1.5 border-success/30 text-success">
                    <CheckCircle2 className="w-3 h-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1.5 border-destructive/30 text-destructive">
                    <XCircle className="w-3 h-3" />
                    Not Connected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Bot API Token</Label>
                <Input
                  type="password"
                  placeholder="Enter your Telegram bot token"
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Chat ID</Label>
                <Input
                  placeholder="Enter your Chat ID (e.g., -1001234567890)"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Channel Name (optional)</Label>
                <Input
                  placeholder="@your_channel"
                  value={telegramChannelName}
                  onChange={(e) => setTelegramChannelName(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleTestTelegram}
                  disabled={testingTelegram}
                >
                  {testingTelegram && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Test Connection
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={handleSaveTelegram}
                >
                  Save
                </Button>
              </div>
              {integrationStatus.telegram && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => handleDisconnect("telegram")}
                >
                  Disconnect
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Discord Integration */}
          <Card className="gradient-card border-border hover:border-primary/30 transition-smooth">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Hash className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">Discord</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Webhook notifications
                  </p>
                </div>
                {integrationStatus.discord ? (
                  <Badge variant="outline" className="gap-1.5 border-success/30 text-success">
                    <CheckCircle2 className="w-3 h-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1.5 border-destructive/30 text-destructive">
                    <XCircle className="w-3 h-3" />
                    Not Connected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  type="password"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={discordWebhookUrl}
                  onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Channel Name (optional)</Label>
                <Input
                  placeholder="#your-channel"
                  value={discordChannelName}
                  onChange={(e) => setDiscordChannelName(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleTestDiscord}
                  disabled={testingDiscord}
                >
                  {testingDiscord && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Test Connection
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={handleSaveDiscord}
                >
                  Save
                </Button>
              </div>
              {integrationStatus.discord && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => handleDisconnect("discord")}
                >
                  Disconnect
                </Button>
              )}
            </CardContent>
          </Card>

          {/* X (Twitter) Integration */}
          <Card className="gradient-card border-border hover:border-primary/30 transition-smooth md:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Twitter className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">X (Twitter)</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Post alerts to X timeline
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {integrationStatus.x ? (
                    <Badge variant="outline" className="gap-1.5 border-success/30 text-success">
                      <CheckCircle2 className="w-3 h-3" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1.5 border-destructive/30 text-destructive">
                      <XCircle className="w-3 h-3" />
                      Not Connected
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">OAuth 1.0a</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    placeholder="Enter your X API Key"
                    value={xApiKey}
                    onChange={(e) => setXApiKey(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Secret</Label>
                  <Input
                    type="password"
                    placeholder="Enter your X API Secret"
                    value={xApiSecret}
                    onChange={(e) => setXApiSecret(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Access Token</Label>
                  <Input
                    type="password"
                    placeholder="Enter your X Access Token"
                    value={xAccessToken}
                    onChange={(e) => setXAccessToken(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Access Secret</Label>
                  <Input
                    type="password"
                    placeholder="Enter your X Access Secret"
                    value={xAccessSecret}
                    onChange={(e) => setXAccessSecret(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Channel Name (optional)</Label>
                <Input
                  placeholder="@your_twitter_handle"
                  value={xChannelName}
                  onChange={(e) => setXChannelName(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleTestX}
                  disabled={testingX}
                >
                  {testingX && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Test Connection
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={handleSaveX}
                >
                  Save & Connect
                </Button>
              </div>
              {integrationStatus.x && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => handleDisconnect("x")}
                >
                  Disconnect
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
