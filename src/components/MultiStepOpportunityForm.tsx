import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Loader2, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import GPTAssistedForm from './GPTAssistedForm';

interface MultiStepOpportunityFormProps {
  onComplete?: () => void;
}

const MultiStepOpportunityForm: React.FC<MultiStepOpportunityFormProps> = ({ onComplete }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    provider: '',
    description: '',
    type: 'Government', // Default value
    tags: [] as string[], // Array of tags like "jobs", "grants", "scholarships", etc.
    eligibility: '',
    creatorType: 'individual', // Default value
  });
  
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
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
    if (!formData.title || !formData.provider || !formData.description || !formData.type) {
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
      
      console.log('Submitting opportunity:', opportunityData);
      
      // Submit the opportunity
      const response = await fetch('/api/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(opportunityData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create opportunity');
      }
      
      const result = await response.json();
      
      toast({
        title: "Success!",
        description: "Your opportunity has been created successfully.",
      });
      
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete();
      }
      
      // Redirect to opportunities page
      router.push('/dashboard/opportunities');
      
    } catch (error) {
      console.error('Error creating opportunity:', error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create opportunity",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Opportunity Title";
      case 2: return "Provider Information";
      case 3: return "Opportunity Description";
      case 4: return "Opportunity Type";
      case 5: return "Opportunity Tags";
      case 6: return "Eligibility Criteria";
      default: return "Create Opportunity";
    }
  };
  
  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return "Give your opportunity a clear, descriptive title.";
      case 2: return "Who is providing this opportunity?";
      case 3: return "Describe what this opportunity offers to applicants.";
      case 4: return "Categorize your opportunity.";
      case 5: return "Add tags to help applicants find your opportunity.";
      case 6: return "Specify who can apply for this opportunity.";
      default: return "Fill in the details for your opportunity.";
    }
  };
  
  // Available tags for selection
  const availableTags = [
    "jobs", 
    "grants", 
    "scholarships", 
    "mentorships", 
    "internships", 
    "fellowships", 
    "training", 
    "volunteering", 
    "research", 
    "competitions"
  ];
  
  // Function to handle tag selection
  const handleTagToggle = (tag: string) => {
    setFormData(prev => {
      const currentTags = [...prev.tags];
      if (currentTags.includes(tag)) {
        return { ...prev, tags: currentTags.filter(t => t !== tag) };
      } else {
        return { ...prev, tags: [...currentTags, tag] };
      }
    });
  };
  
  // Function to add a custom tag
  const [customTag, setCustomTag] = useState('');
  
  const handleAddCustomTag = () => {
    if (customTag.trim() && !formData.tags.includes(customTag.trim().toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, customTag.trim().toLowerCase()]
      }));
      setCustomTag('');
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{getStepTitle()}</CardTitle>
          <CardDescription>{getStepDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={(currentStep / totalSteps) * 100} className="mb-2" />
          <p className="text-sm text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </p>
          
          {/* Form inputs based on current step */}
          <div className="mt-6 space-y-4">
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-1">
                    Opportunity Title <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="title"
                    placeholder="Enter a clear, descriptive title"
                    value={formData.title}
                    onChange={(e) => updateFormData('title', e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
            
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="provider" className="block text-sm font-medium mb-1">
                    Provider Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="provider"
                    placeholder="Who is providing this opportunity?"
                    value={formData.provider}
                    onChange={(e) => updateFormData('provider', e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="creatorType" className="block text-sm font-medium mb-1">
                    Provider Type <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={formData.creatorType}
                    onValueChange={(value) => updateFormData('creatorType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="agency">Agency</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-1">
                    Description <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this opportunity offers to applicants"
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    rows={6}
                    required
                  />
                </div>
              </div>
            )}
            
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium mb-1">
                    Opportunity Type <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => updateFormData('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select opportunity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Government">Government</SelectItem>
                      <SelectItem value="NGO">NGO</SelectItem>
                      <SelectItem value="Corporate">Corporate</SelectItem>
                      <SelectItem value="Academic">Academic</SelectItem>
                      <SelectItem value="Community">Community</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select Tags (Choose all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {availableTags.map((tag) => (
                      <Badge 
                        key={tag}
                        variant={formData.tags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer text-sm py-1 px-3"
                        onClick={() => handleTagToggle(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Add Custom Tag
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter custom tag"
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      onClick={handleAddCustomTag}
                      disabled={!customTag.trim()}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
                
                {formData.tags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Selected Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <Badge 
                          key={tag}
                          variant="default"
                          className="flex items-center gap-1"
                        >
                          {tag}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => handleTagToggle(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {currentStep === 6 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="eligibility" className="block text-sm font-medium mb-1">
                    Eligibility Criteria
                  </label>
                  <Textarea
                    id="eligibility"
                    placeholder="Specify who can apply for this opportunity"
                    value={formData.eligibility}
                    onChange={(e) => updateFormData('eligibility', e.target.value)}
                    rows={6}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Form preview */}
          <div className="mt-8 pt-4 border-t">
            <h3 className="text-sm font-medium mb-2">Preview</h3>
            <div className="p-4 border rounded-md bg-muted/30">
              {currentStep === 1 && (
                <div>
                  <h3 className="font-medium mb-2">Title</h3>
                  <p className="text-sm">{formData.title || "(Not yet provided)"}</p>
                </div>
              )}
              
              {currentStep === 2 && (
                <div>
                  <h3 className="font-medium mb-2">Provider</h3>
                  <p className="text-sm">{formData.provider || "(Not yet provided)"}</p>
                  <p className="text-sm text-muted-foreground mt-1">Type: {formData.creatorType}</p>
                </div>
              )}
              
              {currentStep === 3 && (
                <div>
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-sm">{formData.description || "(Not yet provided)"}</p>
                </div>
              )}
              
              {currentStep === 4 && (
                <div>
                  <h3 className="font-medium mb-2">Type</h3>
                  <p className="text-sm">{formData.type || "(Not yet provided)"}</p>
                </div>
              )}
              
              {currentStep === 5 && (
                <div>
                  <h3 className="font-medium mb-2">Tags</h3>
                  {formData.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">(No tags selected)</p>
                  )}
                </div>
              )}
              
              {currentStep === 6 && (
                <div>
                  <h3 className="font-medium mb-2">Eligibility</h3>
                  <p className="text-sm">{formData.eligibility || "(Not yet provided)"}</p>
                </div>
              )}
            </div>
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
                disabled={isSubmitting}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
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
  );
};

export default MultiStepOpportunityForm;