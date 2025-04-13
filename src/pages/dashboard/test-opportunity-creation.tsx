import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardSidebar from "@/components/DashboardSidebar";
import GPTChatInterface from "@/components/GPTChatInterface";

// Sample opportunity data for testing
const sampleOpportunities = [
  {
    title: "Small Business Innovation Grant",
    description: "A grant program designed to support small businesses in developing innovative products or services. This opportunity provides financial assistance to help entrepreneurs bring their ideas to market.",
    provider: "Department of Economic Development",
    creatorType: "agency",
    type: "Government",
    industry: "Technology",
    whoCanApply: ["small-businesses", "startups"],
    requiredDocuments: ["business-plan", "financial-statements"],
    hasFunding: true,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    location: "National",
    eligibility: "Small businesses with fewer than 50 employees and annual revenue under $5 million.",
    funding: "$25,000 - $100,000",
    url: "https://example.gov/innovation-grant",
    applicationStages: ["Initial Application", "Review", "Interview", "Final Selection"],
    benefits: ["funding", "mentorship", "networking"],
    mentorshipDetails: "Recipients will be paired with industry experts for 6 months of guidance."
  },
  {
    title: "Youth Entrepreneurship Program",
    description: "A comprehensive program designed to support young entrepreneurs in launching their first business ventures. Includes training, mentorship, and seed funding.",
    provider: "Future Founders Foundation",
    creatorType: "company",
    type: "NGO",
    industry: "Education",
    whoCanApply: ["youth", "students"],
    requiredDocuments: ["cv", "project-proposal"],
    hasFunding: true,
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    location: "Virtual",
    eligibility: "Entrepreneurs aged 18-25 with an innovative business idea.",
    funding: "$5,000 seed funding",
    url: "https://example.org/youth-program",
    applicationStages: ["Application", "Pitch", "Selection"],
    benefits: ["funding", "training", "mentorship"],
    trainingDetails: "12-week intensive entrepreneurship training program."
  },
  {
    title: "Women in STEM Scholarship",
    description: "A scholarship program aimed at supporting women pursuing degrees in Science, Technology, Engineering, and Mathematics fields. This program seeks to increase diversity in STEM education and careers.",
    provider: "TechForward Foundation",
    creatorType: "individual",
    type: "Educational",
    industry: "Education",
    whoCanApply: ["female-led", "students"],
    requiredDocuments: ["cv", "references"],
    hasFunding: true,
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    location: "National",
    eligibility: "Female students enrolled in or accepted to accredited STEM degree programs.",
    funding: "$10,000 per academic year",
    url: "https://example.com/women-stem",
    applicationStages: ["Application", "Essay Review", "Interview"],
    benefits: ["funding", "networking"],
    networkingDetails: "Access to a network of women professionals in STEM fields."
  }
];

function TestOpportunityCreationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [creationStatus, setCreationStatus] = useState<{
    loading: boolean;
    success: boolean;
    error: string | null;
    opportunityIds: string[];
  }>({
    loading: false,
    success: false,
    error: null,
    opportunityIds: [],
  });

  // Define the opportunity type
  type OpportunityData = {
    title: string;
    description: string;
    provider: string;
    creatorType: string;
    type: string;
    industry?: string;
    whoCanApply?: string[];
    requiredDocuments?: string[];
    hasFunding?: boolean;
    deadline?: Date;
    location?: string;
    eligibility?: string;
    funding?: string;
    url?: string;
    applicationStages?: string[];
    benefits?: string[];
    mentorshipDetails?: string;
    trainingDetails?: string;
    networkingDetails?: string;
  };

  const createSampleOpportunity = async (opportunityData: OpportunityData) => {
    try {
      console.log('Creating sample opportunity:', opportunityData);
      
      // Add cache-busting and additional headers
      const response = await fetch('/api/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(opportunityData),
        credentials: 'same-origin',
      });

      // Log the response status
      console.log('Response status:', response.status);
      
      // Get the response text first to debug any parsing issues
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      if (!response.ok) {
        let errorMessage = 'Failed to create opportunity';
        try {
          // Try to parse the error response
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      // Parse the response JSON
      let createdOpportunity;
      try {
        createdOpportunity = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing success response:', parseError);
        throw new Error('Invalid response from server');
      }
      
      console.log('Created opportunity:', createdOpportunity);
      return createdOpportunity.id;
    } catch (error) {
      console.error('Error creating opportunity:', error);
      throw error;
    }
  };

  const handleCreateSampleOpportunities = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create opportunities.",
        variant: "destructive",
      });
      return;
    }

    setCreationStatus({
      loading: true,
      success: false,
      error: null,
      opportunityIds: [],
    });

    try {
      const createdIds: string[] = [];
      
      for (const opportunity of sampleOpportunities) {
        const id = await createSampleOpportunity(opportunity as OpportunityData);
        createdIds.push(id);
      }

      setCreationStatus({
        loading: false,
        success: true,
        error: null,
        opportunityIds: createdIds,
      });

      toast({
        title: "Success",
        description: `Created ${createdIds.length} sample opportunities.`,
      });
    } catch (error) {
      setCreationStatus({
        loading: false,
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        opportunityIds: [],
      });

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create sample opportunities',
        variant: "destructive",
      });
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Test Opportunity Creation | Astra</title>
        <meta name="description" content="Test the opportunity creation flow" />
      </Head>
      
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Test Opportunity Creation</h1>
                <Button asChild>
                  <Link href="/dashboard/create-opportunity">
                    Go to Create Opportunity Form
                  </Link>
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Create Sample Opportunities</CardTitle>
                  <CardDescription>
                    This page allows you to create sample opportunities to test the opportunity creation flow.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <p>
                      Click the button below to create three sample opportunities with different types and configurations:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Small Business Innovation Grant (Government)</li>
                      <li>Youth Entrepreneurship Program (NGO)</li>
                      <li>Women in STEM Scholarship (Educational)</li>
                    </ul>
                  </div>

                  <Button 
                    onClick={handleCreateSampleOpportunities}
                    disabled={creationStatus.loading}
                    className="w-full"
                  >
                    {creationStatus.loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Sample Opportunities...
                      </>
                    ) : (
                      "Create Sample Opportunities"
                    )}
                  </Button>

                  {creationStatus.success && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-800">Success!</AlertTitle>
                      <AlertDescription className="text-green-700">
                        Successfully created {creationStatus.opportunityIds.length} sample opportunities.
                        <div className="mt-2">
                          <Button asChild>
                            <Link href="/dashboard/opportunities">
                              View All Opportunities
                            </Link>
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {creationStatus.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>
                        {creationStatus.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Manual Testing Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>To manually test the opportunity creation flow:</p>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>Navigate to the <Link href="/dashboard/create-opportunity" className="text-primary hover:underline">Create Opportunity</Link> page</li>
                    <li>Fill out the form with your own test data</li>
                    <li>Submit the form to create a new opportunity</li>
                    <li>Verify that the opportunity appears in the <Link href="/dashboard/opportunities" className="text-primary hover:underline">Opportunities</Link> list</li>
                    <li>Click on the opportunity to view its details</li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Chat Interface */}
          <div className="w-96 h-full">
            <GPTChatInterface />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default TestOpportunityCreationPage;