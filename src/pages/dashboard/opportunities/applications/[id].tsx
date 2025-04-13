import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  FileText
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
};

type Opportunity = {
  id: string;
  title: string;
  provider: string;
  applicationStages: string[];
};

function ApplicationsPage() {
  const router = useRouter();
  const { id } = router.query; // opportunity ID
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [expandedApplicationId, setExpandedApplicationId] = useState<string | null>(null);
  const [updatingApplication, setUpdatingApplication] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>('');

  useEffect(() => {
    if (id && user) {
      fetchApplications();
      fetchOpportunity();
    }
  }, [id, user, filter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/applications?opportunityId=${id}&role=creator`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      
      // Ensure data is an array
      const applicationsArray = Array.isArray(data) ? data : [];
      
      // Filter applications based on status if filter is not 'all'
      const filteredApplications = filter === 'all' 
        ? applicationsArray 
        : applicationsArray.filter((app: Application) => app.status === filter);
      
      setApplications(filteredApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOpportunity = async () => {
    try {
      const response = await fetch(`/api/opportunities/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch opportunity');
      }

      const data = await response.json();
      setOpportunity(data);
    } catch (error) {
      console.error('Error fetching opportunity:', error);
    }
  };

  const handleStatusChange = async (applicationId: string, status: string) => {
    setUpdatingApplication(applicationId);
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update application status');
      }

      // Update the application in the state
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status } : app
      ));

      toast({
        title: "Success",
        description: `Application status updated to ${status}`,
      });
    } catch (error) {
      console.error('Error updating application status:', error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      });
    } finally {
      setUpdatingApplication(null);
    }
  };

  const handleStageChange = async (applicationId: string, currentStage: string) => {
    setUpdatingApplication(applicationId);
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentStage }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update application stage');
      }

      // Update the application in the state
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, currentStage } : app
      ));

      toast({
        title: "Success",
        description: `Application stage updated to ${currentStage}`,
      });
    } catch (error) {
      console.error('Error updating application stage:', error);
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
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      // Update the application in the state
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, feedback } : app
      ));

      setFeedback('');
      toast({
        title: "Success",
        description: "Feedback submitted successfully",
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
      });
    } finally {
      setUpdatingApplication(null);
    }
  };
  
  const handleQualificationChange = async (applicationId: string, isQualified: boolean) => {
    setUpdatingApplication(applicationId);
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isQualified }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update qualification status');
      }

      // Update the application in the state
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, isQualified } : app
      ));

      toast({
        title: "Success",
        description: isQualified 
          ? "Applicant has been qualified for interviews" 
          : "Applicant has been disqualified from interviews",
      });
    } catch (error) {
      console.error('Error updating qualification status:', error);
      toast({
        title: "Error",
        description: "Failed to update qualification status",
        variant: "destructive",
      });
    } finally {
      setUpdatingApplication(null);
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

  const toggleExpanded = (applicationId: string) => {
    setExpandedApplicationId(expandedApplicationId === applicationId ? null : applicationId);
    // Reset feedback when collapsing
    if (expandedApplicationId === applicationId) {
      setFeedback('');
    } else {
      // Load existing feedback when expanding
      const application = applications.find(app => app.id === applicationId);
      setFeedback(application?.feedback || '');
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Applications | Astra</title>
        <meta name="description" content="Manage applications for your opportunity" />
      </Head>
      
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar />
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Button variant="ghost" onClick={() => router.back()} className="mb-2">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
                {opportunity && (
                  <p className="text-muted-foreground">
                    For: {opportunity.title}
                  </p>
                )}
              </div>
            </div>

            <Tabs defaultValue="all" onValueChange={setFilter}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="reviewing">Reviewing</TabsTrigger>
                <TabsTrigger value="accepted">Accepted</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
            </Tabs>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : applications.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground mb-4">No applications found</p>
                  <Button asChild>
                    <Link href={`/dashboard/opportunities/${id}`}>
                      Back to Opportunity
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <Card key={application.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">Application from {application.applicantId.substring(0, 8)}...</CardTitle>
                          <CardDescription>
                            Submitted on {format(new Date(application.createdAt), 'PPP')}
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
                            onValueChange={(value) => handleStatusChange(application.id, value)}
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
                        
                        {opportunity?.applicationStages && opportunity.applicationStages.length > 0 && (
                          <div>
                            <span className="text-sm font-medium">Stage:</span>
                            <Select 
                              defaultValue={application.currentStage || opportunity.applicationStages[0]} 
                              onValueChange={(value) => handleStageChange(application.id, value)}
                              disabled={updatingApplication === application.id}
                            >
                              <SelectTrigger className="w-[180px] h-8 mt-1">
                                <SelectValue placeholder="Select stage" />
                              </SelectTrigger>
                              <SelectContent>
                                {opportunity.applicationStages.map((stage, index) => (
                                  <SelectItem key={index} value={stage}>{stage}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        
                        <div>
                          <span className="text-sm font-medium">Qualified for Interview:</span>
                          <div className="flex items-center space-x-2 mt-1">
                            <Switch 
                              checked={application.isQualified || false}
                              onCheckedChange={(checked) => handleQualificationChange(application.id, checked)}
                              disabled={updatingApplication === application.id}
                            />
                            <span className="text-sm">
                              {application.isQualified ? 'Qualified' : 'Not Qualified'}
                            </span>
                          </div>
                        </div>
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
                        <Button variant="ghost" className="w-full flex items-center justify-center py-1 h-8">
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
                              <h4 className="text-sm font-medium mb-2">Provide Feedback</h4>
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
                                disabled={!feedback.trim() || updatingApplication === application.id}
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
                                <h4 className="text-sm font-medium mb-2">Previous Feedback</h4>
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
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default ApplicationsPage;