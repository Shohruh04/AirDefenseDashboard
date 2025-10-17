import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  AlertTriangle,
  Info,
  Shield,
  Settings,
  Clock,
  MapPin,
  Search,
  Filter,
  Download,
  FileText,
} from "lucide-react";
import { useSimulation } from "../../lib/stores/useSimulation";
import type { Alert } from "../../lib/simulation";
import { exportToCSV, exportAlertsToPDF } from "../../lib/exportUtils";

const AlertsLog: React.FC = () => {
  const { alerts } = useSimulation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<Alert["type"] | "ALL">("ALL");
  const [filterPriority, setFilterPriority] = useState<
    Alert["priority"] | "ALL"
  >("ALL");

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "DETECTION":
        return <Info className="h-4 w-4" />;
      case "THREAT":
        return <AlertTriangle className="h-4 w-4" />;
      case "SYSTEM":
        return <Settings className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: Alert["priority"]) => {
    switch (priority) {
      case "HIGH":
        return "destructive";
      case "MEDIUM":
        return "default";
      case "LOW":
        return "secondary";
      default:
        return "outline";
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch = alert.message
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType = filterType === "ALL" || alert.type === filterType;
    const matchesPriority =
      filterPriority === "ALL" || alert.priority === filterPriority;

    return matchesSearch && matchesType && matchesPriority;
  });

  const alertCounts = {
    total: alerts.length,
    high: alerts.filter((a) => a.priority === "HIGH").length,
    medium: alerts.filter((a) => a.priority === "MEDIUM").length,
    low: alerts.filter((a) => a.priority === "LOW").length,
  };

  const handleExportCSV = () => {
    const exportData = filteredAlerts.map((alert) => ({
      Timestamp: new Date(alert.timestamp).toLocaleString(),
      Type: alert.type,
      Priority: alert.priority,
      Message: alert.message,
      Latitude: alert.position?.lat.toFixed(4) || "N/A",
      Longitude: alert.position?.lng.toFixed(4) || "N/A",
    }));
    exportToCSV(exportData, "air_defense_alerts");
  };

  const handleExportPDF = () => {
    exportAlertsToPDF(filteredAlerts);
  };

  return (
    <div className="w-full h-full p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Alerts & Events Log
            </h2>
            <p className="text-muted-foreground">
              Real-time monitoring of system events and security alerts
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {alertCounts.total}
                </div>
                <p className="text-sm text-muted-foreground">Total Alerts</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {alertCounts.high}
                </div>
                <p className="text-sm text-muted-foreground">High Priority</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {alertCounts.medium}
                </div>
                <p className="text-sm text-muted-foreground">Medium Priority</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {alertCounts.low}
                </div>
                <p className="text-sm text-muted-foreground">Low Priority</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search alerts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Select
                value={filterType}
                onValueChange={(value) =>
                  setFilterType(value as Alert["type"] | "ALL")
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="DETECTION">Detection</SelectItem>
                  <SelectItem value="THREAT">Threat</SelectItem>
                  <SelectItem value="SYSTEM">System</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filterPriority}
                onValueChange={(value) =>
                  setFilterPriority(value as Alert["priority"] | "ALL")
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Priorities</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Alerts List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Alert Log ({filteredAlerts.length}{" "}
              {filteredAlerts.length === 1 ? "alert" : "alerts"})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div
                        className={`p-1.5 rounded-full ${
                          alert.type === "THREAT"
                            ? "bg-red-100 text-red-600"
                            : alert.type === "DETECTION"
                            ? "bg-blue-100 text-blue-600"
                            : alert.type === "SYSTEM"
                            ? "bg-yellow-100 text-yellow-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {getAlertIcon(alert.type)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-medium text-foreground">
                          {alert.message}
                        </p>
                        <Badge
                          variant={getPriorityColor(alert.priority)}
                          className="text-xs shrink-0"
                        >
                          {alert.priority}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>

                        <Badge variant="outline" className="text-xs">
                          {alert.type}
                        </Badge>

                        {alert.position && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {alert.position.lat.toFixed(2)}°,{" "}
                              {alert.position.lng.toFixed(2)}°
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No alerts found matching your criteria</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Educational Disclaimer */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                  Educational Simulation Notice
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  All alerts and events displayed are simulated and generated
                  for educational purposes only. This system does not monitor
                  real aircraft or security threats.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AlertsLog;
