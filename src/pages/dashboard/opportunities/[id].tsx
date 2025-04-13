import React, { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarIcon,
  MapPinIcon,
  ExternalLinkIcon,
  UserIcon,
  BuildingIcon,
  GlobeIcon,
  DollarSignIcon,
  UsersIcon,
  Loader2,
  PencilIcon,
  TrashIcon,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardSidebar from "@/components/DashboardSidebar";
import ReadinessAssessmentWithChat from "@/components/ReadinessAssessmentWithChat";
import { useAuth } from "@/contexts/AuthContext";
import { getAuth } from "firebase/auth";

type Opportunity = {
  id: string;
  title: string;
  description: string;
  provider: string;
  creatorType: string;
  type: string;
  deadline: string | null;
  location: string | null;
  eligibility: string | null;
  funding: string | null;
  url: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  createdBy: {
    email: string;
  };
  customFields?: { name: string; value: string }[];
  tags?: string[];
};

function OpportunityDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [showReadinessAssessment, setShowReadinessAssessment] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);

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
  // Memoize the fetch functions to prevent unnecessary re-renders
  const fetchOpportunity = useCallback(async () => {
    if (!id || !user) return;

    try {
      const response = await fetch(`/api/opportunities/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch opportunity");
      }

      const data = await response.json();
      setOpportunity(data);

      // Check if the current user is the creator of this opportunity
      if (user && data.userId === user?.id) {
        setIsOwner(true);
      }
    } catch (error) {
      console.error("Error fetching opportunity:", error);
      toast({
        title: "Error",
        description: "Failed to load opportunity details",
        variant: "destructive",
      });
    }
  }, [id, user]);

  const checkApplicationStatus = useCallback(async () => {
    if (!id || !user) return;

    try {
      const response = await fetch(
        `/api/applications?opportunityId=${id}&role=applicant`
      );

      if (!response.ok) {
        throw new Error("Failed to check application status");
      }

      const { applications } = await response.json();
      setHasApplied(applications && applications.length > 0);
    } catch (error) {
      console.error("Error checking application status:", error);
    }
  }, [id, user]);

  // Handle data fetching with proper loading states
  useEffect(() => {
    // Reset states when id changes
    if (!id || !user) {
      return;
    }

    // Prevent unnecessary re-fetching
    if (dataFetched) {
      return;
    }

    // Set loading state
    setLoading(true);

    // Use Promise.all to fetch both data sources concurrently
    const fetchData = async () => {
      try {
        await Promise.all([fetchOpportunity(), checkApplicationStatus()]);
        setDataFetched(true);
      } catch (error) {
        console.error("Error loading opportunity data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Cleanup function to handle component unmounting or id changing
    return () => {
      // This will run when the component unmounts or when id/user changes
      if (router.query.id !== id) {
        setDataFetched(false);
        setOpportunity(null);
        setIsOwner(false);
        setHasApplied(false);
      }
    };
  }, [
    id,
    user,
    dataFetched,
    fetchOpportunity,
    checkApplicationStatus,
    router.query.id,
  ]);

  const handleApply = async () => {
    if (!id || !user || isApplying || hasApplied) return;

    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const token = await currentUser.getIdToken().catch((err) => {
      console.error("Error getting token:", err);
      return null;
    });

    if (!token) return;
    setIsApplying(true);
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          opportunityId: id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to apply");
      }

      setHasApplied(true);
      toast({
        title: "Success",
        description: "Your application has been submitted successfully",
      });
    } catch (error) {
      console.error("Error applying:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to submit application",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/opportunities/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete opportunity");
      }

      toast({
        title: "Success",
        description: "Opportunity deleted successfully",
      });

      router.push("/dashboard/opportunities");
    } catch (error) {
      console.error("Error deleting opportunity:", error);
      toast({
        title: "Error",
        description: "Failed to delete opportunity",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getCreatorTypeIcon = (type: string) => {
    switch (type) {
      case "individual":
        return <UserIcon className="h-4 w-4 mr-2" />;
      case "agency":
        return <BuildingIcon className="h-4 w-4 mr-2" />;
      case "company":
        return <BuildingIcon className="h-4 w-4 mr-2" />;
      default:
        return <UserIcon className="h-4 w-4 mr-2" />;
    }
  };

  const getCreatorTypeLabel = (type: string) => {
    switch (type) {
      case "individual":
        return "Posted by an Individual";
      case "agency":
        return "Posted by a Government Agency";
      case "company":
        return "Posted by a Company/Organization";
      default:
        return "Posted by an Individual";
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto py-12 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!opportunity) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto py-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              This opportunity could not be found or has been removed.
            </AlertDescription>
          </Alert>

          <div className="mt-6 flex justify-center">
            <Button asChild>
              <Link href="/dashboard/opportunities">
                View All Opportunities
              </Link>
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>
          {opportunity
            ? `${opportunity.title} | Astra`
            : "Opportunity Details | Astra"}
        </title>
        <meta
          name="description"
          content={
            opportunity?.description?.substring(0, 160) || "Opportunity details"
          }
        />
      </Head>

      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar />

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="container py-6 space-y-6">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => {
                  if (showReadinessAssessment) {
                    setShowReadinessAssessment(false);
                  } else {
                    router.back();
                  }
                }}
                className="mb-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {showReadinessAssessment ? "Back to Opportunity" : "Back"}
              </Button>

              <div className="flex items-center gap-2">
                {isOwner && !showReadinessAssessment && (
                  <>
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`/dashboard/opportunities/edit/${opportunity.id}`}
                      >
                        <PencilIcon className="mr-1 h-4 w-4" />
                        Edit
                      </Link>
                    </Button>

                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`/dashboard/opportunities/edit/${opportunity.id}?addFields=true`}
                      >
                        <PlusCircle className="mr-1 h-4 w-4" />
                        Add Fields
                      </Link>
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <TrashIcon className="mr-1 h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete this opportunity.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              "Delete"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>

            {showReadinessAssessment ? (
              <div>
                <h2 className="text-2xl font-bold mb-4">
                  AI-Powered Readiness Assessment
                </h2>
                <p className="text-muted-foreground mb-6">
                  Complete this assessment to ensure you're prepared for{" "}
                  {opportunity?.title}
                </p>

                <ReadinessAssessmentWithChat
                  opportunityId={id as string}
                  opportunity={opportunity}
                  onComplete={(passed) => {
                    setShowReadinessAssessment(false);

                    if (passed) {
                      // If the user passed the assessment, allow them to apply
                      toast({
                        title: "Congratulations!",
                        description:
                          "You're ready to apply for this opportunity.",
                      });

                      // Auto-apply after a short delay
                      setTimeout(() => {
                        handleApply();
                      }, 1000);
                    } else {
                      toast({
                        title: "Additional preparation needed",
                        description:
                          "Please review the feedback and try again when you're ready.",
                        variant: "destructive",
                      });
                    }
                  }}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-2xl">
                            {opportunity.title}
                          </CardTitle>
                          <CardDescription className="text-lg mt-1">
                            {opportunity.provider}
                          </CardDescription>
                        </div>
                        <Badge className="text-sm">{opportunity.type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h3 className="font-medium mb-2">Description</h3>
                        <p className="text-muted-foreground whitespace-pre-line">
                          {opportunity.description}
                        </p>
                      </div>

                      {opportunity.eligibility && (
                        <div>
                          <h3 className="font-medium mb-2">Eligibility</h3>
                          <p className="text-muted-foreground whitespace-pre-line">
                            {opportunity.eligibility}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-col gap-4 pt-4">
                        <div className="flex items-center text-sm">
                          {getCreatorTypeIcon(opportunity.creatorType)}
                          <span>
                            {getCreatorTypeLabel(opportunity.creatorType)}
                          </span>
                        </div>

                        {opportunity.deadline && (
                          <div className="flex items-center text-sm">
                            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>
                              Application Deadline:{" "}
                              {format(new Date(opportunity.deadline), "PPP")}
                            </span>
                          </div>
                        )}

                        {opportunity.location && (
                          <div className="flex items-center text-sm">
                            <MapPinIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>Location: {opportunity.location}</span>
                          </div>
                        )}

                        {opportunity.funding && (
                          <div className="flex items-center text-sm">
                            <DollarSignIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>Funding: {opportunity.funding}</span>
                          </div>
                        )}

                        {opportunity.url && (
                          <div className="flex items-center text-sm">
                            <GlobeIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                            <a
                              href={opportunity.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center"
                            >
                              Visit Website
                              <ExternalLinkIcon className="ml-1 h-3 w-3" />
                            </a>
                          </div>
                        )}

                        {opportunity.tags && opportunity.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {opportunity.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Custom Fields Section */}
                      {opportunity.customFields &&
                        opportunity.customFields.length > 0 && (
                          <div className="pt-4">
                            <h3 className="font-medium mb-3">
                              Additional Information
                            </h3>
                            <div className="space-y-3">
                              {opportunity.customFields.map((field, index) => (
                                <div
                                  key={index}
                                  className="border rounded-md p-3"
                                >
                                  <h4 className="font-medium text-sm">
                                    {field.name}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {field.value}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                      <div className="text-sm text-muted-foreground">
                        Posted on {renderPostedDate(opportunity.createdAt)}
                      </div>
                    </CardFooter>
                  </Card>
                </div>

                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {isOwner ? (
                        <Button className="w-full" asChild>
                          <Link
                            href={`/dashboard/opportunities/applications/${opportunity.id}`}
                          >
                            View Applications
                          </Link>
                        </Button>
                      ) : (
                        <>
                          {hasApplied ? (
                            <Button className="w-full" disabled>
                              Already Applied
                            </Button>
                          ) : (
                            <>
                              <Button
                                className="w-full"
                                onClick={handleApply}
                                disabled={isApplying}
                              >
                                {isApplying ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Applying...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Apply Now
                                  </>
                                )}
                              </Button>

                              <Button
                                variant="outline"
                                className="w-full mt-2"
                                onClick={() => setShowReadinessAssessment(true)}
                              >
                                Check Your Readiness
                              </Button>

                              <Alert className="mt-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>
                                  Optional Readiness Check
                                </AlertTitle>
                                <AlertDescription>
                                  Our AI can help you prepare with a mock
                                  application and interview before you apply.
                                </AlertDescription>
                              </Alert>
                            </>
                          )}
                        </>
                      )}
                      <Button variant="outline" className="w-full">
                        Save for Later
                      </Button>
                      <Button variant="outline" className="w-full">
                        Share
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Similar Opportunities</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Similar opportunities will appear here based on this
                        opportunity's category and tags.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* No Dialog needed anymore as we're showing the assessment in the main content */}
    </ProtectedRoute>
  );
}

export default OpportunityDetailsPage;
