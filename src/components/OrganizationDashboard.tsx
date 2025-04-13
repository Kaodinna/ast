import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarIcon,
  BookOpenIcon,
  AwardIcon,
  BarChart3Icon,
  ClockIcon,
  Users,
  FileCheck,
  UserCheck,
  UserX,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

// Type definitions for our data
interface Opportunity {
  id: string;
  title: string;
  provider: string;
  type: string;
  deadline?: Date | null;
}

interface Application {
  id: string;
  status: string;
  opportunityId: string;
  opportunity: {
    title: string;
  };
  createdAt: Date;
}

const OrganizationDashboard = () => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("Loading...");
  const getAuthToken = async () => {
    if (user) {
      try {
        const token = await user.getIdToken();
        return token;
      } catch (error) {
        console.error("Error getting token", error);
        return null;
      }
    }
    return null;
  };
  // Fetch opportunities created by this organization
  useEffect(() => {
    const fetchOrganizationData = async () => {
      const token = await getAuthToken();
      if (!token) {
        console.log("No token found, user might not be authenticated");
        return;
      }
      try {
        // Fetch opportunities created by this organization
        const opportunitiesResponse = await fetch(
          "/api/opportunities?creator=true",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const opportunitiesData = await opportunitiesResponse.json();

        if (
          opportunitiesData.opportunities &&
          Array.isArray(opportunitiesData.opportunities)
        ) {
          setOpportunities(opportunitiesData.opportunities);
          console.log(
            "Fetched opportunities:",
            opportunitiesData.opportunities
          );
        } else {
          console.error(
            "Invalid opportunities data format:",
            opportunitiesData
          );
          setOpportunities([]);
        }

        // Fetch applications for this organization's opportunities
        const applicationsResponse = await fetch("/api/applications", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const applicationsData = await applicationsResponse.json();

        if (
          applicationsData.applications &&
          Array.isArray(applicationsData.applications)
        ) {
          setApplications(applicationsData.applications);
          console.log("Fetched applications:", applicationsData.applications);
        } else if (Array.isArray(applicationsData)) {
          setApplications(applicationsData);
          console.log("Fetched applications:", applicationsData);
        } else {
          console.error("Invalid applications data format:", applicationsData);
          setApplications([]);
        }

        setLastUpdated(new Date().toLocaleTimeString());
      } catch (error) {
        console.error("Error fetching organization data:", error);
        setOpportunities([]);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationData();
  }, []);

  // Format date for display
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "No deadline";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate days until deadline
  const daysUntil = (date: Date | string | null | undefined) => {
    if (!date) return "";
    const now = new Date();
    const deadlineDate = new Date(date);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 0 ? "Today" : `${diffDays} days`;
  };

  // Count applications by status
  const pendingApplications = applications.filter(
    (app) => app.status === "pending"
  ).length;
  const reviewingApplications = applications.filter(
    (app) => app.status === "reviewing"
  ).length;
  const acceptedApplications = applications.filter(
    (app) => app.status === "accepted"
  ).length;
  const rejectedApplications = applications.filter(
    (app) => app.status === "rejected"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Organization Dashboard
        </h1>
        <Badge variant="outline" className="bg-primary/10 text-primary">
          <ClockIcon className="mr-1 h-3 w-3" />
          Last updated: {lastUpdated}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Your Opportunities
            </CardTitle>
            <AwardIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : opportunities.length}
            </div>
            <p className="text-xs text-muted-foreground">
              <Link
                href="/dashboard/create-opportunity"
                className="text-primary hover:underline"
              >
                Create new opportunity
              </Link>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Received Applications
            </CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : applications.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingApplications} pending, {reviewingApplications} reviewing
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Accepted Applicants
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : acceptedApplications}
            </div>
            <Progress
              value={
                applications.length > 0
                  ? (acceptedApplications / applications.length) * 100
                  : 0
              }
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rejected Applicants
            </CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : rejectedApplications}
            </div>
            <Progress
              value={
                applications.length > 0
                  ? (rejectedApplications / applications.length) * 100
                  : 0
              }
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="applications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="applications">Received Applications</TabsTrigger>
          <TabsTrigger value="opportunities">Your Opportunities</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <CardTitle>Application Management</CardTitle>
              <Link href="/dashboard/applications">
                <Badge className="cursor-pointer hover:bg-primary/90">
                  View All
                </Badge>
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading applications...</div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No applications received yet.
                  </p>
                  <p className="mt-2">
                    <Link
                      href="/dashboard/opportunities"
                      className="text-primary hover:underline"
                    >
                      View your opportunities
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.slice(0, 5).map((application) => (
                    <Link
                      href={`/dashboard/opportunities/applications/${application.id}`}
                      key={application.id}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <div>
                          <h3 className="font-medium">
                            {application.opportunity.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Received: {formatDate(application.createdAt)}
                          </p>
                        </div>
                        <Badge
                          variant={
                            application.status === "accepted"
                              ? "default"
                              : application.status === "rejected"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {application.status.charAt(0).toUpperCase() +
                            application.status.slice(1)}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                  {applications.length > 5 && (
                    <div className="text-center pt-2">
                      <Link
                        href="/dashboard/applications"
                        className="text-primary hover:underline"
                      >
                        View all applications
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <CardTitle>Your Opportunities</CardTitle>
              <Link href="/dashboard/create-opportunity">
                <Badge className="cursor-pointer hover:bg-primary/90">
                  Create New
                </Badge>
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading opportunities...</div>
              ) : opportunities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    You haven't created any opportunities yet.
                  </p>
                  <p className="mt-2">
                    <Link
                      href="/dashboard/create-opportunity"
                      className="text-primary hover:underline"
                    >
                      Create your first opportunity
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {opportunities.map((opportunity) => (
                    <Link
                      href={`/dashboard/opportunities/${opportunity.id}`}
                      key={opportunity.id}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <div>
                          <h3 className="font-medium">{opportunity.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {opportunity.provider}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {opportunity.deadline && (
                            <div className="text-sm text-right">
                              <div className="text-muted-foreground">
                                Deadline
                              </div>
                              <div>{formatDate(opportunity.deadline)}</div>
                            </div>
                          )}
                          <Badge variant="outline">{opportunity.type}</Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Analytics will be available soon.
                </p>
                <p className="mt-2">
                  <Link
                    href="/dashboard/opportunities"
                    className="text-primary hover:underline"
                  >
                    View your opportunities
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrganizationDashboard;
