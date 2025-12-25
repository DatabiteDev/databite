"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle, Link, Workflow } from "lucide-react";
import { getStatus } from "@databite/connect";

export function AnalyticsOverview() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const { data: status } = useQuery({
    queryKey: ["status"],
    queryFn: () => getStatus(apiUrl),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const stats = status?.stats || {
    connectors: 0,
    integrations: 0,
    connections: 0,
    scheduledJobs: 0,
  };

  const overviewCards = [
    {
      title: "Total Connectors",
      value: stats.connectors.toLocaleString(),
      description: "Available connectors",
      icon: Activity,
      trend: "System wide",
      trendPositive: true,
    },
    {
      title: "Integrations",
      value: stats.integrations.toLocaleString(),
      description: "Configured integrations",
      icon: Workflow,
      trend: "Ready to use",
      trendPositive: true,
    },
    {
      title: "Connections",
      value: stats.connections.toLocaleString(),
      description: "Active connections",
      icon: Link,
      trend: "Connected services",
      trendPositive: true,
    },
    {
      title: "Scheduled Jobs",
      value: stats.scheduledJobs.toLocaleString(),
      description: "Running sync jobs",
      icon: CheckCircle,
      trend: stats.scheduledJobs > 0 ? "Active" : "None scheduled",
      trendPositive: stats.scheduledJobs > 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewCards.map((card, index) => (
          <Card className="bg-background rounded-sm" key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mb-1">
                {card.description}
              </p>
              <div className="flex items-center space-x-1">
                <Badge
                  variant={card.trendPositive ? "outline" : "secondary"}
                  className="text-xs rounded-sm px-3 py-1"
                >
                  {card.trend}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
