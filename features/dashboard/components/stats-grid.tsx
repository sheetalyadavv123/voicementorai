"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/features/dashboard/hooks/use-dashboard-stats";

const CARD_ANIMATION = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

export function StatsGrid() {
  const { data, isLoading } = useDashboardStats();

  const stats = [
    { label: "Conversations", value: data?.total_conversations },
    { label: "Messages", value: data?.total_messages },
    { label: "Notes uploaded", value: data?.total_documents },
    {
      label: "Tokens used",
      value:
        data !== undefined
          ? (data.total_input_tokens + data.total_output_tokens).toLocaleString()
          : undefined,
    },
    {
      label: "Estimated cost",
      value: data !== undefined ? `$${data.estimated_cost_usd.toFixed(4)}` : undefined,
    },
    {
      label: "Avg. response time",
      value: data?.avg_latency_ms != null ? `${Math.round(data.avg_latency_ms)}ms` : "—",
    },
    { label: "AI provider", value: data?.ai_provider },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          {...CARD_ANIMATION}
          transition={{ duration: 0.3, delay: index * 0.04 }}
        >
          <Card className="border-border/60 bg-card/70 backdrop-blur">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-normal text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading || stat.value === undefined ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <p
                  title={String(stat.value)}
                  className="truncate text-2xl font-semibold tabular-nums"
                >
                  {stat.value}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
