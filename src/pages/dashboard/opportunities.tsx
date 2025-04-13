import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarIcon,
  MapPinIcon,
  PlusCircleIcon,
  FilterIcon,
  Loader2,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import DashboardSidebar from "@/components/DashboardSidebar";
import ChatInterface from "@/components/ChatInterface";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getAuth } from "firebase/auth";
import { Timestamp } from "firebase/firestore";
type Opportunity = {
  id: string;
  title: string;
  description: string;
  provider: string;
  creatorType: string;
  type: string;
  tags: string[];
  deadline: string | null;
  location: string | null;
  eligibility: string | null;
  funding: string | null;
  url: string | null;
  createdAt: Timestamp;
  updatedAt: string;
  userId: string;
  createdBy: {
    email: string;
  };
};

type PaginationInfo = {
  total: number;
  pages: number;
  page: number;
  limit: number;
};

function OpportunitiesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    pages: 0,
    page: 1,
    limit: 6,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");

  const getAuthToken = async () => {
    if (user) {
      try {
        const token = await user.getIdToken();
        return token;
      } catch (error) {
        console.error("Error getting token", error);
        return null;
      }
    }
    return null;
  };
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchOpportunities();
  }, [pagination.page, filter, debouncedSearchQuery]);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        creator: "true", // Add creator=true to fetch only opportunities created by the current user
      });

      if (filter !== "all") {
        queryParams.append("type", filter);
      }

      if (debouncedSearchQuery) {
        queryParams.append("search", debouncedSearchQuery);
      }
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (currentUser) {
        console.log("currentuser", currentUser);
      }
      if (!currentUser) return;
      const token = await currentUser.getIdToken().catch((err) => {
        console.error("Error getting token:", err);
        return null;
      });

      if (!token) return;

      console.log(
        "Fetching opportunities with params:",
        queryParams.toString()
      );
      const response = await fetch(
        `/api/opportunities?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch opportunities");
      }

      const data = await response.json();
      console.log("Fetched opportunities data:", data);

      if (Array.isArray(data.opportunities)) {
        setOpportunities(data.opportunities);
        setPagination(data.pagination);
      } else {
        console.error("Invalid opportunities data format:", data);
        setOpportunities([]);
      }
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const renderPostedDate = (createdAt: any) => {
    // Check if createdAt has the _seconds property
    if (createdAt && createdAt._seconds) {
      // Convert _seconds to milliseconds and create a Date object
      const date = new Date(createdAt._seconds * 1000);
      return format(date, "MMM d, yyyy");
    }

    // If createdAt is invalid or missing _seconds, return a fallback message
    return "No date";
  };
  const OpportunitiesContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Opportunities</h1>
        <Button asChild>
          <Link href="/dashboard/create-opportunity">
            <PlusCircleIcon className="mr-2 h-4 w-4" />
            Create Opportunity
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Only show search for organizations, no filters needed */}
        <div className="flex items-center gap-2 w-full">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your opportunities..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : opportunities.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {debouncedSearchQuery
                ? "No opportunities found matching your search criteria"
                : "No opportunities found"}
            </p>
            <Button asChild>
              <Link href="/dashboard/create-opportunity">
                <PlusCircleIcon className="mr-2 h-4 w-4" />
                Create Your First Opportunity
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opportunity) => (
            <Card
              key={opportunity.id}
              className="flex flex-col h-full hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl line-clamp-2">
                    {opportunity.title}
                  </CardTitle>
                  <Badge>{opportunity.type}</Badge>
                </div>
                <CardDescription>{opportunity.provider}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {opportunity.description}
                </p>

                {/* Display tags */}
                {opportunity.tags && opportunity.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {opportunity.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  {opportunity.deadline && (
                    <div className="flex items-center text-sm">
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>
                        Deadline:{" "}
                        {format(new Date(opportunity.deadline), "PPP")}
                      </span>
                    </div>
                  )}
                  {opportunity.location && (
                    <div className="flex items-center text-sm">
                      <MapPinIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{opportunity.location}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <div className="text-xs text-muted-foreground">
                  Posted: {renderPostedDate(opportunity.createdAt)}
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/opportunities/${opportunity.id}`}>
                    View Details
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() =>
                  handlePageChange(Math.max(1, pagination.page - 1))
                }
                className={
                  pagination.page <= 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
              (page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => handlePageChange(page)}
                    isActive={pagination.page === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  handlePageChange(
                    Math.min(pagination.pages, pagination.page + 1)
                  )
                }
                className={
                  pagination.page >= pagination.pages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );

  return (
    <ProtectedRoute>
      <Head>
        <title>Opportunities | Astra</title>
        <meta
          name="description"
          content="Manage and explore opportunities on Astra"
        />
      </Head>

      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            <OpportunitiesContent />
          </div>

          {/* Chat Interface */}
          <div className="w-96 h-full">
            <ChatInterface />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default OpportunitiesPage;
