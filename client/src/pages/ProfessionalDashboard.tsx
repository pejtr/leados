/**
 * Professional Analytics Dashboard
 * KPI metrics, waterfall funnel, date range picker, revenue timeline, traffic sources
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, BarChart, Bar, FunnelChart, Funnel, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, Users, DollarSign, Target, Eye, MousePointer, Download, Calendar,
  ArrowUpRight, ArrowDownRight, Activity,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ProfessionalDashboard() {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");

  // Fetch analytics data
  const analyticsQuery = trpc.analytics.getMetrics.useQuery({ dateRange });

  // Sample data for visualization
  const kpiMetrics = [
    {
      label: "Total Leads Generated",
      value: "2,847",
      change: "+12.5%",
      icon: Users,
      trend: "up",
      color: "text-blue-600",
    },
    {
      label: "Conversion Rate",
      value: "18.3%",
      change: "+2.1%",
      icon: Target,
      trend: "up",
      color: "text-green-600",
    },
    {
      label: "Revenue Generated",
      value: "$47,250",
      change: "+28.4%",
      icon: DollarSign,
      trend: "up",
      color: "text-emerald-600",
    },
    {
      label: "Avg Lead Value",
      value: "$16.60",
      change: "-1.2%",
      icon: TrendingUp,
      trend: "down",
      color: "text-orange-600",
    },
  ];

  // Waterfall funnel data
  const funnelData = [
    { name: "Leads Generated", value: 2847 },
    { name: "Contacted", value: 1923 },
    { name: "Replied", value: 856 },
    { name: "Qualified", value: 521 },
    { name: "Closed Deals", value: 312 },
  ];

  // Revenue timeline data
  const revenueTimeline = [
    { date: "May 1", revenue: 2400, leads: 240 },
    { date: "May 5", revenue: 3210, leads: 321 },
    { date: "May 10", revenue: 2290, leads: 229 },
    { date: "May 15", revenue: 2000, leads: 200 },
    { date: "May 20", revenue: 2181, leads: 218 },
    { date: "May 25", revenue: 2500, leads: 250 },
    { date: "May 30", revenue: 2100, leads: 210 },
  ];

  // Traffic sources data
  const trafficSources = [
    { name: "LinkedIn", value: 1200, percentage: 42 },
    { name: "Email Outreach", value: 850, percentage: 30 },
    { name: "API Integration", value: 450, percentage: 16 },
    { name: "Manual Import", value: 347, percentage: 12 },
  ];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Activity className="w-8 h-8 text-blue-600" />
              Professional Analytics
            </h1>
            <p className="text-muted-foreground mt-1">Campaign performance and ROI metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              {(["7d", "30d", "90d", "1y"] as const).map((range) => (
                <Button
                  key={range}
                  variant={dateRange === range ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setDateRange(range)}
                  className="text-xs"
                >
                  {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : range === "90d" ? "90 Days" : "1 Year"}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiMetrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <Card key={idx} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {metric.label}
                    </CardTitle>
                    <Icon className={`w-5 h-5 ${metric.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">{metric.value}</div>
                    <div className="flex items-center gap-1">
                      {metric.trend === "up" ? (
                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-600" />
                      )}
                      <span className={metric.trend === "up" ? "text-green-600" : "text-red-600"}>
                        {metric.change}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Timeline</CardTitle>
              <CardDescription>Daily revenue and lead generation</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#3b82f6" name="Revenue ($)" />
                  <Line yAxisId="right" type="monotone" dataKey="leads" stroke="#10b981" name="Leads" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Traffic Sources */}
          <Card>
            <CardHeader>
              <CardTitle>Traffic Sources</CardTitle>
              <CardDescription>Lead generation by source</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={trafficSources}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {trafficSources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Waterfall Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>Lead progression through sales pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <FunnelChart>
                <Tooltip />
                <Funnel
                  data={funnelData}
                  dataKey="value"
                  stroke="#8884d8"
                  fill="#8884d8"
                  layout="vertical"
                >
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>

            {/* Funnel Stats */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
              {funnelData.map((stage, idx) => {
                const prevValue = idx === 0 ? funnelData[0].value : funnelData[idx - 1].value;
                const conversionRate = idx === 0 ? 100 : ((stage.value / prevValue) * 100).toFixed(1);

                return (
                  <div key={idx} className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground">{stage.name}</p>
                    <p className="text-xl font-bold mt-1">{stage.value}</p>
                    {idx > 0 && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {conversionRate}%
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
            <CardDescription>Key findings and recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900">
                  ✓ LinkedIn source performing best with 42% of leads
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-900">
                  ✓ Conversion rate improved 2.1% this month
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm font-medium text-amber-900">
                  ⚠ Email outreach reply rate declining - consider A/B testing templates
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm font-medium text-purple-900">
                  💡 API integration showing strong ROI - consider expanding partnerships
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
