import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Settings2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Airdrops() {
  const { toast } = useToast();

  const handleTestRule = () => {
    toast({
      title: "Testing Rule",
      description: "Custom airdrop condition validated successfully. Rule is ready to activate.",
    });
  };

  return (
    <DashboardLayout title="Airdrops">
      <div className="max-w-5xl space-y-6">
        {/* Description */}
        <Card className="gradient-card border-border">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Automate airdrops based on token purchases in QX. When conditions are met, 
              airdrops are automatically triggered and announced across your connected channels.
            </p>
          </CardContent>
        </Card>

        {/* Prebuilt Conditions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Prebuilt Airdrop Conditions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Welcome Buyer Airdrop */}
            <Card className="gradient-card border-border hover:border-primary/30 transition-smooth">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">Welcome Buyer Airdrop</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      When a wallet's first QUBIC purchase is detected, send a small
                      welcome airdrop.
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>First purchase only</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>Minimum purchase: 100 QUBIC</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm">Airdrop Amount</Label>
                    <Input
                      type="number"
                      defaultValue="50"
                      className="w-24 h-8 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Token</Label>
                    <Select defaultValue="qubic">
                      <SelectTrigger className="w-24 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="qubic">QUBIC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-1 pt-2">
                  <Badge variant="outline" className="text-xs">
                    Telegram
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Discord
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* High-Volume Buyer Reward */}
            <Card className="gradient-card border-border hover:border-primary/30 transition-smooth">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      High-Volume Buyer Reward
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      If a wallet buys more than threshold in 24h, send a bonus
                      airdrop.
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Volume Threshold</Label>
                    <Input
                      type="number"
                      defaultValue="10000"
                      className="w-32 h-8 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Airdrop Amount</Label>
                    <Input
                      type="number"
                      defaultValue="200"
                      className="w-32 h-8 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Token</Label>
                    <Select defaultValue="qubic">
                      <SelectTrigger className="w-32 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="qubic">QUBIC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-1 pt-2">
                  <Badge variant="outline" className="text-xs">
                    X
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Loyal Holder Bonus */}
            <Card className="gradient-card border-border hover:border-primary/30 transition-smooth">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">Loyal Holder Bonus</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      If a wallet holds QUBIC for more than N days and crosses volume
                      threshold, send a reward.
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Holding Period (days)</Label>
                    <Input
                      type="number"
                      defaultValue="30"
                      className="w-24 h-8 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Volume Threshold</Label>
                    <Input
                      type="number"
                      defaultValue="5000"
                      className="w-32 h-8 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Airdrop Amount</Label>
                    <Input
                      type="number"
                      defaultValue="500"
                      className="w-32 h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-1 pt-2">
                  <Badge variant="outline" className="text-xs">
                    Telegram
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Discord
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    X
                  </Badge>
                </div>
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
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">When</span>
                  <Select defaultValue="buy">
                    <SelectTrigger className="w-36 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="contract">Contract Call</SelectItem>
                    </SelectContent>
                  </Select>

                  <span className="text-muted-foreground">on</span>
                  <Select defaultValue="qubic">
                    <SelectTrigger className="w-24 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qubic">QUBIC</SelectItem>
                    </SelectContent>
                  </Select>

                  <span className="text-muted-foreground">where amount</span>
                  <Select defaultValue="greater">
                    <SelectTrigger className="w-20 h-9">
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
                    className="w-28 h-9"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">then</span>
                  <Select defaultValue="airdrop">
                    <SelectTrigger className="w-36 h-9">
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
                    className="w-28 h-9"
                  />

                  <Select defaultValue="qubic">
                    <SelectTrigger className="w-24 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qubic">QUBIC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={handleTestRule}>
                    Test Rule
                  </Button>
                  <Button className="flex-1 bg-primary hover:bg-primary/90">
                    Activate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
