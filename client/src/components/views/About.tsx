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
  Brain,
} from "lucide-react";

const About: React.FC = () => {
  return (
    <div className="w-full h-full p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-8 w-8 text-purple-500" />
            <h1 className="text-3xl font-bold text-foreground">
              AI-Powered Air Defense Simulation
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            AI-Driven Educational Computer Science Diploma Project
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
                    This project is an AI-powered simulated educational dashboard.
                  </strong>{" "}
                  The AI classification system uses deterministic weighted
                  algorithms to simulate intelligent threat assessment. All
                  visuals, data, and functionality are artificially generated
                  and do not represent real air defense systems, actual aircraft
                  movements, or government sources.
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
              This AI-powered air defense simulation dashboard was developed as
              a Computer Science diploma project to demonstrate advanced web
              development, AI-driven threat classification, 3D visualization,
              and real-time intelligent data processing concepts.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold">Key Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• AI-powered multi-factor threat classification</li>
                  <li>• Predictive flight path analysis with anomaly detection</li>
                  <li>• AI engagement priority queue for missile targeting</li>
                  <li>• Immersive 3D simulation with Three.js</li>
                  <li>• Interactive 2D map with Leaflet.js</li>
                  <li>• Real-time AI analytics and confidence metrics</li>
                  <li>• IFF (Identify Friend or Foe) transponder simulation</li>
                  <li>• Smart contextual alert system</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Learning Objectives</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• AI classification and decision-making algorithms</li>
                  <li>• Predictive modeling and anomaly detection</li>
                  <li>• Advanced React.js development</li>
                  <li>• 3D graphics and WebGL concepts</li>
                  <li>• Real-time data visualization</li>
                  <li>• State management patterns</li>
                  <li>• Weighted scoring and priority systems</li>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  <Badge variant="secondary">Recharts</Badge>
                  <Badge variant="secondary">React Three Fiber</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI & Analysis
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Weighted Classification</Badge>
                  <Badge variant="secondary">Anomaly Detection</Badge>
                  <Badge variant="secondary">Predictive Modeling</Badge>
                  <Badge variant="secondary">Priority Scoring</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  State & Utils
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Zustand</Badge>
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
                  <h4 className="font-semibold">AI Threat Classification</h4>
                  <p className="text-sm text-muted-foreground">
                    Multi-factor weighted scoring engine analyzes 7 risk
                    factors per aircraft — type, IFF response, proximity,
                    heading, speed anomaly, altitude anomaly, and flight
                    pattern stability — to produce real-time threat assessments.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Predictive Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    AI predicts future flight paths with growing uncertainty
                    cones and detects anomalies when aircraft deviate from
                    predicted trajectories, triggering automatic threat
                    escalation.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">3D & 2D Visualization</h4>
                  <p className="text-sm text-muted-foreground">
                    Immersive 3D environment and interactive 2D map with AI
                    reasoning panels, prediction lines, confidence indicators,
                    and engagement priority queue overlays.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Smart Alert System</h4>
                  <p className="text-sm text-muted-foreground">
                    AI-generated contextual alerts referencing actual aircraft
                    states — threat reclassifications, anomaly detections,
                    proximity warnings, and IFF failures.
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
                All data displayed in this simulation is generated using AI
                classification algorithms and simulated sensor inputs. No real
                aircraft data, government sources, or actual air defense
                information is used in any form.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">AI-Processed Data Types</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• AI-classified aircraft threat assessments</li>
                    <li>• Predicted flight trajectories with uncertainty</li>
                    <li>• Anomaly detection scores and alerts</li>
                    <li>• AI confidence metrics and risk factors</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">AI Algorithms</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Multi-factor weighted threat scoring</li>
                    <li>• Linear predictive path modeling</li>
                    <li>• Deviation-based anomaly detection</li>
                    <li>• Priority-ranked engagement queuing</li>
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
              This project serves as a comprehensive demonstration of AI-driven
              simulation, modern web development, and intelligent decision-making
              systems. It is intended for educational evaluation and learning
              purposes only. It showcases:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• AI classification and threat assessment algorithms</li>
                <li>• Predictive modeling with anomaly detection</li>
                <li>• Advanced 3D graphics programming with WebGL</li>
                <li>• Real-time AI-driven data visualization</li>
              </ul>

              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Weighted scoring and decision systems</li>
                <li>• Intelligent engagement prioritization</li>
                <li>• Modern TypeScript development</li>
                <li>• Complex React.js application architecture</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              AI-Powered Air Defense Simulation • Computer Science Diploma
              Project • Educational Use Only
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              AI classification uses weighted algorithms • All data is simulated
              • No real defense systems represented
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;
