import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from "@/contexts/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, ArrowLeft, PlusCircle, X, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardSidebar from "@/components/DashboardSidebar";

const formSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  description: z.string().min(20, {
    message: "Description must be at least 20 characters.",
  }),
  provider: z.string().min(2, {
    message: "Provider name is required.",
  }),
  creatorType: z.enum(["individual", "agency", "company"], {
    required_error: "Please select who you are creating this opportunity as.",
  }),
  type: z.enum(["Government", "NGO", "Corporate", "Educational", "Other"], {
    required_error: "Please select the type of opportunity.",
  }),
  deadline: z.date().optional(),
  location: z.string().optional(),
  eligibility: z.string().optional(),
  funding: z.string().optional(),
  url: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

function EditOpportunityPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      provider: "",
      creatorType: "individual",
      type: "Government",
      location: "",
      eligibility: "",
      funding: "",
      url: "",
    },
  });

  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchOpportunity(id);
    }
  }, [id]);

  const fetchOpportunity = async (opportunityId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/opportunities/${opportunityId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch opportunity');
      }

      const opportunity = await response.json();
      
      // Check if the current user is the creator of this opportunity
      if (user && opportunity.userId !== user.id) {
        setError("You don't have permission to edit this opportunity");
        return;
      }

      // Format the data for the form
      form.reset({
        title: opportunity.title,
        description: opportunity.description,
        provider: opportunity.provider,
        creatorType: opportunity.creatorType,
        type: opportunity.type,
        deadline: opportunity.deadline ? new Date(opportunity.deadline) : undefined,
        location: opportunity.location || "",
        eligibility: opportunity.eligibility || "",
        funding: opportunity.funding || "",
        url: opportunity.url || "",
      });
    } catch (error) {
      console.error('Error fetching opportunity:', error);
      setError('Failed to load opportunity details');
    } finally {
      setIsLoading(false);
    }
  };

  async function onSubmit(values: FormValues) {
    if (!user || !id) {
      toast({
        title: "Error",
        description: "Authentication required or invalid opportunity ID",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/opportunities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update opportunity');
      }

      toast({
        title: "Opportunity updated",
        description: "Your opportunity has been successfully updated.",
      });
      
      router.push(`/dashboard/opportunities/${id}`);
    } catch (error) {
      console.error('Error updating opportunity:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update opportunity",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto py-12 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto py-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </ProtectedRoute>
    );
  }

  // State for custom fields
  const [customFields, setCustomFields] = useState<{name: string; value: string}[]>([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [isSavingCustomFields, setIsSavingCustomFields] = useState(false);
  const [isLoadingCustomFields, setIsLoadingCustomFields] = useState(false);
  
  // Check if we should show the add fields tab
  useEffect(() => {
    if (router.query.addFields === 'true') {
      setActiveTab('advanced');
    }
  }, [router.query]);
  
  // Fetch custom fields when the component mounts
  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchCustomFields(id);
    }
  }, [id]);
  
  const fetchCustomFields = async (opportunityId: string) => {
    setIsLoadingCustomFields(true);
    try {
      const response = await fetch(`/api/opportunities/${opportunityId}/custom-fields`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch custom fields');
      }

      const data = await response.json();
      
      if (data.customFields && Array.isArray(data.customFields)) {
        setCustomFields(data.customFields);
      }
    } catch (error) {
      console.error('Error fetching custom fields:', error);
      toast({
        title: "Error",
        description: "Failed to load custom fields",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCustomFields(false);
    }
  };
  
  // Function to add a new custom field
  const addCustomField = () => {
    if (!newFieldName.trim()) {
      toast({
        title: "Error",
        description: "Field name is required",
        variant: "destructive",
      });
      return;
    }
    
    setCustomFields([...customFields, { name: newFieldName, value: newFieldValue }]);
    setNewFieldName('');
    setNewFieldValue('');
  };
  
  // Function to remove a custom field
  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };
  
  // Function to save custom fields
  const saveCustomFields = async () => {
    if (!id || !user) {
      toast({
        title: "Error",
        description: "Authentication required or invalid opportunity ID",
        variant: "destructive",
      });
      return;
    }
    
    setIsSavingCustomFields(true);
    
    try {
      // We'll use a different endpoint or parameter to update custom fields
      const response = await fetch(`/api/opportunities/${id}/custom-fields`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customFields }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update custom fields');
      }
      
      toast({
        title: "Custom fields updated",
        description: "Your opportunity's custom fields have been successfully updated.",
      });
      
    } catch (error) {
      console.error('Error updating custom fields:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update custom fields",
        variant: "destructive",
      });
    } finally {
      setIsSavingCustomFields(false);
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Edit Opportunity | Astra</title>
        <meta name="description" content="Edit your opportunity details" />
      </Head>
      
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar />
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="container py-6 space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => router.back()} className="mb-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <h1 className="text-2xl font-bold tracking-tight">Edit Opportunity</h1>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="advanced">Advanced Fields</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Edit Opportunity Details</CardTitle>
                    <CardDescription>
                      Update the basic details of your opportunity.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="creatorType"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>I am creating this opportunity as:</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  className="flex flex-col space-y-1"
                                >
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="individual" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      An Individual
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="agency" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      A Government Agency
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="company" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      A Company or Organization
                                    </FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter opportunity title" {...field} />
                                </FormControl>
                                <FormDescription>
                                  A clear, concise title for your opportunity.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="provider"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Provider</FormLabel>
                                <FormControl>
                                  <Input placeholder="Organization providing this opportunity" {...field} />
                                </FormControl>
                                <FormDescription>
                                  The name of the organization offering this opportunity.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe the opportunity in detail" 
                                  className="min-h-[120px]" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Provide a detailed description of the opportunity.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Opportunity Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Government">Government</SelectItem>
                                    <SelectItem value="NGO">NGO</SelectItem>
                                    <SelectItem value="Corporate">Corporate</SelectItem>
                                    <SelectItem value="Educational">Educational</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  The category this opportunity falls under.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="deadline"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Application Deadline</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                                      >
                                        {field.value ? (
                                          format(field.value, "PPP")
                                        ) : (
                                          <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      disabled={(date) => date < new Date()}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormDescription>
                                  The last date to apply for this opportunity (optional).
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Location</FormLabel>
                                <FormControl>
                                  <Input placeholder="Location (if applicable)" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Where this opportunity is available (optional).
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="url"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Website URL</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://example.com" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Link to more information (optional).
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="eligibility"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Eligibility Criteria</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Who is eligible for this opportunity?" 
                                  className="min-h-[80px]" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Describe who can apply for this opportunity (optional).
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="funding"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Funding Details</FormLabel>
                              <FormControl>
                                <Input placeholder="Amount or funding details" {...field} />
                              </FormControl>
                              <FormDescription>
                                Funding amount or details (optional).
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            "Update Opportunity"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="advanced" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Advanced Fields</CardTitle>
                    <CardDescription>
                      Add custom fields to provide more detailed information about your opportunity.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Current Custom Fields</h3>
                      
                      {customFields.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No custom fields added yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {customFields.map((field, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                              <div>
                                <p className="font-medium">{field.name}</p>
                                <p className="text-sm text-muted-foreground">{field.value}</p>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeCustomField(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Add New Field</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Field Name</label>
                          <Input 
                            placeholder="e.g., Application Process" 
                            value={newFieldName}
                            onChange={(e) => setNewFieldName(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Field Value</label>
                          <Input 
                            placeholder="e.g., Submit resume and cover letter" 
                            value={newFieldValue}
                            onChange={(e) => setNewFieldValue(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <Button 
                        onClick={addCustomField}
                        className="w-full"
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Field
                      </Button>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('basic')}
                    >
                      Back to Basic Information
                    </Button>
                    
                    <Button 
                      onClick={saveCustomFields}
                      disabled={customFields.length === 0 || isSavingCustomFields}
                    >
                      {isSavingCustomFields ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Custom Fields
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default EditOpportunityPage;