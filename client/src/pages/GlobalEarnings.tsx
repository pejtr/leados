import React, { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Calendar, Filter, Download } from "lucide-react";

export function GlobalEarnings() {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // Fetch global earnings data
  const { data: earnings, isLoading } = trpc.globalEarnings.getAnalytics.useQuery(
    { dateRange },
    { enabled: true }
  );

  // Fetch project health
  const { data: health } = trpc.globalEarnings.getHealth.useQuery(
    { dateRange },
    { enabled: true }
  );

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!earnings) return null;

    const totalRevenue = earnings.projects.reduce((sum, p) => sum + p.revenue, 0);
    const totalCost = earnings.projects.reduce((sum, p) => sum + p.cost, 0);
    const totalProfit = totalRevenue - totalCost;
    const avgRoi = earnings.projects.length > 0 
      ? (earnings.projects.reduce((sum, p) => sum + p.roi, 0) / earnings.projects.length)
      : 0;

    return { totalRevenue, totalCost, totalProfit, avgRoi };
  }, [earnings]);

  const revenueTimeline = useMemo(() => {
    if (!earnings?.timeline) return [];
    return earnings.timeline.map((day) => ({
      date: new Date(day.date).toLocaleDateString("cs-CZ", { month: "short", day: "numeric" }),
      revenue: day.revenue,
      cost: day.cost,
      profit: day.revenue - day.cost,
    }));
  }, [earnings]);

  const projectDistribution = useMemo(() => {
    if (!earnings?.projects) return [];
    return earnings.projects.map((p) => ({
      name: p.name,
      value: p.revenue,
      roi: p.roi,
    }));
  }, [earnings]);

  const COLORS = ["#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b"];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-4">
          <div className="h-8 bg-muted rounded animate-pulse w-48" />
          <div className="h-64 bg-muted rounded animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Přehled projektů</h1>
            <p className="text-muted-foreground mt-1">Centrální dashboard všech vašich projektů</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="flex gap-2">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange(range)}
            >
              {range === "7d" ? "7 dní" : range === "30d" ? "30 dní" : "90 dní"}
            </Button>
          ))}
        </div>

        {/* KPI Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Celkový příjem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalRevenue.toLocaleString("cs-CZ", { style: "currency", currency: "CZK" })}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <ArrowUpRight className="w-3 h-3 inline mr-1 text-green-500" />
                  +12.5% vs minulý měsíc
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Náklady</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalCost.toLocaleString("cs-CZ", { style: "currency", currency: "CZK" })}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <ArrowDownRight className="w-3 h-3 inline mr-1 text-red-500" />
                  +5.2% vs minulý měsíc
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Zisk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalProfit.toLocaleString("cs-CZ", { style: "currency", currency: "CZK" })}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <ArrowUpRight className="w-3 h-3 inline mr-1 text-green-500" />
                  +18.3% vs minulý měsíc
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Průměrný ROI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.avgRoi.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1 text-blue-500" />
                  Všechny projekty
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Timeline */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Příjmy a náklady</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => value.toLocaleString("cs-CZ", { style: "currency", currency: "CZK" })} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#06b6d4" name="Příjem" />
                  <Line type="monotone" dataKey="cost" stroke="#ef4444" name="Náklady" />
                  <Line type="monotone" dataKey="profit" stroke="#10b981" name="Zisk" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Project Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuce příjmů</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={projectDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${(value / 1000).toFixed(0)}k`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {projectDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value.toLocaleString("cs-CZ", { style: "currency", currency: "CZK" })} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Projects List */}
        <Card>
          <CardHeader>
            <CardTitle>Projekty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {earnings?.projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedProject(project.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{project.name}</h3>
                      <Badge variant={project.status === "active" ? "default" : "secondary"}>
                        {project.status === "active" ? "Aktivní" : "Neaktivní"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{project.revenue.toLocaleString("cs-CZ", { style: "currency", currency: "CZK" })}</div>
                    <div className={`text-sm ${project.roi >= 0 ? "text-green-600" : "text-red-600"}`}>
                      ROI: {project.roi.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Health Status */}
        {health && (
          <Card>
            <CardHeader>
              <CardTitle>Zdraví projektů</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground">Zdravé projekty</div>
                  <div className="text-2xl font-bold mt-2 text-green-600">{health.healthy}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground">Upozornění</div>
                  <div className="text-2xl font-bold mt-2 text-yellow-600">{health.warning}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground">Kritické</div>
                  <div className="text-2xl font-bold mt-2 text-red-600">{health.critical}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
