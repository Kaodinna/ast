import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  BookOpenIcon,
  AwardIcon,
  BarChart3Icon,
  ClockIcon,
  CheckCircle2,
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
    provider: string;
  };
  createdAt: Date;
  isQualified?: boolean;
  inInterviewQueue?: boolean;
  queuePosition?: number | null;
  qualificationDate?: Date | null;
  joinedQueueAt?: Date | null;
}

const ApplicantDashboard = () => {
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

  // Track if the component is mounted to prevent state updates after unmounting
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Fetch opportunities and user applications only once when the component mounts
  useEffect(() => {
    const fetchApplicantData = async () => {
      if (!isMounted) return;
      const token = await getAuthToken();
      if (!token) {
        console.log("No token found, user might not be authenticated");
        return;
      }

      try {
        // Fetch recommended opportunities
        const opportunitiesResponse = await fetch(
          "/api/opportunities?limit=10",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const opportunitiesData = await opportunitiesResponse.json();

        if (opportunitiesData.opportunities && isMounted) {
          setOpportunities(opportunitiesData.opportunities);
        }

        // Fetch user's applications
        const applicationsResponse = await fetch("/api/applications", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const applicationsData = await applicationsResponse.json();

        if (Array.isArray(applicationsData) && isMounted) {
          setApplications(applicationsData);
        }

        if (isMounted) {
          setLastUpdated(new Date().toLocaleTimeString());
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching applicant data:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchApplicantData();

    // Empty dependency array ensures this only runs once when component mounts
  }, []);

  // Calculate upcoming deadlines
  const upcomingDeadlines = opportunities
    .filter((opp) => opp.deadline)
    .sort((a, b) => {
      const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return dateA - dateB;
    })
    .slice(0, 3);

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
  const acceptedApplications = applications.filter(
    (app) => app.status === "accepted"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Applicant Dashboard
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
              Available Opportunities
            </CardTitle>
            <AwardIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : opportunities.length}
            </div>
            <p className="text-xs text-muted-foreground">
              <Link
                href="/dashboard/explore"
                className="text-primary hover:underline"
              >
                Explore opportunities
              </Link>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Your Applications
            </CardTitle>
            <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : applications.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingApplications} pending, {acceptedApplications} accepted
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Profile Completion
            </CardTitle>
            <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user ? "50%" : "0%"}</div>
            <Progress value={user ? 50 : 0} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Deadlines
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingDeadlines.length}</div>
            {upcomingDeadlines.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Next: {upcomingDeadlines[0].title.substring(0, 20)}... (
                {daysUntil(upcomingDeadlines[0].deadline)})
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="opportunities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="applications">My Applications</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>
        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading opportunities...</div>
              ) : opportunities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No opportunities available yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {opportunities.slice(0, 5).map((opportunity) => (
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
                  {opportunities.length > 5 && (
                    <div className="text-center pt-2">
                      <Link
                        href="/dashboard/explore"
                        className="text-primary hover:underline"
                      >
                        View all opportunities
                      </Link>
                    </div>
                  )}

                  <div className="mt-4 p-4 border border-primary/20 rounded-lg bg-primary/5">
                    <h4 className="font-medium mb-2 flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                      How to Apply
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      To apply for an opportunity, click on it to view details,
                      then click the "Apply Now" button. You can also explore
                      more opportunities and apply directly from there.
                    </p>
                    <Button asChild>
                      <Link href="/dashboard/explore">
                        Find and Apply for Opportunities
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading applications...</div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    You haven't submitted any applications yet.
                  </p>
                  <p className="mt-2">
                    <Link
                      href="/dashboard/explore"
                      className="text-primary hover:underline"
                    >
                      Explore opportunities
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <Link
                      href={`/dashboard/applications/${application.id}`}
                      key={application.id}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <div>
                          <h3 className="font-medium">
                            {application?.opportunity?.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {application?.opportunity?.provider} • Applied:{" "}
                            {formatDate(application.createdAt)}
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
                          {application?.status?.charAt(0).toUpperCase() +
                            application?.status?.slice(1)}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommended For You</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Complete your profile to get personalized recommendations.
                </p>
                <p className="mt-2">
                  <Link
                    href="/dashboard/profile"
                    className="text-primary hover:underline"
                  >
                    Update your profile
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

export default ApplicantDashboard;
