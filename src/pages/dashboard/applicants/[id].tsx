import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  Loader2, 
  ArrowLeft, 
  User,
  Mail,
  Calendar,
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  FileText,
  MessageSquare,
  Building,
  RefreshCw
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";
import DashboardSidebar from "@/components/DashboardSidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

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
  readinessAssessment?: {
    id: string;
    status: string;
    eligibilityScore: number | null;
    mockApplicationScore: number | null;
    mockInterviewScore: number | null;
    finalReadinessScore: number | null;
  } | null;
};

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

function ApplicantDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [applicantData, setApplicantData] = useState<ApplicantWithApplications | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const dataFetchedRef = useRef(false);

  const fetchApplicantDetails = useCallback(async (applicantId: string, isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      // Add a timestamp to prevent browser caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/applications/applicant-details?applicantId=${applicantId}&_t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch applicant details');
      }

      const data = await response.json();
      setApplicantData(data);
      
      if (isRefresh) {
        toast({
          title: "Refreshed",
          description: "Applicant data has been updated",
        });
      }
    } catch (error) {
      console.error('Error fetching applicant details:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load applicant details",
        variant: "destructive",
      });
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  const handleRefresh = useCallback(() => {
    if (id && typeof id === 'string') {
      fetchApplicantDetails(id, true);
    }
  }, [id, fetchApplicantDetails]);

  useEffect(() => {
    // Only fetch data if it hasn't been fetched yet and we have the necessary data
    if (id && typeof id === 'string' && user && !dataFetchedRef.current) {
      dataFetchedRef.current = true;
      fetchApplicantDetails(id);
    }
    
    // Cleanup function to reset the ref when component unmounts
    return () => {
      dataFetchedRef.current = false;
    };
  }, [id, user, fetchApplicantDetails]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="flex items-center"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>;
      case 'reviewing':
        return <Badge variant="secondary" className="flex items-center"><AlertCircle className="mr-1 h-3 w-3" /> Reviewing</Badge>;
      case 'accepted':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 flex items-center"><CheckCircle2 className="mr-1 h-3 w-3" /> Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center"><XCircle className="mr-1 h-3 w-3" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format date for display
  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'PPP');
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Applicant Profile | Astra</title>
        <meta name="description" content="View applicant profile and applications" />
      </Head>
      
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar />
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" className="mr-2" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              
              {!loading && applicantData && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh} 
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
              )}
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !applicantData ? (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground mb-4">Applicant not found or you don't have permission to view this profile</p>
                  <Button asChild>
                    <Link href="/dashboard/applications">
                      Back to Applications
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Applicant Header */}
                <Card>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarFallback className="text-lg">
                            {applicantData.applicant.email.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-xl flex items-center gap-2">
                            {applicantData.applicant.email}
                            {applicantData.applicant.kycVerified && (
                              <Badge variant="outline" className="bg-green-100 text-green-800">
                                <CheckCircle2 className="mr-1 h-3 w-3" /> Verified
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            Joined on {formatDate(applicantData.applicant.createdAt)}
                          </CardDescription>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="flex items-center">
                          <FileText className="mr-1 h-3 w-3" />
                          {applicantData.applications.length} Application(s)
                        </Badge>
                        
                        <Badge variant="outline" className="flex items-center">
                          <User className="mr-1 h-3 w-3" />
                          {applicantData.applicant.role}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
                
                {/* Tabs for different sections */}
                <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-2 w-full md:w-[400px]">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="applications">Applications</TabsTrigger>
                  </TabsList>
                  
                  {/* Profile Tab */}
                  <TabsContent value="profile" className="mt-6 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Applicant Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-sm font-medium flex items-center mb-2">
                                <Mail className="mr-2 h-4 w-4" />
                                Contact Information
                              </h3>
                              <div className="bg-muted p-4 rounded-md space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Email:</span>
                                  <span>{applicantData.applicant.email}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-sm font-medium flex items-center mb-2">
                                <User className="mr-2 h-4 w-4" />
                                Account Details
                              </h3>
                              <div className="bg-muted p-4 rounded-md space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">User ID:</span>
                                  <span className="text-xs">{applicantData.applicant.id}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Role:</span>
                                  <span>{applicantData.applicant.role}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Active Role:</span>
                                  <span>{applicantData.applicant.activeRole}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Joined:</span>
                                  <span>{formatDate(applicantData.applicant.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-sm font-medium flex items-center mb-2">
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Verification Status
                              </h3>
                              <div className="bg-muted p-4 rounded-md space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">KYC Status:</span>
                                  <span>
                                    {applicantData.applicant.kycVerified ? (
                                      <Badge variant="outline" className="bg-green-100 text-green-800">Verified</Badge>
                                    ) : applicantData.applicant.kycSubmitted ? (
                                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>
                                    ) : (
                                      <Badge variant="outline">Not Submitted</Badge>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {(applicantData.applicant.organizationName || 
                             applicantData.applicant.organizationRole || 
                             applicantData.applicant.organizationType) && (
                              <div>
                                <h3 className="text-sm font-medium flex items-center mb-2">
                                  <Building className="mr-2 h-4 w-4" />
                                  Organization Information
                                </h3>
                                <div className="bg-muted p-4 rounded-md space-y-2">
                                  {applicantData.applicant.organizationName && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Organization:</span>
                                      <span>{applicantData.applicant.organizationName}</span>
                                    </div>
                                  )}
                                  {applicantData.applicant.organizationRole && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Role:</span>
                                      <span>{applicantData.applicant.organizationRole}</span>
                                    </div>
                                  )}
                                  {applicantData.applicant.organizationType && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Type:</span>
                                      <span>{applicantData.applicant.organizationType}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  {/* Applications Tab */}
                  <TabsContent value="applications" className="mt-6 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Applications ({applicantData.applications.length})</CardTitle>
                        <CardDescription>
                          All applications submitted by this applicant to your opportunities
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {applicantData.applications.length === 0 ? (
                          <p className="text-muted-foreground text-center py-4">No applications found</p>
                        ) : (
                          <div className="space-y-6">
                            {applicantData.applications.map(application => (
                              <Card key={application.id} className="border border-muted">
                                <CardHeader className="pb-2">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <CardTitle className="text-base">{application.opportunity.title}</CardTitle>
                                      <CardDescription>
                                        Applied on {formatDate(application.createdAt)}
                                      </CardDescription>
                                    </div>
                                    {getStatusBadge(application.status)}
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                      <h4 className="text-sm font-medium mb-2">Application Details</h4>
                                      <div className="bg-muted p-3 rounded-md text-sm space-y-2">
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Status:</span>
                                          <span>{application.status}</span>
                                        </div>
                                        {application.currentStage && (
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">Current Stage:</span>
                                            <span>{application.currentStage}</span>
                                          </div>
                                        )}
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Applied:</span>
                                          <span>{formatDate(application.createdAt)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Last Updated:</span>
                                          <span>{formatDate(application.updatedAt)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Qualified for Interview:</span>
                                          <span>{application.isQualified ? 'Yes' : 'No'}</span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {application.readinessAssessment && (
                                      <div>
                                        <h4 className="text-sm font-medium mb-2">Readiness Assessment</h4>
                                        <div className="bg-muted p-3 rounded-md text-sm space-y-2">
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">Status:</span>
                                            <span>{application.readinessAssessment.status}</span>
                                          </div>
                                          {application.readinessAssessment.eligibilityScore !== null && (
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Eligibility Score:</span>
                                              <span>{application.readinessAssessment.eligibilityScore}/100</span>
                                            </div>
                                          )}
                                          {application.readinessAssessment.mockApplicationScore !== null && (
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Mock Application Score:</span>
                                              <span>{application.readinessAssessment.mockApplicationScore}/100</span>
                                            </div>
                                          )}
                                          {application.readinessAssessment.mockInterviewScore !== null && (
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Mock Interview Score:</span>
                                              <span>{application.readinessAssessment.mockInterviewScore}/100</span>
                                            </div>
                                          )}
                                          {application.readinessAssessment.finalReadinessScore !== null && (
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Final Readiness Score:</span>
                                              <span>{application.readinessAssessment.finalReadinessScore}/100</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {application.notes && (
                                    <div className="mb-4">
                                      <h4 className="text-sm font-medium mb-2 flex items-center">
                                        <MessageSquare className="mr-1 h-4 w-4" />
                                        Applicant Notes
                                      </h4>
                                      <div className="bg-muted p-3 rounded-md text-sm">
                                        {application.notes}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {application.feedback && (
                                    <div className="mb-4">
                                      <h4 className="text-sm font-medium mb-2 flex items-center">
                                        <MessageSquare className="mr-1 h-4 w-4" />
                                        Your Feedback
                                      </h4>
                                      <div className="bg-muted p-3 rounded-md text-sm">
                                        {application.feedback}
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="flex gap-2 mt-4">
                                    <Button variant="outline" size="sm" asChild>
                                      <Link href={`/dashboard/opportunities/applications/${application.id}`}>
                                        View Application Details
                                      </Link>
                                    </Button>
                                    <Button variant="outline" size="sm" asChild>
                                      <Link href={`/dashboard/opportunities/${application.opportunityId}`}>
                                        View Opportunity
                                      </Link>
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default ApplicantDetailPage;