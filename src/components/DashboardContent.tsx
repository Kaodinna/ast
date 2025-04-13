import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, BookOpenIcon, AwardIcon, BarChart3Icon, ClockIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from 'next/link';

// Type definitions for our data
interface Opportunity {
  id: string;
  title: string;
  provider: string;
  type: string;
  deadline?: Date | null;
}

const DashboardContent = () => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('Loading...');

  // Fetch opportunities from the API
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const response = await fetch('/api/opportunities/index?limit=10');
        const data = await response.json();
        
        if (data.opportunities) {
          setOpportunities(data.opportunities);
          setLastUpdated(new Date().toLocaleTimeString());
        }
      } catch (error) {
        console.error('Error fetching opportunities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, []);

  // Calculate upcoming deadlines
  const upcomingDeadlines = opportunities
    .filter(opp => opp.deadline)
    .sort((a, b) => {
      const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return dateA - dateB;
    })
    .slice(0, 3);

  // Format date for display
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'No deadline';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Calculate days until deadline
  const daysUntil = (date: Date | string | null | undefined) => {
    if (!date) return '';
    const now = new Date();
    const deadlineDate = new Date(date);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 0 ? 'Today' : `${diffDays} days`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Badge variant="outline" className="bg-primary/10 text-primary">
          <ClockIcon className="mr-1 h-3 w-3" />
          Last updated: {lastUpdated}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Opportunities
            </CardTitle>
            <AwardIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : opportunities.length}</div>
            <p className="text-xs text-muted-foreground">
              Explore opportunities
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Applications
            </CardTitle>
            <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Start applying today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Profile Completion
            </CardTitle>
            <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user ? '50%' : '0%'}</div>
            <Progress value={user ? 50 : 0} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Deadlines
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingDeadlines.length}</div>
            {upcomingDeadlines.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Next: {upcomingDeadlines[0].title.substring(0, 20)}... ({daysUntil(upcomingDeadlines[0].deadline)})
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="opportunities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>
        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading opportunities...</div>
              ) : opportunities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No opportunities available yet.</p>
                  <p className="mt-2">
                    <Link href="/dashboard/create-opportunity" className="text-primary hover:underline">
                      Create your first opportunity
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {opportunities.slice(0, 5).map((opportunity) => (
                    <Link 
                      href={`/dashboard/opportunities/${opportunity.id}`} 
                      key={opportunity.id}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <div>
                          <h3 className="font-medium">{opportunity.title}</h3>
                          <p className="text-sm text-muted-foreground">{opportunity.provider}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {opportunity.deadline && (
                            <div className="text-sm text-right">
                              <div className="text-muted-foreground">Deadline</div>
                              <div>{formatDate(opportunity.deadline)}</div>
                            </div>
                          )}
                          <Badge variant="outline">{opportunity.type}</Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {opportunities.length > 5 && (
                    <div className="text-center pt-2">
                      <Link href="/dashboard/explore" className="text-primary hover:underline">
                        View all opportunities
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">You haven't submitted any applications yet.</p>
                <p className="mt-2">
                  <Link href="/dashboard/explore" className="text-primary hover:underline">
                    Explore opportunities
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommended For You</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Complete your profile to get personalized recommendations.
                </p>
                <p className="mt-2">
                  <Link href="/dashboard/profile" className="text-primary hover:underline">
                    Update your profile
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardContent;