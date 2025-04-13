import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardSidebar from "@/components/DashboardSidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Loader2, Plus } from "lucide-react";
import GPTAssistedForm from "@/components/GPTAssistedForm";
import { getAuth } from "firebase/auth";

function CreateOpportunityPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  // Define initial form data with base fields
  const [formData, setFormData] = useState({
    title: "",
    provider: "",
    description: "",
    type: "Government",
    eligibility: "",
    creatorType: "individual",
    // Custom fields will be stored here
    customFields: [] as { name: string; value: string }[],
  });

  // Track form completion status for each step
  const [stepCompletion, setStepCompletion] = useState({
    1: false, // Title
    2: false, // Provider
    3: false, // Description
    4: false, // Type
    5: false, // Eligibility
    6: false, // Custom fields
  });

  // Determine total steps based on whether custom fields are added
  const [totalSteps, setTotalSteps] = useState(5);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data and track completion status
  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Update step completion status based on field
    if (field === "title" && value.trim()) {
      setStepCompletion((prev) => ({ ...prev, 1: true }));
    } else if (field === "provider" && value.trim()) {
      setStepCompletion((prev) => ({ ...prev, 2: true }));
    } else if (field === "description" && value.trim()) {
      setStepCompletion((prev) => ({ ...prev, 3: true }));
    } else if (field === "type" && value.trim()) {
      setStepCompletion((prev) => ({ ...prev, 4: true }));
    } else if (field === "eligibility" && value.trim()) {
      setStepCompletion((prev) => ({ ...prev, 5: true }));
    }

    // If adding custom fields, update total steps
    if (field === "customFields" && Array.isArray(value) && value.length > 0) {
      setTotalSteps(6); // Add custom fields step
      setStepCompletion((prev) => ({ ...prev, 6: true }));
    }
  };

  // Add a new custom field
  const addCustomField = (name: string, value: string) => {
    if (!name.trim()) return;

    setFormData((prev) => ({
      ...prev,
      customFields: [...prev.customFields, { name, value }],
    }));

    // If this is the first custom field, update total steps
    if (formData.customFields.length === 0) {
      setTotalSteps(6);
    }

    setStepCompletion((prev) => ({ ...prev, 6: true }));
  };

  // Remove a custom field
  const removeCustomField = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index),
    }));

    // If no more custom fields, update step completion and total steps
    if (formData.customFields.length <= 1) {
      setTotalSteps(5);
      setStepCompletion((prev) => ({ ...prev, 6: false }));
    }
  };

  // Removed auto-advance effect that was causing steps to skip automatically
  // Now users will need to click the Next button to advance to the next step

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create an opportunity.",
        variant: "destructive",
      });
      return;
    }

    // Validate form data
    if (
      !formData.title ||
      !formData.provider ||
      !formData.description ||
      !formData.type
    ) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare the data
      const opportunityData = {
        ...formData,
        // Add any additional default values needed
        hasFunding: false,
        whoCanApply: [],
        requiredDocuments: [],
      };


      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const token = await currentUser.getIdToken().catch((err) => {
        console.error("Error getting token:", err);
        return null;
      });

      if (!token) return;

      // Submit the opportunity
      const response = await fetch("/api/opportunities", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(opportunityData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create opportunity");
      }

      toast({
        title: "Success!",
        description: "Your opportunity has been created successfully.",
      });

      // Redirect to opportunities page
      router.push("/dashboard/opportunities");
    } catch (error) {
      console.error("Error creating opportunity:", error);

      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create opportunity",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get step title based on current step
  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Opportunity Title";
      case 2:
        return "Provider Information";
      case 3:
        return "Opportunity Description";
      case 4:
        return "Opportunity Type";
      case 5:
        return "Eligibility Criteria";
      case 6:
        return "Additional Fields";
      default:
        return "Create Opportunity";
    }
  };

  // Get step description based on current step
  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return "Give your opportunity a clear, descriptive title.";
      case 2:
        return "Who is providing this opportunity?";
      case 3:
        return "Describe what this opportunity offers to applicants.";
      case 4:
        return "Categorize your opportunity.";
      case 5:
        return "Specify who can apply for this opportunity.";
      case 6:
        return "Add any additional fields or requirements.";
      default:
        return "Fill in the details for your opportunity.";
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Create Opportunity | Astra</title>
        <meta name="description" content="Create a new opportunity on Astra" />
      </Head>

      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">
                  Create Opportunity
                </h1>
              </div>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>{getStepTitle()}</CardTitle>
                  <CardDescription>{getStepDescription()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress
                    value={(currentStep / totalSteps) * 100}
                    className="mb-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    Step {currentStep} of {totalSteps}
                  </p>

                  {/* Form fields based on current step */}
                  <div className="mt-6 space-y-4">
                    {currentStep === 1 && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">Title</h3>
                        <Input
                          value={formData.title}
                          onChange={(e) =>
                            updateFormData("title", e.target.value)
                          }
                          placeholder="Enter opportunity title"
                          className="w-full"
                        />
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">Provider</h3>
                        <Input
                          value={formData.provider}
                          onChange={(e) =>
                            updateFormData("provider", e.target.value)
                          }
                          placeholder="Enter provider name"
                          className="w-full"
                        />
                      </div>
                    )}

                    {currentStep === 3 && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">
                          Description
                        </h3>
                        <Textarea
                          value={formData.description}
                          onChange={(e) =>
                            updateFormData("description", e.target.value)
                          }
                          placeholder="Describe the opportunity"
                          className="w-full min-h-[150px]"
                        />
                      </div>
                    )}

                    {currentStep === 4 && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">Type</h3>
                        <Select
                          value={formData.type}
                          onValueChange={(value) =>
                            updateFormData("type", value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select opportunity type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Government">
                              Government
                            </SelectItem>
                            <SelectItem value="NGO">NGO</SelectItem>
                            <SelectItem value="Corporate">Corporate</SelectItem>
                            <SelectItem value="Educational">
                              Educational
                            </SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {currentStep === 5 && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">
                          Eligibility Criteria
                        </h3>
                        <Textarea
                          value={formData.eligibility}
                          onChange={(e) =>
                            updateFormData("eligibility", e.target.value)
                          }
                          placeholder="Who can apply for this opportunity?"
                          className="w-full min-h-[150px]"
                        />
                      </div>
                    )}

                    {currentStep === 6 && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">
                          Additional Fields
                        </h3>

                        {formData.customFields.length > 0 && (
                          <div className="space-y-3">
                            {formData.customFields.map((field, index) => (
                              <div
                                key={index}
                                className="flex items-start gap-2 p-3 border rounded-md"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-medium">
                                    {field.name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {field.value}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeCustomField(index)}
                                  className="text-destructive"
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">
                              Use the chat assistant to add custom fields to
                              your opportunity.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation buttons */}
                  <div className="flex justify-between mt-6">
                    <Button
                      variant="outline"
                      onClick={handlePrevStep}
                      disabled={currentStep === 1 || isSubmitting}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>

                    {currentStep < totalSteps ? (
                      <Button
                        onClick={handleNextStep}
                        disabled={
                          isSubmitting ||
                          !stepCompletion[
                            currentStep as keyof typeof stepCompletion
                          ]
                        }
                      >
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Opportunity"
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* GPT Assistant */}
          <div className="w-96 h-full">
            <GPTAssistedForm
              onFormUpdate={updateFormData}
              formData={formData}
              currentStep={currentStep}
              totalSteps={totalSteps}
              onNextStep={handleNextStep}
              onPrevStep={handlePrevStep}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default CreateOpportunityPage;
