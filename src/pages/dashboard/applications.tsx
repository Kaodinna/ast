import React, { useEffect, useState, useCallback, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { format } from "date-fns";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  FileText,
  ExternalLink,
  Calendar,
  Video,
  User,
  Mail,
  Search,
  Filter,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import DashboardSidebar from "@/components/DashboardSidebar";
import ChatInterface from "@/components/ChatInterface";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { getAuth } from "firebase/auth";

type Application = {
  id: string;
  status: string;
  currentStage: string | null;
  notes: string | null;
  feedback: string | null;
  documents: any | null;
  createdAt: string;
  updatedAt: string;
  opportunityId: string;
  applicantId: string;
  isQualified: boolean;
  inInterviewQueue: boolean;
  queuePosition: number | null;
  qualificationDate: string | null;
  joinedQueueAt: string | null;
  opportunity: {
    id: string;
    title: string;
    provider: string;
    type: string;
    deadline: string | null;
    applicationStages: string[];
  };
};

// Define types for applicant data
type Applicant = {
  id: string;
  email: string;
  createdAt: string;
  kycVerified: boolean;
  kycSubmitted: boolean;
  organizationName: string | null;
  organizationRole: string | null;
  organizationType: string | null;
  role: string;
  activeRole: string;
};

type ApplicantWithApplications = {
  applicant: Applicant;
  applications: Application[];
};

function ApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicants, setApplicants] = useState<
    Map<string, ApplicantWithApplications>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [expandedApplicationId, setExpandedApplicationId] = useState<
    string | null
  >(null);
  const [expandedApplicantId, setExpandedApplicantId] = useState<string | null>(
    null
  );
  const [updatingApplication, setUpdatingApplication] = useState<string | null>(
    null
  );
  const [feedback, setFeedback] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use refs to track if data has been fetched and if filter has changed
  const dataFetchedRef = useRef(false);
  const previousFilterRef = useRef(filter);

  // Track if the component is mounted to prevent state updates after unmounting
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
      // Reset the data fetched flag when component unmounts
      dataFetchedRef.current = false;
    };
  }, []);
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
  // Memoize the fetchApplications function to prevent unnecessary re-renders
  const fetchApplications = useCallback(
    async (forceRefresh = false) => {
      // Skip fetching if component is not mounted
      if (!isMounted) return;
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const token = await currentUser.getIdToken().catch((err) => {
        console.error("Error getting token:", err);
        return null;
      });

      if (!token) return;

      // Skip fetching if data has already been fetched and this is not a forced refresh
      if (
        dataFetchedRef.current &&
        !forceRefresh &&
        filter === previousFilterRef.current
      )
        return;

      setLoading(true);
      if (forceRefresh) {
        setIsRefreshing(true);
      }
      // const token = await getAuthToken();

      try {
        // Fetch all applications for the organization
        const response = await fetch(`/api/applications`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          // Add cache control to prevent browser caching
          cache: "no-store",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("API error response:", errorData);
          throw new Error(errorData.message || "Failed to fetch applications");
        }

        const data = await response.json();

        // Only update state if component is still mounted
        if (isMounted) {
          // Filter applications based on status if filter is not 'all'
          const filteredApplications =
            filter === "all"
              ? data
              : data.filter((app: Application) => app.status === filter);

          setApplications(filteredApplications);

          // Group applications by applicant ID
          const applicantIds = new Set<string>();
          filteredApplications.forEach((app: Application) => {
            applicantIds.add(app.applicantId);
          });

          // Create a map to store applicant data with their applications
          const applicantsMap = new Map<string, ApplicantWithApplications>();

          // Fetch details for each applicant
          for (const applicantId of Array.from(applicantIds)) {
            try {
              const applicantResponse = await fetch(
                `/api/applications/applicant-details?applicantId=${applicantId}`,
                {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  credentials: "include",
                  // Add cache control to prevent browser caching
                  cache: "no-store",
                }
              );

              if (applicantResponse.ok) {
                const applicantData = await applicantResponse.json();
                applicantsMap.set(applicantId, applicantData);
              }
            } catch (applicantError) {
              console.error(
                `Error fetching details for applicant ${applicantId}:`,
                applicantError
              );
            }
          }

          setApplicants(applicantsMap);

          // Mark data as fetched and store current filter
          dataFetchedRef.current = true;
          previousFilterRef.current = filter;
        }
      } catch (error) {
        console.error("Error fetching applications:", error);
        if (isMounted) {
          toast({
            title: "Error",
            description:
              error instanceof Error
                ? error.message
                : "Failed to load applications",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [isMounted, filter]
  );

  // Effect to fetch data when component mounts or filter changes
  useEffect(() => {
    if (user) {
      // If filter changes, we need to refetch data
      const filterChanged = filter !== previousFilterRef.current;
      fetchApplications(filterChanged);
    }
  }, [user, filter, fetchApplications]);

  const handleStatusChange = async (applicationId: string, status: string) => {
    setUpdatingApplication(applicationId);
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const token = await currentUser.getIdToken().catch((err) => {
      console.error("Error getting token:", err);
      return null;
    });

    if (!token) return;
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update application status");
      }

      // Update the application in the state
      setApplications(
        applications.map((app) =>
          app.id === applicationId ? { ...app, status } : app
        )
      );

      toast({
        title: "Success",
        description: `Application status updated to ${status}`,
      });
    } catch (error) {
      console.error("Error updating application status:", error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      });
    } finally {
      setUpdatingApplication(null);
    }
  };

  const handleStageChange = async (
    applicationId: string,
    currentStage: string
  ) => {
    setUpdatingApplication(applicationId);
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const token = await currentUser.getIdToken().catch((err) => {
      console.error("Error getting token:", err);
      return null;
    });

    if (!token) return;
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentStage }),
      });

      if (!response.ok) {
        throw new Error("Failed to update application stage");
      }

      // Update the application in the state
      setApplications(
        applications.map((app) =>
          app.id === applicationId ? { ...app, currentStage } : app
        )
      );

      toast({
        title: "Success",
        description: `Application stage updated to ${currentStage}`,
      });
    } catch (error) {
      console.error("Error updating application stage:", error);
      toast({
        title: "Error",
        description: "Failed to update application stage",
        variant: "destructive",
      });
    } finally {
      setUpdatingApplication(null);
    }
  };

  const handleFeedbackSubmit = async (applicationId: string) => {
    if (!feedback.trim()) return;

    setUpdatingApplication(applicationId);
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const token = await currentUser.getIdToken().catch((err) => {
      console.error("Error getting token:", err);
      return null;
    });

    if (!token) return;
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,

          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feedback }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      // Update the application in the state
      setApplications(
        applications.map((app) =>
          app.id === applicationId ? { ...app, feedback } : app
        )
      );

      setFeedback("");
      toast({
        title: "Success",
        description: "Feedback submitted successfully",
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
      });
    } finally {
      setUpdatingApplication(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="flex items-center">
            <Clock className="mr-1 h-3 w-3" /> Pending
          </Badge>
        );
      case "reviewing":
        return (
          <Badge variant="secondary" className="flex items-center">
            <AlertCircle className="mr-1 h-3 w-3" /> Reviewing
          </Badge>
        );
      case "accepted":
        return (
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 flex items-center"
          >
            <CheckCircle2 className="mr-1 h-3 w-3" /> Accepted
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="flex items-center">
            <XCircle className="mr-1 h-3 w-3" /> Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const toggleExpanded = (applicationId: string) => {
    setExpandedApplicationId(
      expandedApplicationId === applicationId ? null : applicationId
    );
    // Reset feedback when collapsing
    if (expandedApplicationId === applicationId) {
      setFeedback("");
    } else {
      // Load existing feedback when expanding
      const application = applications.find((app) => app.id === applicationId);
      setFeedback(application?.feedback || "");
    }
  };

  const getStatusFilterValue = (tabValue: string) => {
    switch (tabValue) {
      case "pending":
        return "pending";
      case "reviewing":
        return "reviewing";
      case "accepted":
        return "accepted";
      case "rejected":
        return "rejected";
      default:
        return "all";
    }
  };

  // Toggle applicant expanded state
  const toggleApplicantExpanded = (applicantId: string) => {
    setExpandedApplicantId(
      expandedApplicantId === applicantId ? null : applicantId
    );
  };

  // Filter applicants based on search term
  const filteredApplicants = () => {
    if (!searchTerm.trim()) {
      return Array.from(applicants.values());
    }

    const term = searchTerm.toLowerCase();
    return Array.from(applicants.values()).filter((data) => {
      const { applicant } = data;
      return (
        applicant.email.toLowerCase().includes(term) ||
        (applicant.organizationName &&
          applicant.organizationName.toLowerCase().includes(term))
      );
    });
  };
  const renderPostedDate = (createdAt: any) => {
    // Check if createdAt has the _seconds property
    if (createdAt && createdAt._seconds) {
      // Convert _seconds to milliseconds and create a Date object
      const date = new Date(createdAt._seconds * 1000);
      return format(date, "MMM d, yyyy");
    }

    // If createdAt is invalid or missing _seconds, return a fallback message
    return "No date";
  };
  return (
    <ProtectedRoute>
      <Head>
        <title>Application Management | Astra</title>
        <meta
          name="description"
          content="Manage applications for your opportunities"
        />
      </Head>

      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            <div className="space-y-6">
              <h1 className="text-2xl font-bold tracking-tight">
                Application Management
              </h1>
              <p className="text-muted-foreground">
                Review and manage applications received for your opportunities
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search applicants by email..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Select defaultValue="all" onValueChange={setFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Applications</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewing">Reviewing</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fetchApplications(true)}
                    disabled={loading || isRefreshing}
                    title="Refresh data"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
                    />
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : applicants.size === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      No applications received yet
                    </p>
                    <Button asChild>
                      <Link href="/dashboard/opportunities">
                        View Your Opportunities
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {filteredApplicants().map(({ applicant, applications }) => (
                    <Card key={applicant.id} className="overflow-hidden">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {applicant.email.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg flex items-center">
                                <Link
                                  href={`/dashboard/applicants/${applicant.id}`}
                                  className="hover:underline"
                                >
                                  {applicant.email}
                                </Link>
                                {applicant.kycVerified && (
                                  <Badge
                                    variant="outline"
                                    className="ml-2 bg-green-100 text-green-800"
                                  >
                                    <CheckCircle2 className="mr-1 h-3 w-3" />{" "}
                                    Verified
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription>
                                Joined on{" "}
                                {renderPostedDate(applicant.createdAt)} •{" "}
                                {applications.length} application(s)
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link
                                href={`/dashboard/applicants/${applicant.id}`}
                              >
                                <User className="mr-1 h-4 w-4" />
                                View Profile
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                toggleApplicantExpanded(applicant.id)
                              }
                            >
                              {expandedApplicantId === applicant.id ? (
                                <>
                                  <ChevronUp className="mr-1 h-4 w-4" />
                                  Hide Applications
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="mr-1 h-4 w-4" />
                                  View Applications
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      {expandedApplicantId === applicant.id && (
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <h4 className="text-sm font-medium mb-2 flex items-center">
                                  <User className="mr-1 h-4 w-4" />
                                  Applicant Profile
                                </h4>
                                <div className="bg-muted p-3 rounded-md text-sm space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Email:
                                    </span>
                                    <span>{applicant.email}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Role:
                                    </span>
                                    <span>{applicant.role}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      KYC Status:
                                    </span>
                                    <span>
                                      {applicant.kycVerified ? (
                                        <Badge
                                          variant="outline"
                                          className="bg-green-100 text-green-800"
                                        >
                                          Verified
                                        </Badge>
                                      ) : applicant.kycSubmitted ? (
                                        <Badge
                                          variant="outline"
                                          className="bg-yellow-100 text-yellow-800"
                                        >
                                          Pending
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline">
                                          Not Submitted
                                        </Badge>
                                      )}
                                    </span>
                                  </div>
                                  {applicant.organizationName && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">
                                        Organization:
                                      </span>
                                      <span>{applicant.organizationName}</span>
                                    </div>
                                  )}
                                  {applicant.organizationRole && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">
                                        Organization Role:
                                      </span>
                                      <span>{applicant.organizationRole}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div>
                                <h4 className="text-sm font-medium mb-2 flex items-center">
                                  <FileText className="mr-1 h-4 w-4" />
                                  Application Summary
                                </h4>
                                <div className="bg-muted p-3 rounded-md text-sm space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Total Applications:
                                    </span>
                                    <span>{applications.length}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Pending:
                                    </span>
                                    <span>
                                      {
                                        applications.filter(
                                          (app) => app.status === "pending"
                                        ).length
                                      }
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Reviewing:
                                    </span>
                                    <span>
                                      {
                                        applications.filter(
                                          (app) => app.status === "reviewing"
                                        ).length
                                      }
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Accepted:
                                    </span>
                                    <span>
                                      {
                                        applications.filter(
                                          (app) => app.status === "accepted"
                                        ).length
                                      }
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Rejected:
                                    </span>
                                    <span>
                                      {
                                        applications.filter(
                                          (app) => app.status === "rejected"
                                        ).length
                                      }
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <Separator />

                            <h4 className="text-sm font-medium">
                              Applications
                            </h4>
                            <div className="space-y-4">
                              {applications.map((application) => (
                                <Card
                                  key={application.id}
                                  className="border border-muted"
                                >
                                  <CardHeader className="p-4 pb-2">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <CardTitle className="text-base">
                                          {application.opportunity.title}
                                        </CardTitle>
                                        <CardDescription>
                                          Applied on{" "}
                                          {renderPostedDate(
                                            application.createdAt
                                          )}
                                        </CardDescription>
                                      </div>
                                      {getStatusBadge(application.status)}
                                    </div>
                                  </CardHeader>
                                  <CardContent className="p-4 pt-2">
                                    <div className="flex flex-wrap gap-4 mb-2">
                                      <div>
                                        <span className="text-sm font-medium">
                                          Status:
                                        </span>
                                        <Select
                                          defaultValue={application.status}
                                          onValueChange={(value) =>
                                            handleStatusChange(
                                              application.id,
                                              value
                                            )
                                          }
                                          disabled={
                                            updatingApplication ===
                                            application.id
                                          }
                                        >
                                          <SelectTrigger className="w-[180px] h-8 mt-1">
                                            <SelectValue placeholder="Select status" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="pending">
                                              Pending
                                            </SelectItem>
                                            <SelectItem value="reviewing">
                                              Reviewing
                                            </SelectItem>
                                            <SelectItem value="accepted">
                                              Accepted
                                            </SelectItem>
                                            <SelectItem value="rejected">
                                              Rejected
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {application.opportunity
                                        .applicationStages &&
                                        application.opportunity
                                          .applicationStages.length > 0 && (
                                          <div>
                                            <span className="text-sm font-medium">
                                              Stage:
                                            </span>
                                            <Select
                                              defaultValue={
                                                application.currentStage ||
                                                application.opportunity
                                                  .applicationStages[0]
                                              }
                                              onValueChange={(value) =>
                                                handleStageChange(
                                                  application.id,
                                                  value
                                                )
                                              }
                                              disabled={
                                                updatingApplication ===
                                                application.id
                                              }
                                            >
                                              <SelectTrigger className="w-[180px] h-8 mt-1">
                                                <SelectValue placeholder="Select stage" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {application.opportunity.applicationStages.map(
                                                  (stage, index) => (
                                                    <SelectItem
                                                      key={index}
                                                      value={stage}
                                                    >
                                                      {stage}
                                                    </SelectItem>
                                                  )
                                                )}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        )}
                                    </div>

                                    <div className="mt-4 flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                      >
                                        <Link
                                          href={`/dashboard/opportunities/applications/${application.id}`}
                                        >
                                          View Details
                                        </Link>
                                      </Button>

                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center"
                                      >
                                        <Calendar className="mr-1 h-4 w-4" />
                                        Schedule Interview
                                      </Button>
                                    </div>

                                    {application.notes && (
                                      <div className="mt-4">
                                        <div className="flex items-center text-sm font-medium mb-1">
                                          <MessageSquare className="mr-1 h-4 w-4" />
                                          Applicant Notes:
                                        </div>
                                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                                          {application.notes}
                                        </p>
                                      </div>
                                    )}

                                    {application.feedback && (
                                      <div className="mt-4">
                                        <div className="flex items-center text-sm font-medium mb-1">
                                          <MessageSquare className="mr-1 h-4 w-4" />
                                          Your Feedback:
                                        </div>
                                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                                          {application.feedback}
                                        </p>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="w-96 h-full">
            <ChatInterface />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );

  function renderApplicationsList() {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (applications.length === 0) {
      return (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">
              No applications received yet
            </p>
            <Button asChild>
              <Link href="/dashboard/opportunities">
                View Your Opportunities
              </Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {applications.map((application) => (
          <Card key={application.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {application.opportunity.title}
                  </CardTitle>
                  <CardDescription>
                    Applicant ID: {application.applicantId.substring(0, 8)}... •
                    Received on {format(new Date(application.createdAt), "PPP")}
                  </CardDescription>
                </div>
                {getStatusBadge(application.status)}
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex flex-wrap gap-4 mb-2">
                <div>
                  <span className="text-sm font-medium">Status:</span>
                  <Select
                    defaultValue={application.status}
                    onValueChange={(value) =>
                      handleStatusChange(application.id, value)
                    }
                    disabled={updatingApplication === application.id}
                  >
                    <SelectTrigger className="w-[180px] h-8 mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewing">Reviewing</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {application.opportunity.applicationStages &&
                  application.opportunity.applicationStages.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">Stage:</span>
                      <Select
                        defaultValue={
                          application.currentStage ||
                          application.opportunity.applicationStages[0]
                        }
                        onValueChange={(value) =>
                          handleStageChange(application.id, value)
                        }
                        disabled={updatingApplication === application.id}
                      >
                        <SelectTrigger className="w-[180px] h-8 mt-1">
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent>
                          {application.opportunity.applicationStages.map(
                            (stage, index) => (
                              <SelectItem key={index} value={stage}>
                                {stage}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                <div>
                  <span className="text-sm font-medium">Category:</span>
                  <Select
                    defaultValue="uncategorized"
                    onValueChange={setCategory}
                    disabled={updatingApplication === application.id}
                  >
                    <SelectTrigger className="w-[180px] h-8 mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uncategorized">
                        Uncategorized
                      </SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="promising">Promising</SelectItem>
                      <SelectItem value="needs-review">Needs Review</SelectItem>
                      <SelectItem value="not-suitable">Not Suitable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/dashboard/opportunities/applications/${application.id}`}
                  >
                    View Details
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                >
                  <Calendar className="mr-1 h-4 w-4" />
                  Schedule Interview
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                >
                  <Video className="mr-1 h-4 w-4" />
                  Start Meeting
                </Button>
              </div>

              {application.notes && (
                <div className="mt-4">
                  <div className="flex items-center text-sm font-medium mb-1">
                    <MessageSquare className="mr-1 h-4 w-4" />
                    Applicant Notes:
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {application.notes}
                  </p>
                </div>
              )}
            </CardContent>
            <Collapsible
              open={expandedApplicationId === application.id}
              onOpenChange={() => toggleExpanded(application.id)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-center py-1 h-8"
                >
                  {expandedApplicationId === application.id ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Show Details
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <Separator className="my-4" />

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        Provide Feedback
                      </h4>
                      <Textarea
                        placeholder="Enter feedback for the applicant..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <Button
                        className="mt-2"
                        size="sm"
                        onClick={() => handleFeedbackSubmit(application.id)}
                        disabled={
                          !feedback.trim() ||
                          updatingApplication === application.id
                        }
                      >
                        {updatingApplication === application.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Feedback"
                        )}
                      </Button>
                    </div>

                    {application.feedback && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Previous Feedback
                        </h4>
                        <div className="bg-muted p-3 rounded-md text-sm">
                          {application.feedback}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    );
  }
}

export default ApplicationsPage;
