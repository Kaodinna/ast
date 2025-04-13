import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Search, ExternalLink, Check, X, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from 'next/link';
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Message = {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  suggestedOpportunities?: any[];
  isActionRequest?: boolean;
  actionDetails?: {
    action: string;
    parameters: Record<string, any>;
  };
};

interface GPTChatInterfaceProps {
  opportunities?: any[];
  onSuggestOpportunities?: (opportunities: any[]) => void;
}

const GPTChatInterface: React.FC<GPTChatInterfaceProps> = ({ 
  opportunities = [],
  onSuggestOpportunities
}) => {
  const { user, userRole } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m Astra, your AI assistant. How can I help you today?',
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionConfirmOpen, setActionConfirmOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<{
    action: string;
    parameters: Record<string, any>;
    messageId: string;
  } | null>(null);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);

  // Convert messages to the format expected by the API
  const getMessageHistory = () => {
    return messages
      .filter(msg => msg.sender === 'user' || msg.sender === 'assistant')
      .map(msg => ({
        role: msg.sender,
        content: msg.content
      }))
      .slice(-10); // Only use the last 10 messages for context
  };

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
      // Get message history for context
      const history = getMessageHistory();
      
      // Call the chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          history
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check if this is an action request
      const isActionRequest = data.containsActionIntent;
      
      // If it's an action request, analyze the intent
      let actionDetails: { action: string; parameters: Record<string, any> } | undefined = undefined;
      if (isActionRequest) {
        const intentResponse = await fetch('/api/chat/analyze-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: input,
            history
          }),
        });
        
        if (intentResponse.ok) {
          const intentData = await intentResponse.json();
          if (intentData.intent !== 'information' && intentData.confidence > 0.6) {
            actionDetails = {
              action: intentData.intent as string,
              parameters: intentData.parameters as Record<string, any>
            };
          }
        }
      }
      
      // Add assistant message
      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: data.response,
        sender: 'assistant',
        timestamp: new Date(),
        isActionRequest,
        actionDetails
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // If this is an action request with details, prompt for confirmation
      if (actionDetails) {
        setCurrentAction({
          action: actionDetails.action,
          parameters: actionDetails.parameters,
          messageId: assistantMessage.id
        });
        setActionConfirmOpen(true);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to communicate with the assistant",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const executeAction = async (confirmed: boolean) => {
    if (!currentAction || !confirmed) {
      setActionConfirmOpen(false);
      setCurrentAction(null);
      return;
    }
    
    setIsLoading(true);
    setActionConfirmOpen(false);
    
    try {
      // Call the execute-action API
      const response = await fetch('/api/chat/execute-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: currentAction.action,
          parameters: currentAction.parameters,
          userConfirmation: true
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Error: ${response.status}`);
      }
      
      // Add success message
      const successMessage: Message = {
        id: Date.now().toString(),
        content: `✅ Action completed successfully: ${data.result.message}`,
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, successMessage]);
      
      toast({
        title: "Success",
        description: data.result.message,
      });
    } catch (error) {
      console.error('Error executing action:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: `❌ I couldn't complete the requested action: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to execute action",
      });
    } finally {
      setIsLoading(false);
      setCurrentAction(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getActionDescription = () => {
    if (!currentAction) return '';
    
    switch (currentAction.action) {
      case 'updateProfile':
        return `Update your profile with the following information: ${Object.entries(currentAction.parameters)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')}`;
      case 'createOpportunity':
        return `Create a new opportunity titled "${currentAction.parameters.title}"`;
      case 'applyToOpportunity':
        return `Apply to the opportunity with ID: ${currentAction.parameters.opportunityId}`;
      default:
        return 'Perform the requested action';
    }
  };

  return (
    <div className="flex flex-col h-full border-l border-border">
      <div className="p-3 border-b border-border bg-muted/30">
        <h2 className="font-semibold flex items-center gap-2">
          <Bot size={18} />
          Astra GPT Assistant
        </h2>
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
                
                {message.isActionRequest && message.actionDetails && (
                  <div className="mt-3">
                    <Alert variant="default" className="bg-primary/10 border-primary/20">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Action Request</AlertTitle>
                      <AlertDescription className="text-xs">
                        I can perform this action for you. Click the buttons below to confirm or cancel.
                      </AlertDescription>
                      <div className="flex gap-2 mt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => {
                            if (message.actionDetails) {
                              setCurrentAction({
                                action: message.actionDetails.action,
                                parameters: message.actionDetails.parameters,
                                messageId: message.id
                              });
                              setActionConfirmOpen(true);
                            }
                          }}
                        >
                          <Check className="mr-1 h-3 w-3" /> Confirm
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => {
                            // Add a message indicating the user declined
                            setMessages(prev => [...prev, {
                              id: Date.now().toString(),
                              content: "Action cancelled. Let me know if you need anything else.",
                              sender: 'assistant',
                              timestamp: new Date(),
                            }]);
                          }}
                        >
                          <X className="mr-1 h-3 w-3" /> Cancel
                        </Button>
                      </div>
                    </Alert>
                  </div>
                )}
                
                {message.suggestedOpportunities && message.suggestedOpportunities.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium flex items-center gap-1">
                      <Search size={12} />
                      Suggested Opportunities:
                    </p>
                    {message.suggestedOpportunities.map(opp => (
                      <Card key={opp.id} className="bg-background/50 backdrop-blur-sm">
                        <CardContent className="p-2">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                              <p className="text-xs font-medium line-clamp-1">{opp.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{opp.provider}</p>
                            </div>
                            <Link href={`/dashboard/opportunities/${opp.id}`}>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <ExternalLink size={12} />
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
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
      </div>
      
      {/* Action Confirmation Dialog */}
      <AlertDialog open={actionConfirmOpen} onOpenChange={setActionConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              {getActionDescription()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => executeAction(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => executeAction(true)}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GPTChatInterface;