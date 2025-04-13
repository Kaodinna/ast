import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Question = {
  id: string;
  section: 'eligibility' | 'application' | 'interview';
  question: string;
  placeholder: string;
  answer: string;
};

type ReadinessAssessmentStepperProps = {
  opportunityId: string;
  section: 'eligibility' | 'application' | 'interview';
  questions: Question[];
  onComplete: (answers: Question[]) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
};

const ReadinessAssessmentStepper: React.FC<ReadinessAssessmentStepperProps> = ({
  opportunityId,
  section,
  questions,
  onComplete,
  isLoading = false,
  isSubmitting = false,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswers, setCurrentAnswers] = useState<Question[]>(questions);
  
  // Update answers when questions change
  useEffect(() => {
    setCurrentAnswers(questions);
  }, [questions]);
  
  const handleAnswerChange = (value: string) => {
    const updatedAnswers = [...currentAnswers];
    updatedAnswers[currentQuestionIndex].answer = value;
    setCurrentAnswers(updatedAnswers);
  };
  
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      onComplete(currentAnswers);
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const currentQuestion = currentAnswers[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 flex justify-center items-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg capitalize">{section} Assessment</CardTitle>
        <div className="mt-2">
          <div className="flex justify-between text-sm mb-1">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <h3 className="text-base font-medium">{currentQuestion.question}</h3>
          
          <Textarea
            placeholder={currentQuestion.placeholder}
            value={currentQuestion.answer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            className="min-h-[150px]"
          />
          
          {section === 'interview' && (
            <Alert>
              <AlertDescription className="text-sm">
                Tip: Be specific and provide examples from your experience that relate to this opportunity.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0 || isSubmitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!currentQuestion.answer.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : currentQuestionIndex === questions.length - 1 ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete
            </>
          ) : (
            <>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ReadinessAssessmentStepper;