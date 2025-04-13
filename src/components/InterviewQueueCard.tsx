import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Users, Clock, CheckCircle2, XCircle } from "lucide-react";

interface InterviewQueueCardProps {
  applicationId: string;
  opportunityId: string;
  isQualified: boolean;
  refreshApplication: () => void;
}

interface QueueInfo {
  userApplication?: {
    id: string;
    isQualified: boolean;
    inInterviewQueue: boolean;
    queuePosition: number | null;
    joinedQueueAt: string | null;
  };
  queuePosition?: number | null;
  totalInQueue: number;
  isInQueue: boolean;
  isQualified: boolean;
}

const InterviewQueueCard: React.FC<InterviewQueueCardProps> = ({ 
  applicationId, 
  opportunityId,
  isQualified,
  refreshApplication
}) => {
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchQueueInfo();
  }, [opportunityId]);

  const fetchQueueInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/opportunities/${opportunityId}/interview-queue`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch interview queue information');
      }
      
      const data = await response.json();
      setQueueInfo(data);
    } catch (error) {
      console.error('Error fetching queue info:', error);
      toast({
        title: "Error",
        description: "Failed to load interview queue information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinQueue = async () => {
    if (!isQualified) return;
    
    setUpdating(true);
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ joinInterviewQueue: true }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to join interview queue');
      }
      
      toast({
        title: "Success",
        description: "You have joined the interview queue",
      });
      
      // Refresh data
      await fetchQueueInfo();
      refreshApplication();
    } catch (error) {
      console.error('Error joining queue:', error);
      toast({
        title: "Error",
        description: "Failed to join the interview queue",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleLeaveQueue = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leaveInterviewQueue: true }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to leave interview queue');
      }
      
      toast({
        title: "Success",
        description: "You have left the interview queue",
      });
      
      // Refresh data
      await fetchQueueInfo();
      refreshApplication();
    } catch (error) {
      console.error('Error leaving queue:', error);
      toast({
        title: "Error",
        description: "Failed to leave the interview queue",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interview Queue</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!queueInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interview Queue</CardTitle>
          <CardDescription>Unable to load queue information</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchQueueInfo}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Interview Queue
        </CardTitle>
        <CardDescription>
          {queueInfo.isQualified 
            ? "You are qualified to join the interview queue" 
            : "You need to be qualified to join the interview queue"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {queueInfo.isInQueue ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Your Position</p>
                <p className="text-3xl font-bold">{queueInfo.queuePosition} of {queueInfo.totalInQueue}</p>
              </div>
              <Badge className="bg-green-100 text-green-800">In Queue</Badge>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-1">Queue Progress</p>
              <Progress 
                value={(1 - ((queueInfo.queuePosition || 1) / (queueInfo.totalInQueue || 1))) * 100} 
                className="h-2" 
              />
            </div>
            
            {queueInfo.userApplication?.joinedQueueAt && (
              <p className="text-sm text-muted-foreground">
                <Clock className="inline-block mr-1 h-3 w-3" />
                Joined on {new Date(queueInfo.userApplication.joinedQueueAt).toLocaleDateString()}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Current Queue Size</p>
                <p className="text-3xl font-bold">{queueInfo.totalInQueue} applicants</p>
              </div>
              {queueInfo.isQualified ? (
                <Badge variant="outline" className="bg-amber-100 text-amber-800">Qualified</Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-100 text-gray-800">Not Qualified</Badge>
              )}
            </div>
            
            {queueInfo.isQualified && (
              <p className="text-sm text-muted-foreground">
                <CheckCircle2 className="inline-block mr-1 h-3 w-3" />
                You are qualified to join the interview queue
              </p>
            )}
            
            {!queueInfo.isQualified && (
              <p className="text-sm text-muted-foreground">
                <XCircle className="inline-block mr-1 h-3 w-3" />
                You need to be qualified by the opportunity provider
              </p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        {queueInfo.isInQueue ? (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleLeaveQueue}
            disabled={updating}
          >
            {updating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Leaving Queue...
              </>
            ) : (
              "Leave Queue"
            )}
          </Button>
        ) : (
          <Button 
            className="w-full" 
            onClick={handleJoinQueue}
            disabled={!queueInfo.isQualified || updating}
          >
            {updating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining Queue...
              </>
            ) : (
              "Join Interview Queue"
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default InterviewQueueCard;