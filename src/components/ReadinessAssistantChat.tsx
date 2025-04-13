import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2 } from "lucide-react";

type Message = {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
};

interface ReadinessAssistantChatProps {
  contextPrompt?: string;
  onMessageResponse?: (message: string) => void;
}

const ReadinessAssistantChat: React.FC<ReadinessAssistantChatProps> = ({ 
  contextPrompt = '',
  onMessageResponse
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI assistant for this readiness assessment. How can I help you today?',
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
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
      // In a real implementation, this would call an API endpoint
      // For now, we'll simulate a response based on the input
      const response = await simulateAIResponse(input, contextPrompt);
      
      const assistantMessage: Message = {
        id: Date.now().toString() + '-response',
        content: response,
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Notify parent component about the response if needed
      if (onMessageResponse) {
        onMessageResponse(response);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateAIResponse = async (userInput: string, context: string): Promise<string> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const userInputLower = userInput.toLowerCase();
    
    // Simple pattern matching for readiness assessment context
    if (userInputLower.includes('help') && userInputLower.includes('application')) {
      return "For the mock application, focus on highlighting your relevant skills and experiences. Be specific about why you're interested in this opportunity and how it aligns with your goals. Use concrete examples from your past experiences to demonstrate your qualifications.";
    } else if (userInputLower.includes('help') && userInputLower.includes('interview')) {
      return "For the mock interview, prepare concise and structured answers. Use the STAR method (Situation, Task, Action, Result) when describing past experiences. Make sure to connect your answers to the specific requirements of this opportunity.";
    } else if (userInputLower.includes('eligibility')) {
      return "The eligibility assessment evaluates whether you meet the basic requirements for this opportunity. The system analyzes your profile against the stated eligibility criteria. If you're concerned about eligibility, make sure to carefully review the opportunity details in the right panel.";
    } else if (userInputLower.includes('how') && userInputLower.includes('score')) {
      return "Your readiness score is calculated based on three components: eligibility match (25%), application quality (35%), and interview performance (40%). A score of 70 or higher indicates you're ready to apply, though you can still apply regardless of your score.";
    } else if (userInputLower.includes('example') || userInputLower.includes('sample')) {
      return "Here's a sample response for 'Why are you interested in this opportunity?': 'I'm interested in this opportunity because it aligns with my career goals in [relevant field]. The focus on [specific aspect] particularly excites me as I've been developing skills in this area through [relevant experience]. This opportunity would allow me to contribute my expertise while further developing my professional capabilities.'";
    } else if (userInputLower.includes('thank')) {
      return "You're welcome! I'm here to help you succeed in your application. Feel free to ask if you need any more assistance with specific questions or sections of the assessment.";
    } else {
      return "I'm here to help with your readiness assessment. I can provide guidance on completing the application, preparing for the mock interview, or understanding the eligibility requirements. What specific aspect would you like help with?";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] rounded-lg p-3 ${
                  message.sender === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {message.sender === 'assistant' ? (
                    <Bot size={14} />
                  ) : (
                    <User size={14} />
                  )}
                  <span className="text-xs opacity-70">
                    {message.sender === 'user' ? 'You' : 'AI Assistant'}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <div className="text-xs opacity-50 mt-1 text-right">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-lg p-3 bg-muted">
                <div className="flex items-center gap-2 mb-1">
                  <Bot size={14} />
                  <span className="text-xs opacity-70">AI Assistant</span>
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
            placeholder="Ask for help with your assessment..."
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
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReadinessAssistantChat;