import React from 'react';
import Head from 'next/head';
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardSidebar from "@/components/DashboardSidebar";
import GPTChatInterface from "@/components/GPTChatInterface";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, Mail, MessageSquare, FileText, HelpCircle } from "lucide-react";

export default function Help() {
  return (
    <ProtectedRoute>
      <Head>
        <title>Help & Support | Astra</title>
        <meta name="description" content="Get help and support" />
      </Head>
      
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            <div className="space-y-6">
              <h1 className="text-2xl font-bold tracking-tight">Help & Support</h1>
              
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Input placeholder="Search for help topics..." />
                </div>
                <Button>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
              
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Chat Support
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Chat with our AI assistant or request human support.
                    </p>
                    <Button variant="outline" className="w-full">
                      Start Chat
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-primary" />
                      Email Support
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Send us an email and we'll get back to you within 24 hours.
                    </p>
                    <Button variant="outline" className="w-full">
                      Contact Us
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Documentation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Browse our comprehensive documentation and guides.
                    </p>
                    <Button variant="outline" className="w-full">
                      View Docs
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                  <CardDescription>
                    Find quick answers to common questions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>How does Astra match me with opportunities?</AccordionTrigger>
                      <AccordionContent>
                        Astra uses AI to analyze your profile, preferences, and needs, then matches you with relevant programs from government, corporate, and NGO sources. The more complete your profile, the better the matches will be.
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-2">
                      <AccordionTrigger>How do I apply for a program?</AccordionTrigger>
                      <AccordionContent>
                        Once you find a program you're interested in, click on it to view details. From there, you can start the application process. Astra will guide you through each step, and you can save your progress and return later.
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-3">
                      <AccordionTrigger>Is my personal information secure?</AccordionTrigger>
                      <AccordionContent>
                        Yes, we take data security seriously. Your information is encrypted and only shared with program providers when you explicitly apply to their opportunities. You can manage your privacy settings in your account.
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-4">
                      <AccordionTrigger>Can I use Astra on my mobile device?</AccordionTrigger>
                      <AccordionContent>
                        Yes, Astra is fully responsive and works on smartphones, tablets, and desktop computers. You can access all features from any device with a web browser.
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-5">
                      <AccordionTrigger>How do I track my applications?</AccordionTrigger>
                      <AccordionContent>
                        You can view and track all your applications in the Applications section of your dashboard. This shows the status of each application, upcoming deadlines, and any required actions.
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-6">
                      <AccordionTrigger>What should I do if I need help with an application?</AccordionTrigger>
                      <AccordionContent>
                        You can use the chat assistant on the right side of your dashboard to get immediate help. For more complex issues, you can request human support through the Help & Support page.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
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