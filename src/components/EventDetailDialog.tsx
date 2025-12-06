import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { QubicEvent } from "@/data/events";
import { ArrowUpRight, ArrowDownRight, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface EventDetailDialogProps {
  event: QubicEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getEventBadgeVariant(type: string) {
  switch (type) {
    case "Buy":
      return "default";
    case "Sell":
      return "destructive";
    case "Transfer":
      return "secondary";
    case "Contract Call":
      return "outline";
    default:
      return "secondary";
  }
}

export function EventDetailDialog({ event, open, onOpenChange }: EventDetailDialogProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  if (!event) return null;

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: "Copied to clipboard",
      description: `${field} address copied`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Badge variant={getEventBadgeVariant(event.type)} className="text-sm">
              {event.type}
            </Badge>
            <span className="text-muted-foreground font-normal">Event Details</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Token & Amount */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span className="font-mono font-bold text-lg text-primary">{event.amount}</span>
          </div>

          {/* From Address */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">From</span>
              <button
                onClick={() => copyToClipboard(event.from, "From")}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {copiedField === "From" ? (
                  <Check className="w-3 h-3 text-success" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                Copy
              </button>
            </div>
            <div className="p-3 rounded-lg bg-background/50 border border-border">
              <p className="font-mono text-sm break-all text-foreground">{event.from}</p>
            </div>
          </div>

          {/* Direction Indicator */}
          <div className="flex justify-center">
            {event.type === "Buy" ? (
              <ArrowUpRight className="w-6 h-6 text-success" />
            ) : (
              <ArrowDownRight className="w-6 h-6 text-muted-foreground" />
            )}
          </div>

          {/* To Address */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">To</span>
              <button
                onClick={() => copyToClipboard(event.to, "To")}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {copiedField === "To" ? (
                  <Check className="w-3 h-3 text-success" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                Copy
              </button>
            </div>
            <div className="p-3 rounded-lg bg-background/50 border border-border">
              <p className="font-mono text-sm break-all text-foreground">{event.to}</p>
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Token</span>
              <p className="font-mono text-sm">{event.token}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Tick No</span>
              <Badge variant="outline" className="border-primary/30 text-primary">
                {event.tickNo}
              </Badge>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Time</span>
              <p className="text-sm">{event.time}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Timestamp</span>
              <p className="text-sm text-muted-foreground">{event.timestamp}</p>
            </div>
          </div>

          {/* Label */}
          {event.label && (
            <div className="pt-2">
              <Badge variant="outline" className="border-primary/30 text-primary">
                {event.label}
              </Badge>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
