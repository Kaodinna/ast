import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EnhancedReadinessAssessment from './EnhancedReadinessAssessment';
import ReadinessAssistantChat from './ReadinessAssistantChat';

type ReadinessAssessmentWithChatProps = {
  opportunityId: string;
  opportunity: any;
  onComplete: (passed: boolean) => void;
};

const ReadinessAssessmentWithChat: React.FC<ReadinessAssessmentWithChatProps> = ({
  opportunityId,
  opportunity,
  onComplete
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Assessment Area - Takes 2/3 of the space */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>AI-Powered Readiness Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedReadinessAssessment 
              opportunityId={opportunityId}
              onComplete={onComplete}
              chatAssistEnabled={true}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Right Column - Chat Interface and Opportunity Details */}
      <div className="lg:col-span-1 space-y-6">
        {/* Chat Interface */}
        <Card className="h-[400px] flex flex-col">
          <CardHeader className="p-3 border-b">
            <CardTitle className="text-base">AI Assistant</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ReadinessAssistantChat 
              contextPrompt={`You are helping the user complete a readiness assessment for an opportunity titled "${opportunity?.title || 'this opportunity'}". 
              The assessment includes eligibility checks, a mock application, and a mock interview. 
              Provide helpful, concise answers to help the user complete each section successfully.
              
              Opportunity details:
              Title: ${opportunity?.title || 'Unknown'}
              Provider: ${opportunity?.provider || 'Unknown'}
              Type: ${opportunity?.type || 'Unknown'}
              ${opportunity?.description ? `Description: ${opportunity.description.substring(0, 200)}...` : ''}
              ${opportunity?.eligibility ? `Eligibility: ${opportunity.eligibility.substring(0, 200)}...` : ''}
              `}
            />
          </CardContent>
        </Card>
        
        {/* Opportunity Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Opportunity Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">Title</h3>
              <p className="text-sm">{opportunity?.title || 'Loading...'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium">Provider</h3>
              <p className="text-sm">{opportunity?.provider || 'Loading...'}</p>
            </div>
            
            {opportunity?.type && (
              <div>
                <h3 className="text-sm font-medium">Type</h3>
                <p className="text-sm">{opportunity.type}</p>
              </div>
            )}
            
            {opportunity?.eligibility && (
              <div>
                <h3 className="text-sm font-medium">Eligibility</h3>
                <p className="text-sm line-clamp-3">{opportunity.eligibility}</p>
              </div>
            )}
            
            {opportunity?.description && (
              <div>
                <h3 className="text-sm font-medium">Description</h3>
                <p className="text-sm line-clamp-3">{opportunity.description}</p>
              </div>
            )}
            
            {opportunity?.deadline && (
              <div>
                <h3 className="text-sm font-medium">Deadline</h3>
                <p className="text-sm">{new Date(opportunity.deadline).toLocaleDateString()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReadinessAssessmentWithChat;