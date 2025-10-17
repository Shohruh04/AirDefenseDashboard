import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Shield,
  Info,
  Code,
  Database,
  Globe,
  Users,
  BookOpen,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";

const About: React.FC = () => {
  return (
    <div className="w-full h-full p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              3D Air Defense Simulation Dashboard
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Educational Computer Science Diploma Project
          </p>
        </div>

        {/* Important Notice */}
        <Card className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-600 mt-1 shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-2">
                  Educational Simulation Notice
                </h3>
                <p className="text-orange-700 dark:text-orange-300 mb-3">
                  <strong>
                    This project is a simulated educational dashboard.
                  </strong>{" "}
                  All visuals, data, and functionality are artificially
                  generated and do not represent real air defense systems,
                  actual aircraft movements, or government sources.
                </p>
                <p className="text-orange-700 dark:text-orange-300">
                  This simulation is designed purely for educational purposes as
                  part of a Computer Science diploma project and is safe for
                  public presentation and demonstration.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Project Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This educational air defense simulation dashboard was developed as
              a Computer Science diploma project to demonstrate advanced web
              development skills, 3D visualization techniques, and real-time
              data management concepts.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold">Key Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Interactive 2D map with Leaflet.js</li>
                  <li>• Immersive 3D simulation with Three.js</li>
                  <li>• Real-time analytics and charting</li>
                  <li>• Responsive dashboard interface</li>
                  <li>• Simulated radar and aircraft tracking</li>
                  <li>• Alert system with event logging</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Learning Objectives</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Advanced React.js development</li>
                  <li>• 3D graphics and WebGL concepts</li>
                  <li>• Real-time data visualization</li>
                  <li>• State management patterns</li>
                  <li>• User interface design principles</li>
                  <li>• Performance optimization techniques</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technology Stack */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Technology Stack
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Frontend
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">React.js</Badge>
                  <Badge variant="secondary">TypeScript</Badge>
                  <Badge variant="secondary">Vite</Badge>
                  <Badge variant="secondary">Tailwind CSS</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Visualization
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Three.js</Badge>
                  <Badge variant="secondary">Leaflet.js</Badge>
                  <Badge variant="secondary">Chart.js</Badge>
                  <Badge variant="secondary">React Three Fiber</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  State & Utils
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Zustand</Badge>
                  <Badge variant="secondary">React Router</Badge>
                  <Badge variant="secondary">Lucide Icons</Badge>
                  <Badge variant="secondary">Radix UI</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Detail */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Feature Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold">2D Map View</h4>
                  <p className="text-sm text-muted-foreground">
                    Interactive map showing radar coverage zones and simulated
                    aircraft positions with real-time updates and detailed
                    tooltips.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">3D Simulation</h4>
                  <p className="text-sm text-muted-foreground">
                    Immersive 3D environment with moving aircraft models,
                    animated radar sweep, and day/night lighting modes with
                    orbital camera controls.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Analytics Dashboard</h4>
                  <p className="text-sm text-muted-foreground">
                    Interactive charts displaying aircraft detection rates,
                    altitude distribution, and system performance metrics over
                    time.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Alert System</h4>
                  <p className="text-sm text-muted-foreground">
                    Real-time alert logging with filtering and search
                    capabilities, categorized by type and priority levels.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Sources */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Data Generation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                All data displayed in this simulation is completely artificial
                and generated using algorithmic methods. No real aircraft data,
                government sources, or actual air defense information is used in
                any form.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Simulated Data Types</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Random aircraft positions and trajectories</li>
                    <li>• Generated speed and altitude values</li>
                    <li>• Artificial alert events and notifications</li>
                    <li>• Synthetic system performance metrics</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Generation Methods</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Mathematical random number generation</li>
                    <li>• Predefined parameter ranges</li>
                    <li>• Time-based simulation updates</li>
                    <li>• Realistic movement interpolation</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Educational Use */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Educational Purpose</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This project serves as a comprehensive demonstration of modern web
              development techniques and is intended for educational evaluation
              and learning purposes only. It showcases:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Complex React.js application architecture</li>
                <li>• Advanced 3D graphics programming with WebGL</li>
                <li>• Real-time data visualization techniques</li>
                <li>• Responsive user interface design</li>
              </ul>

              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• State management best practices</li>
                <li>• Performance optimization strategies</li>
                <li>• Modern TypeScript development</li>
                <li>• Component-based architecture</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Developed as a Computer Science Diploma Project • Educational Use
              Only
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              All data is simulated • No real defense systems represented
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;
