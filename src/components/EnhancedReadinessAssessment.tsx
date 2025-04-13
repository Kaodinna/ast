import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import ReadinessAssessmentStepper from './ReadinessAssessmentStepper';

type ReadinessAssessmentProps = {
  opportunityId: string;
  onComplete: (passed: boolean) => void;
  chatAssistEnabled?: boolean;
};

type Assessment = {
  id: string;
  status: string;
  eligibilityScore: number | null;
  eligibilityFeedback: string | null;
  mockApplicationCompleted: boolean;
  mockApplicationScore: number | null;
  mockApplicationFeedback: string | null;
  mockInterviewCompleted: boolean;
  mockInterviewScore: number | null;
  mockInterviewFeedback: string | null;
  finalReadinessScore: number | null;
  recommendedTraining: string | null;
};

type Question = {
  id: string;
  section: 'eligibility' | 'application' | 'interview';
  question: string;
  placeholder: string;
  answer: string;
};

const EnhancedReadinessAssessment: React.FC<ReadinessAssessmentProps> = ({ 
  opportunityId, 
  onComplete,
  chatAssistEnabled = false
}) => {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [activeSection, setActiveSection] = useState<'eligibility' | 'application' | 'interview' | 'results'>('eligibility');
  const [opportunity, setOpportunity] = useState<any>(null);
  
  // Questions state
  const [applicationQuestions, setApplicationQuestions] = useState<Question[]>([
    {
      id: 'personal-statement',
      section: 'application',
      question: 'Write a brief personal statement about yourself and why you\'re a good fit for this opportunity.',
      placeholder: 'Introduce yourself and highlight your relevant qualifications...',
      answer: ''
    },
    {
      id: 'relevant-experience',
      section: 'application',
      question: 'Describe your relevant experience, skills, and qualifications that make you suitable for this opportunity.',
      placeholder: 'List your experience, skills, and qualifications...',
      answer: ''
    },
    {
      id: 'why-interested',
      section: 'application',
      question: 'Explain why you\'re interested in this specific opportunity and what you hope to gain from it.',
      placeholder: 'Describe your interest and motivation...',
      answer: ''
    },
    {
      id: 'goals-objectives',
      section: 'application',
      question: 'What are your goals and objectives? How does this opportunity align with your future plans?',
      placeholder: 'Outline your short and long-term goals...',
      answer: ''
    }
  ]);
  
  const [interviewQuestions, setInterviewQuestions] = useState<Question[]>([
    {
      id: 'interview-1',
      section: 'interview',
      question: 'Tell us about yourself and why you\'re interested in this opportunity.',
      placeholder: 'Provide a concise introduction highlighting your background and interest...',
      answer: ''
    },
    {
      id: 'interview-2',
      section: 'interview',
      question: 'Describe a challenge you\'ve faced and how you overcame it.',
      placeholder: 'Explain the situation, your actions, and the outcome...',
      answer: ''
    },
    {
      id: 'interview-3',
      section: 'interview',
      question: 'What specific skills or experiences make you a good fit for this opportunity?',
      placeholder: 'Highlight relevant skills and experiences...',
      answer: ''
    }
  ]);
  
  // Processing states
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [submittingInterview, setSubmittingInterview] = useState(false);
  
  // Refs to track initialization state
  const initialFetchDone = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Single fetch on initial mount
  useEffect(() => {
    if (opportunityId && user && !initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchOpportunity();
      fetchOrCreateAssessment();
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [opportunityId, user]);
  
  // Add a timeout to prevent infinite loading
  useEffect(() => {
    if (loading) {
      timeoutRef.current = setTimeout(() => {
        if (loading) {
          setLoading(false);
          toast({
            title: 'Loading timeout',
            description: 'The assessment is taking longer than expected. Default values have been applied to allow you to proceed.',
            variant: 'destructive',
          });
          
          // Create a default assessment if none exists
          if (!assessment) {
            setAssessment({
              id: 'temp-' + Date.now(),
              status: 'in_progress',
              eligibilityScore: 75,
              eligibilityFeedback: 'Default eligibility feedback has been provided due to a loading timeout.',
              mockApplicationCompleted: false,
              mockApplicationScore: null,
              mockApplicationFeedback: null,
              mockInterviewCompleted: false,
              mockInterviewScore: null,
              mockInterviewFeedback: null,
              finalReadinessScore: null,
              recommendedTraining: null
            });
          }
        }
      }, 15000); // 15 seconds timeout
      
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [loading, assessment]);

  const fetchOpportunity = async () => {
    try {
      const response = await fetch(`/api/opportunities/${opportunityId}`);
      if (!response.ok) throw new Error('Failed to fetch opportunity');
      const data = await response.json();
      setOpportunity(data);
    } catch (error) {
      console.error('Error fetching opportunity:', error);
      toast({
        title: 'Error',
        description: 'Failed to load opportunity details',
        variant: 'destructive',
      });
    }
  };

  const fetchOrCreateAssessment = async () => {
    if (!loading) setLoading(true);
    
    try {
      console.log(`Fetching assessment for opportunity ${opportunityId}`);
      
      // First try to fetch an existing assessment
      const getResponse = await fetch(`/api/readiness-assessment?opportunityId=${opportunityId}`, {
        // Add cache control to prevent browser caching
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (getResponse.status === 404) {
        // If not found, create a new assessment
        console.log(`No existing assessment found, creating new one for opportunity ${opportunityId}`);
        
        const createResponse = await fetch('/api/readiness-assessment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ opportunityId }),
        });
        
        if (!createResponse.ok) throw new Error('Failed to create assessment');
        const newAssessment = await createResponse.json();
        setAssessment(newAssessment);
        
        // If the eligibility score is null, set a timeout to check once more
        if (newAssessment.eligibilityScore === null) {
          console.log(`Eligibility score not yet available, will check again in 5 seconds`);
          timeoutRef.current = setTimeout(async () => {
            try {
              const checkResponse = await fetch(`/api/readiness-assessment?opportunityId=${opportunityId}`, {
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0'
                }
              });
              
              if (checkResponse.ok) {
                const updatedAssessment = await checkResponse.json();
                setAssessment(updatedAssessment);
                setActiveSection(determineActiveSection(updatedAssessment));
              }
              setLoading(false);
            } catch (error) {
              console.error('Error checking assessment update:', error);
              setLoading(false);
            }
          }, 5000);
        } else {
          setLoading(false);
        }
      } else if (getResponse.ok) {
        // If found, use the existing assessment
        const existingAssessment = await getResponse.json();
        setAssessment(existingAssessment);
        setActiveSection(determineActiveSection(existingAssessment));
        setLoading(false);
      } else {
        throw new Error('Failed to fetch assessment');
      }
    } catch (error) {
      console.error('Error with assessment:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize readiness assessment',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };
  
  // Helper function to determine the active section based on assessment state
  const determineActiveSection = (assessmentData: Assessment): 'eligibility' | 'application' | 'interview' | 'results' => {
    if (assessmentData.mockApplicationCompleted && assessmentData.mockInterviewCompleted) {
      return 'results';
    } else if (assessmentData.mockApplicationCompleted) {
      return 'interview';
    } else if (assessmentData.eligibilityScore !== null) {
      return 'application';
    }
    return 'eligibility';
  };

  const handleApplicationComplete = async (answers: Question[]) => {
    if (!assessment) return;
    
    setSubmittingApplication(true);
    try {
      // Convert answers to the format expected by the API
      const applicationData = {
        personalStatement: answers.find(q => q.id === 'personal-statement')?.answer || '',
        relevantExperience: answers.find(q => q.id === 'relevant-experience')?.answer || '',
        whyInterested: answers.find(q => q.id === 'why-interested')?.answer || '',
        goalsAndObjectives: answers.find(q => q.id === 'goals-objectives')?.answer || '',
      };
      
      const response = await fetch('/api/readiness-assessment/mock-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId: assessment.id,
          applicationData,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to submit mock application');
      
      const updatedAssessment = await response.json();
      setAssessment(updatedAssessment);
      setActiveSection('interview');
      
      toast({
        title: 'Success',
        description: 'Your mock application has been evaluated',
      });
    } catch (error) {
      console.error('Error submitting mock application:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit mock application',
        variant: 'destructive',
      });
    } finally {
      setSubmittingApplication(false);
    }
  };

  const handleInterviewComplete = async (answers: Question[]) => {
    if (!assessment) return;
    
    setSubmittingInterview(true);
    try {
      // Convert answers to the format expected by the API
      const interviewData = {
        question1: answers.find(q => q.id === 'interview-1')?.answer || '',
        question2: answers.find(q => q.id === 'interview-2')?.answer || '',
        question3: answers.find(q => q.id === 'interview-3')?.answer || '',
      };
      
      const response = await fetch('/api/readiness-assessment/mock-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId: assessment.id,
          interviewData,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to submit mock interview');
      
      const updatedAssessment = await response.json();
      
      // Check if we need to fetch the final results
      if (!updatedAssessment.finalReadinessScore) {
        // Make a single fetch to get the final results
        try {
          const finalResponse = await fetch(`/api/readiness-assessment?opportunityId=${opportunityId}`, {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (finalResponse.ok) {
            const finalAssessment = await finalResponse.json();
            setAssessment(finalAssessment);
          } else {
            // If we can't get the final results, use what we have
            setAssessment(updatedAssessment);
          }
        } catch (finalError) {
          console.error('Error fetching final results:', finalError);
          setAssessment(updatedAssessment);
        }
      } else {
        setAssessment(updatedAssessment);
      }
      
      setActiveSection('results');
      
      toast({
        title: 'Success',
        description: 'Your mock interview has been evaluated',
      });
    } catch (error) {
      console.error('Error submitting mock interview:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit mock interview',
        variant: 'destructive',
      });
    } finally {
      setSubmittingInterview(false);
    }
  };

  const completeAssessment = () => {
    if (!assessment) return;
    
    const passed = (assessment.finalReadinessScore || 0) >= 70;
    onComplete(passed);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to initialize the readiness assessment. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Assessment Progress</span>
          <span className="text-sm">
            {assessment.status === 'completed' ? 'Complete' : 
             assessment.status === 'failed' ? 'Needs Improvement' : 'In Progress'}
          </span>
        </div>
        <Progress 
          value={
            assessment.status === 'completed' ? 100 :
            assessment.status === 'failed' ? 100 :
            assessment.mockInterviewCompleted ? 75 :
            assessment.mockApplicationCompleted ? 50 :
            assessment.eligibilityScore !== null ? 25 : 0
          } 
          className="h-2"
        />
      </div>
      
      {activeSection === 'eligibility' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Eligibility Check</h3>
          
          {assessment.eligibilityScore !== null ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Eligibility Score:</span>
                <span className="text-sm">{assessment.eligibilityScore}/100</span>
              </div>
              
              <div className="p-4 bg-muted rounded-md">
                <h4 className="font-medium mb-2">AI Feedback:</h4>
                <div className="text-sm whitespace-pre-line">
                  {assessment.eligibilityFeedback}
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => setActiveSection('application')}
                  className="w-full"
                >
                  Continue to Mock Application
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                <Button 
                  onClick={() => onComplete(true)}
                  variant="outline"
                  className="w-full"
                >
                  Skip Assessment and Apply Directly
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Analyzing your eligibility...</span>
            </div>
          )}
        </div>
      )}
      
      {activeSection === 'application' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Mock Application</h3>
          
          {assessment.mockApplicationCompleted ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Application Score:</span>
                <span className="text-sm">{assessment.mockApplicationScore}/100</span>
              </div>
              
              <div className="p-4 bg-muted rounded-md">
                <h4 className="font-medium mb-2">AI Feedback:</h4>
                <div className="text-sm whitespace-pre-line">
                  {assessment.mockApplicationFeedback}
                </div>
              </div>
              
              <Button 
                onClick={() => setActiveSection('interview')}
                className="w-full"
              >
                Continue to Mock Interview
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <ReadinessAssessmentStepper
              opportunityId={opportunityId}
              section="application"
              questions={applicationQuestions}
              onComplete={handleApplicationComplete}
              isSubmitting={submittingApplication}
            />
          )}
        </div>
      )}
      
      {activeSection === 'interview' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Mock Interview</h3>
          
          {assessment.mockInterviewCompleted ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Interview Score:</span>
                <span className="text-sm">{assessment.mockInterviewScore}/100</span>
              </div>
              
              <div className="p-4 bg-muted rounded-md">
                <h4 className="font-medium mb-2">AI Feedback:</h4>
                <div className="text-sm whitespace-pre-line">
                  {assessment.mockInterviewFeedback}
                </div>
              </div>
              
              <Button 
                onClick={() => setActiveSection('results')}
                className="w-full"
              >
                View Final Results
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <ReadinessAssessmentStepper
              opportunityId={opportunityId}
              section="interview"
              questions={interviewQuestions}
              onComplete={handleInterviewComplete}
              isSubmitting={submittingInterview}
            />
          )}
        </div>
      )}
      
      {activeSection === 'results' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Readiness Assessment Results</h3>
          
          {assessment.finalReadinessScore !== null ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg">
                <div className="text-3xl font-bold mb-2">
                  {assessment.finalReadinessScore.toFixed(1)}/100
                </div>
                <div className="text-sm text-center">
                  Final Readiness Score
                </div>
                
                <div className="mt-4">
                  {assessment.finalReadinessScore >= 70 ? (
                    <div className="flex items-center text-green-500">
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      <span>Ready to Apply</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-amber-500">
                      <AlertCircle className="mr-2 h-5 w-5" />
                      <span>Additional Preparation Recommended</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-2">Eligibility</h4>
                  <div className="flex items-center mb-1">
                    <Progress value={assessment.eligibilityScore || 0} className="h-2 flex-1 mr-2" />
                    <span className="text-sm">{assessment.eligibilityScore}/100</span>
                  </div>
                </div>
                
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-2">Application Quality</h4>
                  <div className="flex items-center mb-1">
                    <Progress value={assessment.mockApplicationScore || 0} className="h-2 flex-1 mr-2" />
                    <span className="text-sm">{assessment.mockApplicationScore}/100</span>
                  </div>
                </div>
                
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-2">Interview Skills</h4>
                  <div className="flex items-center mb-1">
                    <Progress value={assessment.mockInterviewScore || 0} className="h-2 flex-1 mr-2" />
                    <span className="text-sm">{assessment.mockInterviewScore}/100</span>
                  </div>
                </div>
                
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-2">Overall Readiness</h4>
                  <div className="flex items-center mb-1">
                    <Progress value={assessment.finalReadinessScore || 0} className="h-2 flex-1 mr-2" />
                    <span className="text-sm">{assessment.finalReadinessScore}/100</span>
                  </div>
                </div>
              </div>
              
              {assessment.recommendedTraining && (
                <div className="p-4 bg-muted rounded-md">
                  <h4 className="font-medium mb-2">Recommended Training:</h4>
                  <div className="text-sm whitespace-pre-line">
                    {assessment.recommendedTraining}
                  </div>
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={completeAssessment}
                  className="w-full"
                  variant={assessment.finalReadinessScore >= 70 ? "default" : "outline"}
                >
                  {assessment.finalReadinessScore >= 70 ? (
                    <>Proceed to Application</>
                  ) : (
                    <>Review Feedback and Try Again</>
                  )}
                </Button>
                
                <Button 
                  onClick={() => onComplete(true)}
                  variant="outline"
                  className="w-full"
                >
                  Skip Assessment and Apply Directly
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Calculating final results...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedReadinessAssessment;