import React, { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardSidebar from "@/components/DashboardSidebar";
import EnhancedChatInterface from "@/components/EnhancedChatInterface";
import SwipeCard, { Opportunity } from "@/components/SwipeCard";
import OpportunityFilters, {
  FilterOptions,
} from "@/components/OpportunityFilters";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Heart, X, MessageSquare, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getAuth } from "firebase/auth";

export default function Explore() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    type: "",
    location: "",
    hasDeadline: false,
    hasFunding: false,
  });
  const [opportunityTypes, setOpportunityTypes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"swipe" | "chat">("swipe");
  const [likedOpportunities, setLikedOpportunities] = useState<Opportunity[]>(
    []
  );
  const [dislikedOpportunities, setDislikedOpportunities] = useState<string[]>(
    []
  );

  const fetchOpportunities = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) return;

    setLoading(true);
    try {
      const token = await currentUser.getIdToken();

      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.type) params.append("type", filters.type);
      if (filters.location) params.append("location", filters.location);
      if (filters.hasDeadline) params.append("hasDeadline", "true");
      if (filters.hasFunding) params.append("hasFunding", "true");
      params.append("random", "true");
      params.append("limit", "10");

      const response = await fetch(`/api/opportunities?${params.toString()}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        const filteredOpportunities = data.opportunities.filter(
          (opp: Opportunity) =>
            !likedOpportunities.some((liked) => liked.id === opp.id) &&
            !dislikedOpportunities.includes(opp.id)
        );

        setOpportunities(filteredOpportunities);
        setCurrentIndex(0);

        if (data.filters?.types) {
          setOpportunityTypes(data.filters.types);
        }
      } else {
        console.error("Failed to fetch opportunities:", data.message);
        toast({
          title: "Error",
          description: "Failed to load opportunities. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (user) {
      fetchOpportunities();
    }
  }, [user, filters, likedOpportunities, dislikedOpportunities, toast]);
  // Initial fetch
  // useEffect(() => {
  //   fetchOpportunities();
  // }, [fetchOpportunities]);

  // Handle swipe action
  const handleSwipe = (
    direction: "left" | "right",
    opportunity: Opportunity
  ) => {
    if (direction === "right") {
      // Like
      setLikedOpportunities((prev) => [...prev, opportunity]);
      toast({
        title: "Opportunity Liked",
        description: `You liked "${opportunity.title}"`,
      });
    } else {
      // Dislike
      setDislikedOpportunities((prev) => [...prev, opportunity.id]);
    }

    // Move to next card
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);

      // If we've reached the end of the current batch, fetch more
      if (currentIndex >= opportunities.length - 1) {
        fetchOpportunities();
      }
    }, 300);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  // Handle AI suggestions
  const handleSuggestedOpportunities = (suggestedOpps: Opportunity[]) => {
    // Filter out opportunities that are already in the current deck
    const newOpps = suggestedOpps.filter(
      (sugg) =>
        !opportunities.some((opp) => opp.id === sugg.id) &&
        !likedOpportunities.some((opp) => opp.id === sugg.id) &&
        !dislikedOpportunities.includes(sugg.id)
    );

    if (newOpps.length > 0) {
      setOpportunities((prev) => [...newOpps, ...prev]);
      setCurrentIndex(0);
      setActiveTab("swipe");

      toast({
        title: "New Opportunities Found",
        description: `${newOpps.length} new opportunities based on your conversation`,
      });
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Explore | Astra</title>
        <meta name="description" content="Explore opportunities in a new way" />
      </Head>

      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 pb-0">
            <h1 className="text-2xl font-bold tracking-tight mb-4">
              Explore Opportunities
            </h1>

            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as "swipe" | "chat")}
              className="w-full"
            >
              <div className="flex justify-between items-center">
                <TabsList>
                  <TabsTrigger
                    value="swipe"
                    className="flex items-center gap-2"
                  >
                    <Heart className="h-4 w-4" />
                    Swipe
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Chat
                  </TabsTrigger>
                </TabsList>

                {activeTab === "swipe" && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchOpportunities}
                      disabled={loading}
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-2 ${
                          loading ? "animate-spin" : ""
                        }`}
                      />
                      Refresh
                    </Button>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              <TabsContent value="swipe" className="mt-0 flex-1 flex flex-col">
                {/* Only show filters for applicants */}
                {user?.activeRole !== "organization" && (
                  <OpportunityFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onSearch={fetchOpportunities}
                    opportunityTypes={opportunityTypes}
                  />
                )}

                <div className="flex-1 flex mt-6">
                  <div className="flex-1 flex justify-center">
                    <div className="relative w-full max-w-md h-[500px]">
                      {opportunities.length > 0 ? (
                        opportunities.map((opportunity, index) => (
                          <SwipeCard
                            key={opportunity.id}
                            opportunity={opportunity}
                            onSwipe={handleSwipe}
                            active={index === currentIndex}
                          />
                        ))
                      ) : loading ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 text-center">
                          <h3 className="text-lg font-medium mb-2">
                            No more opportunities
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            You've seen all opportunities matching your filters.
                          </p>
                          <Button onClick={fetchOpportunities}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Find More
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {opportunities.length > 0 &&
                    currentIndex < opportunities.length && (
                      <div className="w-96 border-l border-border">
                        <div className="p-4 h-full overflow-auto">
                          <h3 className="text-lg font-bold mb-2">
                            {opportunities[currentIndex].title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            {opportunities[currentIndex].provider}
                          </p>

                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium mb-1">
                                Description
                              </h4>
                              <p className="text-sm">
                                {opportunities[currentIndex].description}
                              </p>
                            </div>

                            {opportunities[currentIndex].eligibility && (
                              <div>
                                <h4 className="text-sm font-medium mb-1">
                                  Eligibility
                                </h4>
                                <p className="text-sm">
                                  {opportunities[currentIndex].eligibility}
                                </p>
                              </div>
                            )}

                            {opportunities[currentIndex].funding && (
                              <div>
                                <h4 className="text-sm font-medium mb-1">
                                  Funding
                                </h4>
                                <p className="text-sm">
                                  {opportunities[currentIndex].funding}
                                </p>
                              </div>
                            )}

                            <div className="flex flex-col gap-2 pt-4">
                              <Link
                                href={`/dashboard/opportunities/${opportunities[currentIndex].id}`}
                                className="w-full"
                              >
                                <Button className="w-full">
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Apply Now
                                </Button>
                              </Link>

                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  className="flex-1 border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white"
                                  onClick={() =>
                                    handleSwipe(
                                      "left",
                                      opportunities[currentIndex]
                                    )
                                  }
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Skip
                                </Button>
                                <Button
                                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                                  onClick={() =>
                                    handleSwipe(
                                      "right",
                                      opportunities[currentIndex]
                                    )
                                  }
                                >
                                  <Heart className="h-4 w-4 mr-2" />
                                  Like
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </TabsContent>

              <TabsContent value="chat" className="mt-0 flex-1 h-full">
                <div className="h-[calc(100vh-220px)]">
                  <EnhancedChatInterface
                    opportunities={[...opportunities, ...likedOpportunities]}
                    onSuggestOpportunities={handleSuggestedOpportunities}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
