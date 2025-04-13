import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  Loader2, 
  ArrowLeft, 
  FileText, 
  MessageSquare, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import DashboardSidebar from "@/components/DashboardSidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import InterviewQueueCard from "@/components/InterviewQueueCard";
import { useAuth } from "@/contexts/AuthContext";

interface Application {
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
}

function ApplicationDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchApplication(id);
    }
  }, [id]);

  const fetchApplication = async (applicationId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/applications/${applicationId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch application');
      }

      const data = await response.json();
      setApplication(data);
    } catch (error) {
      console.error('Error fetching application:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load application details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
        <title>Application Details | Astra</title>
        <meta name="description" content="View your application details" />
      </Head>
      
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar />
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" className="mr-2" asChild>
                <Link href="/dashboard/applications">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Applications
                </Link>
              </Button>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !application ? (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground mb-4">Application not found</p>
                  <Button asChild>
                    <Link href="/dashboard/applications">
                      View Your Applications
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">{application.opportunity.title}</CardTitle>
                            <CardDescription>{application.opportunity.provider}</CardDescription>
                          </div>
                          {getStatusBadge(application.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium mb-1">Application Details</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Applied on</p>
                              <p>{formatDate(application.createdAt)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Last updated</p>
                              <p>{formatDate(application.updatedAt)}</p>
                            </div>
                            {application.currentStage && (
                              <div>
                                <p className="text-sm text-muted-foreground">Current stage</p>
                                <p>{application.currentStage}</p>
                              </div>
                            )}
                            {application.qualificationDate && (
                              <div>
                                <p className="text-sm text-muted-foreground">Qualified on</p>
                                <p>{formatDate(application.qualificationDate)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Separator />
                        
                        {application.notes && (
                          <div>
                            <h3 className="text-sm font-medium mb-1 flex items-center">
                              <MessageSquare className="mr-1 h-4 w-4" />
                              Your Notes
                            </h3>
                            <p className="text-sm bg-muted p-3 rounded-md">{application.notes}</p>
                          </div>
                        )}
                        
                        {application.feedback && (
                          <div>
                            <h3 className="text-sm font-medium mb-1 flex items-center">
                              <MessageSquare className="mr-1 h-4 w-4" />
                              Feedback from Provider
                            </h3>
                            <p className="text-sm bg-muted p-3 rounded-md">{application.feedback}</p>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-2 mt-4">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/opportunities/${application.opportunityId}`}>
                              <ExternalLink className="mr-1 h-4 w-4" />
                              View Opportunity
                            </Link>
                          </Button>
                          
                          <Button variant="outline" size="sm">
                            <Calendar className="mr-1 h-4 w-4" />
                            View Timeline
                          </Button>
                          
                          <Button variant="outline" size="sm">
                            <FileText className="mr-1 h-4 w-4" />
                            View Documents
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="md:w-80">
                    {/* Interview Queue Card */}
                    <InterviewQueueCard 
                      applicationId={application.id}
                      opportunityId={application.opportunityId}
                      isQualified={application.isQualified}
                      refreshApplication={() => fetchApplication(application.id)}
                    />
                    
                    {/* Application Status Card */}
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle className="text-sm">Application Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Status:</span>
                            {getStatusBadge(application.status)}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Qualification:</span>
                            {application.isQualified ? (
                              <Badge variant="outline" className="bg-green-100 text-green-800">Qualified</Badge>
                            ) : (
                              <Badge variant="outline">Not Qualified</Badge>
                            )}
                          </div>
                          
                          {application.currentStage && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Current Stage:</span>
                              <Badge variant="outline">{application.currentStage}</Badge>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default ApplicationDetailPage;