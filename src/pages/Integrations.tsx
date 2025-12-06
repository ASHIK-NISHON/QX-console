import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Hash, Twitter, CheckCircle2, XCircle } from "lucide-react";

export default function Integrations() {
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
                <Badge
                  variant="outline"
                  className="gap-1.5 border-success/30 text-success"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Connected
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Bot API Token</Label>
                <Input
                  type="password"
                  placeholder="Enter your Telegram bot token"
                  defaultValue="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Chat ID</Label>
                <Input
                  placeholder="Enter your Chat ID (e.g., -1001234567890)"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Channel Name (optional)</Label>
                <Input
                  placeholder="@qubic_activity"
                  defaultValue="@qubic_activity"
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  Test Connection
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90">
                  Save
                </Button>
              </div>
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
                <Badge
                  variant="outline"
                  className="gap-1.5 border-success/30 text-success"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Connected
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  type="password"
                  placeholder="https://discord.com/api/webhooks/..."
                  defaultValue="https://discord.com/api/webhooks/123456"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Channel Name (optional)</Label>
                <Input
                  placeholder="#whale-alerts"
                  defaultValue="#qubic-activity"
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  Test Connection
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90">
                  Save
                </Button>
              </div>
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
                  <Badge
                    variant="outline"
                    className="gap-1.5 border-destructive/30 text-destructive"
                  >
                    <XCircle className="w-3 h-3" />
                    Not Connected
                  </Badge>
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
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Secret</Label>
                  <Input
                    type="password"
                    placeholder="Enter your X API Secret"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Access Token</Label>
                  <Input
                    type="password"
                    placeholder="Enter your X Access Token"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Access Secret</Label>
                  <Input
                    type="password"
                    placeholder="Enter your X Access Secret"
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Channel Name (optional)</Label>
                <Input
                  placeholder="@your_twitter_handle"
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  Test Connection
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90">
                  Save & Connect
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
