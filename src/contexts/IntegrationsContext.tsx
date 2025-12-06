import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface TelegramCredentials {
  telegramToken: string;
  telegramChatId: string;
  channelName?: string;
}

export interface DiscordCredentials {
  discordWebhookUrl: string;
  channelName?: string;
}

export interface XCredentials {
  xApiKey: string;
  xApiSecret: string;
  xAccessToken: string;
  xAccessSecret: string;
  channelName?: string;
}

export interface IntegrationStatus {
  telegram: boolean;
  discord: boolean;
  x: boolean;
}

export interface RecentNotification {
  id: string;
  type: "alert" | "airdrop";
  title: string;
  message: string;
  channels: string[];
  timestamp: string;
  success: boolean;
}

interface IntegrationsContextType {
  telegramCredentials: TelegramCredentials | null;
  discordCredentials: DiscordCredentials | null;
  xCredentials: XCredentials | null;
  n8nWebhookUrl: string;
  integrationStatus: IntegrationStatus;
  recentAlerts: RecentNotification[];
  recentAirdrops: RecentNotification[];
  setTelegramCredentials: (creds: TelegramCredentials | null) => void;
  setDiscordCredentials: (creds: DiscordCredentials | null) => void;
  setXCredentials: (creds: XCredentials | null) => void;
  setN8nWebhookUrl: (url: string) => void;
  testTelegramConnection: (creds: TelegramCredentials) => Promise<boolean>;
  testDiscordConnection: (creds: DiscordCredentials) => Promise<boolean>;
  testXConnection: (creds: XCredentials) => Promise<boolean>;
  sendNotification: (
    type: "alert" | "airdrop",
    title: string,
    message: string,
    channels: ("telegram" | "discord" | "x")[]
  ) => Promise<boolean>;
  addRecentNotification: (notification: RecentNotification) => void;
}

const IntegrationsContext = createContext<IntegrationsContextType | undefined>(undefined);

export function IntegrationsProvider({ children }: { children: ReactNode }) {
  const [telegramCredentials, setTelegramCredentialsState] = useState<TelegramCredentials | null>(() => {
    const stored = localStorage.getItem("telegramCredentials");
    return stored ? JSON.parse(stored) : null;
  });

  const [discordCredentials, setDiscordCredentialsState] = useState<DiscordCredentials | null>(() => {
    const stored = localStorage.getItem("discordCredentials");
    return stored ? JSON.parse(stored) : null;
  });

  const [xCredentials, setXCredentialsState] = useState<XCredentials | null>(() => {
    const stored = localStorage.getItem("xCredentials");
    return stored ? JSON.parse(stored) : null;
  });

  const [n8nWebhookUrl, setN8nWebhookUrlState] = useState<string>(() => {
    return localStorage.getItem("n8nWebhookUrl") || "";
  });

  const [recentAlerts, setRecentAlerts] = useState<RecentNotification[]>(() => {
    const stored = localStorage.getItem("recentAlerts");
    return stored ? JSON.parse(stored) : [];
  });

  const [recentAirdrops, setRecentAirdrops] = useState<RecentNotification[]>(() => {
    const stored = localStorage.getItem("recentAirdrops");
    return stored ? JSON.parse(stored) : [];
  });

  const integrationStatus: IntegrationStatus = {
    telegram: !!telegramCredentials?.telegramToken && !!telegramCredentials?.telegramChatId,
    discord: !!discordCredentials?.discordWebhookUrl,
    x: !!xCredentials?.xApiKey && !!xCredentials?.xApiSecret && !!xCredentials?.xAccessToken && !!xCredentials?.xAccessSecret,
  };

  const setTelegramCredentials = (creds: TelegramCredentials | null) => {
    setTelegramCredentialsState(creds);
    if (creds) {
      localStorage.setItem("telegramCredentials", JSON.stringify(creds));
    } else {
      localStorage.removeItem("telegramCredentials");
    }
  };

  const setDiscordCredentials = (creds: DiscordCredentials | null) => {
    setDiscordCredentialsState(creds);
    if (creds) {
      localStorage.setItem("discordCredentials", JSON.stringify(creds));
    } else {
      localStorage.removeItem("discordCredentials");
    }
  };

  const setXCredentials = (creds: XCredentials | null) => {
    setXCredentialsState(creds);
    if (creds) {
      localStorage.setItem("xCredentials", JSON.stringify(creds));
    } else {
      localStorage.removeItem("xCredentials");
    }
  };

  const setN8nWebhookUrl = (url: string) => {
    setN8nWebhookUrlState(url);
    localStorage.setItem("n8nWebhookUrl", url);
  };

  const addRecentNotification = (notification: RecentNotification) => {
    if (notification.type === "alert") {
      const updated = [notification, ...recentAlerts].slice(0, 20);
      setRecentAlerts(updated);
      localStorage.setItem("recentAlerts", JSON.stringify(updated));
    } else {
      const updated = [notification, ...recentAirdrops].slice(0, 20);
      setRecentAirdrops(updated);
      localStorage.setItem("recentAirdrops", JSON.stringify(updated));
    }
  };

  // Test Discord by sending a test message directly to webhook
  const testDiscordConnection = async (creds: DiscordCredentials): Promise<boolean> => {
    try {
      const response = await fetch(creds.discordWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "🔔 **QX Dashboard Test** - Connection successful!",
          username: "QX Dashboard",
        }),
      });
      return response.ok;
    } catch (error) {
      console.error("Discord test failed:", error);
      return false;
    }
  };

  // Test Telegram/X by sending via n8n webhook
  const testTelegramConnection = async (creds: TelegramCredentials): Promise<boolean> => {
    if (!n8nWebhookUrl) {
      toast({
        title: "Configuration Required",
        description: "Please set your n8n webhook URL in Settings first.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const response = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "no-cors",
        body: JSON.stringify({
          source: "telegram",
          title: "Test Connection",
          credentials: {
            telegramToken: creds.telegramToken,
            telegramChatId: creds.telegramChatId,
          },
          message: "🔔 QX Dashboard Test - Connection successful!",
        }),
      });
      return true; // With no-cors we can't check response, assume success
    } catch (error) {
      console.error("Telegram test failed:", error);
      return false;
    }
  };

  const testXConnection = async (creds: XCredentials): Promise<boolean> => {
    if (!n8nWebhookUrl) {
      toast({
        title: "Configuration Required",
        description: "Please set your n8n webhook URL in Settings first.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const response = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "no-cors",
        body: JSON.stringify({
          source: "x",
          title: "Test Connection",
          credentials: {
            xApiKey: creds.xApiKey,
            xApiSecret: creds.xApiSecret,
            xAccessToken: creds.xAccessToken,
            xAccessSecret: creds.xAccessSecret,
          },
          message: "🔔 QX Dashboard Test - Connection successful!",
        }),
      });
      return true;
    } catch (error) {
      console.error("X test failed:", error);
      return false;
    }
  };

  const sendNotification = async (
    type: "alert" | "airdrop",
    title: string,
    message: string,
    channels: ("telegram" | "discord" | "x")[]
  ): Promise<boolean> => {
    if (!n8nWebhookUrl) {
      toast({
        title: "Configuration Required",
        description: "Please set your n8n webhook URL in Settings first.",
        variant: "destructive",
      });
      return false;
    }

    const payloads: any[] = [];

    channels.forEach((channel) => {
      if (channel === "telegram" && telegramCredentials) {
        payloads.push({
          source: "telegram",
          title,
          credentials: {
            telegramToken: telegramCredentials.telegramToken,
            telegramChatId: telegramCredentials.telegramChatId,
          },
          message,
        });
      }
      if (channel === "discord" && discordCredentials) {
        payloads.push({
          source: "discord",
          title,
          credentials: {
            discordWebhookUrl: discordCredentials.discordWebhookUrl,
          },
          message,
        });
      }
      if (channel === "x" && xCredentials) {
        payloads.push({
          source: "x",
          title,
          credentials: {
            xApiKey: xCredentials.xApiKey,
            xApiSecret: xCredentials.xApiSecret,
            xAccessToken: xCredentials.xAccessToken,
            xAccessSecret: xCredentials.xAccessSecret,
          },
          message,
        });
      }
    });

    if (payloads.length === 0) {
      toast({
        title: "No Channels Selected",
        description: "Please select at least one connected channel.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const body = payloads.length === 1 ? payloads[0] : payloads;
      
      await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "no-cors",
        body: JSON.stringify(body),
      });

      // Add to recent notifications
      const notification: RecentNotification = {
        id: crypto.randomUUID(),
        type,
        title,
        message,
        channels: channels.map((c) => c.charAt(0).toUpperCase() + c.slice(1)),
        timestamp: new Date().toISOString(),
        success: true,
      };
      addRecentNotification(notification);

      return true;
    } catch (error) {
      console.error("Send notification failed:", error);
      return false;
    }
  };

  return (
    <IntegrationsContext.Provider
      value={{
        telegramCredentials,
        discordCredentials,
        xCredentials,
        n8nWebhookUrl,
        integrationStatus,
        recentAlerts,
        recentAirdrops,
        setTelegramCredentials,
        setDiscordCredentials,
        setXCredentials,
        setN8nWebhookUrl,
        testTelegramConnection,
        testDiscordConnection,
        testXConnection,
        sendNotification,
        addRecentNotification,
      }}
    >
      {children}
    </IntegrationsContext.Provider>
  );
}

export function useIntegrations() {
  const context = useContext(IntegrationsContext);
  if (context === undefined) {
    throw new Error("useIntegrations must be used within an IntegrationsProvider");
  }
  return context;
}
