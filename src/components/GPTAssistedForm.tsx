import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, ArrowRight, Loader2, Plus, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Message = {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  formField?: {
    name: string;
    value: string | string[] | boolean | Date | null;
  };
};

interface GPTAssistedFormProps {
  onFormUpdate: (field: string, value: any) => void;
  formData: Record<string, any>;
  currentStep: number;
  totalSteps: number;
  onNextStep: () => void;
  onPrevStep: () => void;
  isSubmitting?: boolean;
  onSubmit?: () => void;
}

const GPTAssistedForm: React.FC<GPTAssistedFormProps> = ({
  onFormUpdate,
  formData,
  currentStep,
  totalSteps,
  onNextStep,
  onPrevStep,
  isSubmitting = false,
  onSubmit
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Initialize the chat with a welcome message based on the current step
  useEffect(() => {
    const initialMessages: Message[] = [];
    
    // Add welcome message based on current step
    switch(currentStep) {
      case 1:
        initialMessages.push({
          id: '1',
          content: `Hi ${user?.email?.split('@')[0] || 'there'}! I'll help you create a new opportunity. Let's start with the basics. What's the title of your opportunity?`,
          sender: 'assistant',
          timestamp: new Date(),
          formField: { name: 'title', value: formData.title || '' }
        });
        break;
      case 2:
        initialMessages.push({
          id: '2',
          content: `Great! Now, let's add some details about your opportunity. Who is providing this opportunity? (This could be your organization name or department)`,
          sender: 'assistant',
          timestamp: new Date(),
          formField: { name: 'provider', value: formData.provider || '' }
        });
        break;
      case 3:
        initialMessages.push({
          id: '3',
          content: `Let's describe your opportunity in detail. What is this opportunity about? What will applicants gain from it?`,
          sender: 'assistant',
          timestamp: new Date(),
          formField: { name: 'description', value: formData.description || '' }
        });
        break;
      case 4:
        initialMessages.push({
          id: '4',
          content: `Almost there! Let's categorize your opportunity. What type of opportunity is this? (e.g., Government, NGO, Corporate, Educational)`,
          sender: 'assistant',
          timestamp: new Date(),
          formField: { name: 'type', value: formData.type || '' }
        });
        break;
      case 5:
        initialMessages.push({
          id: '5',
          content: `Final step! Let's add some eligibility criteria. Who can apply for this opportunity?`,
          sender: 'assistant',
          timestamp: new Date(),
          formField: { name: 'eligibility', value: formData.eligibility || '' }
        });
        break;
      default:
        initialMessages.push({
          id: 'default',
          content: `Let's continue creating your opportunity. What would you like to add next?`,
          sender: 'assistant',
          timestamp: new Date()
        });
    }
    
    setMessages(initialMessages);
  }, [currentStep, user, formData]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Process the user input based on the current step
      let fieldName = '';
      let fieldValue: any = null;
      let assistantResponse = '';
      let shouldAutoAdvance = true;
      
      // Check if the user is trying to add a custom field
      const customFieldMatch = input.match(/add\s+(?:a\s+)?(?:new\s+)?(?:field|requirement)(?:\s+called)?\s+["']?([^"']+)["']?(?:\s+with\s+(?:value|content)\s+["']?([^"']+)["']?)?/i);
      const askingForHelpMatch = input.toLowerCase().match(/(?:can|could)\s+(?:you|i)\s+(?:add|include|create)\s+(?:a\s+)?(?:new|custom|additional)\s+(?:field|requirement|section|information)/i);
      
      if (currentStep >= 5 && (customFieldMatch || askingForHelpMatch)) {
        // User is trying to add a custom field
        if (askingForHelpMatch) {
          // User is asking how to add a custom field
          assistantResponse = `You can add custom fields to your opportunity by saying something like "Add a new field called 'Deadline' with value 'December 31, 2025'" or "Add requirement called 'Required Skills' with content 'Programming, Design'". What custom field would you like to add?`;
          shouldAutoAdvance = false;
        } else if (customFieldMatch) {
          // User is adding a specific custom field
          const fieldName = customFieldMatch[1].trim();
          const fieldValue = customFieldMatch[2] ? customFieldMatch[2].trim() : '';
          
          if (!fieldValue) {
            // Ask for the field value if not provided
            assistantResponse = `I'll add a field called "${fieldName}". What should be the value or content for this field?`;
            
            // Store the field name temporarily in the messages
            const tempMessage: Message = {
              id: Date.now().toString() + '-temp',
              content: `_Adding field: ${fieldName}_`,
              sender: 'assistant',
              timestamp: new Date(),
              formField: { name: 'pendingField', value: fieldName }
            };
            
            setMessages(prev => [...prev, tempMessage]);
            shouldAutoAdvance = false;
          } else {
            // Add the custom field with the provided value
            const customFields = formData.customFields || [];
            const updatedCustomFields = [...customFields, { name: fieldName, value: fieldValue }];
            
            onFormUpdate('customFields', updatedCustomFields);
            
            assistantResponse = `Great! I've added a field called "${fieldName}" with value "${fieldValue}". Would you like to add any other custom fields?`;
            shouldAutoAdvance = false;
          }
        }
      } 
      // Check if user is providing a value for a pending field
      else if (currentStep >= 5 && messages.some(m => m.formField?.name === 'pendingField')) {
        // Get the pending field name
        const pendingFieldMessage = messages.find(m => m.formField?.name === 'pendingField');
        const pendingFieldName = pendingFieldMessage?.formField?.value as string;
        
        if (pendingFieldName) {
          // Add the custom field with the provided value
          const customFields = formData.customFields || [];
          const updatedCustomFields = [...customFields, { name: pendingFieldName, value: input.trim() }];
          
          onFormUpdate('customFields', updatedCustomFields);
          
          assistantResponse = `Perfect! I've added a field called "${pendingFieldName}" with value "${input.trim()}". Would you like to add any other custom fields?`;
          shouldAutoAdvance = false;
        }
      }
      else {
        // Process regular form fields based on current step
        switch(currentStep) {
          case 1: // Title
            fieldName = 'title';
            fieldValue = input.trim();
            assistantResponse = `Thanks! "${fieldValue}" is a great title. Now, let's move to the next step to add more details.`;
            break;
          case 2: // Provider
            fieldName = 'provider';
            fieldValue = input.trim();
            assistantResponse = `Got it! The provider is "${fieldValue}". Let's continue to the next step.`;
            break;
          case 3: // Description
            fieldName = 'description';
            fieldValue = input.trim();
            assistantResponse = `Excellent description! This will help applicants understand your opportunity better. Let's move on to categorize your opportunity.`;
            break;
          case 4: // Type
            fieldName = 'type';
            // Normalize the type input
            if (input.toLowerCase().includes('government')) {
              fieldValue = 'Government';
            } else if (input.toLowerCase().includes('ngo') || input.toLowerCase().includes('non-profit')) {
              fieldValue = 'NGO';
            } else if (input.toLowerCase().includes('corporate') || input.toLowerCase().includes('company')) {
              fieldValue = 'Corporate';
            } else if (input.toLowerCase().includes('education') || input.toLowerCase().includes('school') || input.toLowerCase().includes('university')) {
              fieldValue = 'Educational';
            } else {
              fieldValue = 'Other';
            }
            assistantResponse = `I've categorized this as a "${fieldValue}" opportunity. Let's move to the final step.`;
            break;
          case 5: // Eligibility
            fieldName = 'eligibility';
            fieldValue = input.trim();
            assistantResponse = `Perfect! Now we know who can apply: "${fieldValue}". You're all set to create this opportunity! Would you like to add any additional custom fields to your opportunity? You can say something like "Add a field called 'Deadline' with value 'December 31, 2025'".`;
            break;
          case 6: // Custom fields
            // Check if user wants to finish
            if (input.toLowerCase().match(/(?:no|done|finish|complete|that's all|that is all|nothing else)/)) {
              assistantResponse = `Great! Your opportunity is ready to be created. Click the "Create Opportunity" button when you're ready.`;
            } else {
              assistantResponse = `I'm not sure what you'd like to do. You can add more custom fields by saying something like "Add a field called 'Deadline'" or say "done" if you're finished.`;
            }
            shouldAutoAdvance = false;
            break;
          default:
            assistantResponse = `I've noted your input. Let's continue with the form.`;
        }
        
        // Update the form data if we have a field name
        if (fieldName) {
          onFormUpdate(fieldName, fieldValue);
        }
      }
      
      // Add assistant response
      const assistantMessage: Message = {
        id: Date.now().toString() + '-response',
        content: assistantResponse,
        sender: 'assistant',
        timestamp: new Date(),
        formField: fieldName ? { name: fieldName, value: fieldValue } : undefined
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Automatically move to next step after a short delay if appropriate
      if (shouldAutoAdvance && currentStep < totalSteps) {
        setTimeout(() => {
          onNextStep();
        }, 1500);
      }
      
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        content: 'I apologize, but I encountered an error while processing your input. Please try again.',
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process your input",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Helper function to get step title based on current step
  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return "Title";
      case 2: return "Provider";
      case 3: return "Description";
      case 4: return "Type";
      case 5: return "Eligibility";
      case 6: return "Custom Fields";
      default: return "Create Opportunity";
    }
  };
  
  // Helper function to get suggestions based on current step
  const getSuggestions = () => {
    switch(currentStep) {
      case 1:
        return ["Summer Internship Program", "Research Grant Opportunity", "Scholarship for Undergraduates"];
      case 2:
        return ["Department of Education", "Google", "United Nations", "Our University"];
      case 3:
        return ["This opportunity provides funding for...", "Selected applicants will receive mentorship in...", "A 12-week program designed to..."];
      case 4:
        return ["Government", "NGO", "Corporate", "Educational"];
      case 5:
        return ["Open to students aged 18-25", "Must be a citizen or permanent resident", "Requires at least 2 years of experience"];
      case 6:
        return ["Add a field called 'Deadline'", "Add requirement called 'Required Documents'", "Add field called 'Funding Amount'"];
      default:
        return [];
    }
  };
  
  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <div className="flex flex-col h-full border-l border-border">
      <div className="p-3 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Bot size={18} />
            Opportunity Creation Assistant
          </h2>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <HelpCircle size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[300px]">
                <p className="text-sm">
                  I'll help you create your opportunity. Just answer my questions or type naturally.
                  {currentStep >= 5 && " You can add custom fields by saying 'Add a field called X'."}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{getStepTitle(currentStep)}</span>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.sender === 'user' 
                    ? 'bg-primary text-primary-foreground ml-12' 
                    : 'bg-muted mr-12'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {message.sender === 'assistant' ? (
                    <Bot size={14} />
                  ) : (
                    <User size={14} />
                  )}
                  <span className="text-xs opacity-70">
                    {message.sender === 'user' ? 'You' : 'Astra'}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {message.formField && (
                  <div className="mt-2 p-2 bg-background/50 rounded border text-xs">
                    <span className="font-medium">{message.formField.name}:</span> {
                      typeof message.formField.value === 'string' 
                        ? message.formField.value 
                        : JSON.stringify(message.formField.value)
                    }
                  </div>
                )}
                
                <div className="text-xs opacity-50 mt-1 text-right">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-muted mr-12">
                <div className="flex items-center gap-2 mb-1">
                  <Bot size={14} />
                  <span className="text-xs opacity-70">Astra</span>
                </div>
                <div className="flex space-x-2 items-center">
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse delay-150"></div>
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse delay-300"></div>
                  <span className="text-xs text-muted-foreground ml-1">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="p-3 border-t border-border">
        {/* Suggestion chips */}
        {!isLoading && currentStep !== totalSteps && (
          <div className="mb-3 flex flex-wrap gap-2">
            {getSuggestions().map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs py-1 h-auto"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion.length > 30 ? suggestion.substring(0, 30) + '...' : suggestion}
              </Button>
            ))}
          </div>
        )}
        
        {currentStep === totalSteps && !isLoading ? (
          <div className="space-y-3">
            <Button 
              onClick={onPrevStep} 
              variant="outline" 
              className="w-full"
              disabled={isSubmitting}
            >
              Go Back
            </Button>
            <Button 
              onClick={onSubmit} 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Opportunity
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              onClick={handleSendMessage} 
              size="icon" 
              disabled={!input.trim() || isLoading}
              className="bg-primary text-primary-foreground"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send size={16} />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GPTAssistedForm;