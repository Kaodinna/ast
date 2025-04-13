import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardSidebar from "@/components/DashboardSidebar";
import ApplicantDashboard from "@/components/ApplicantDashboard";
import OrganizationDashboard from "@/components/OrganizationDashboard";
import GPTChatInterface from "@/components/GPTChatInterface";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { user, userRole } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isComponentReady, setIsComponentReady] = useState(false);

  // Determine which dashboard to show based on user role
  const DashboardComponent =
    userRole === "organization" ? OrganizationDashboard : ApplicantDashboard;

  // Add a useEffect to handle loading state
  useEffect(() => {
    if (user) {
      // Add a small delay to ensure components are properly initialized
      const timer = setTimeout(() => {
        setIsLoading(false);
        // Add another small delay before showing the component to prevent flickering
        setTimeout(() => {
          setIsComponentReady(true);
        }, 100);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [user]);

  return (
    <ProtectedRoute>
      <Head>
        <title>
          {userRole === "organization"
            ? "Organization Dashboard"
            : "Applicant Dashboard"}{" "}
          | Astra
        </title>
        <meta
          name="description"
          content={
            userRole === "organization"
              ? "Manage your opportunities and applications"
              : "Your personalized dashboard for opportunity matching"
          }
        />
      </Head>

      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            {isLoading || !userRole ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isComponentReady ? (
              <DashboardComponent />
            ) : null}
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
