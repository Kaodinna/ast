import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Search, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from 'next/link';
import { Opportunity } from './SwipeCard';

type Message = {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  suggestedOpportunities?: Opportunity[];
};

interface EnhancedChatInterfaceProps {
  opportunities: Opportunity[];
  onSuggestOpportunities?: (opportunities: Opportunity[]) => void;
}

const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({ 
  opportunities,
  onSuggestOpportunities
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m Astra, your AI assistant. How can I help you find opportunities today?',
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
      // Find relevant opportunities based on user input
      const userInputLower = input.toLowerCase();
      let suggestedOpportunities: Opportunity[] = [];
      
      // Simple keyword matching to suggest opportunities
      if (userInputLower.includes('education') || userInputLower.includes('school') || userInputLower.includes('college')) {
        suggestedOpportunities = opportunities.filter(opp => 
          opp.type.toLowerCase().includes('education') || 
          opp.description.toLowerCase().includes('education') ||
          opp.title.toLowerCase().includes('education')
        ).slice(0, 3);
      } else if (userInputLower.includes('job') || userInputLower.includes('employment') || userInputLower.includes('work')) {
        suggestedOpportunities = opportunities.filter(opp => 
          opp.type.toLowerCase().includes('job') || 
          opp.description.toLowerCase().includes('job') ||
          opp.title.toLowerCase().includes('job') ||
          opp.type.toLowerCase().includes('employment') ||
          opp.description.toLowerCase().includes('employment')
        ).slice(0, 3);
      } else if (userInputLower.includes('funding') || userInputLower.includes('grant') || userInputLower.includes('money')) {
        suggestedOpportunities = opportunities.filter(opp => 
          opp.funding !== null || 
          opp.description.toLowerCase().includes('fund') ||
          opp.title.toLowerCase().includes('grant')
        ).slice(0, 3);
      } else {
        // If no specific keywords, suggest random opportunities
        suggestedOpportunities = opportunities
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
      }
      
      // Generate response based on available opportunities
      let responseContent = '';
      if (suggestedOpportunities.length > 0) {
        responseContent = `I've found ${suggestedOpportunities.length} opportunities that might interest you. Take a look at these options, or let me know if you'd like more specific information.`;
      } else {
        responseContent = `I couldn't find any opportunities matching your criteria at the moment. Please try a different search or check back later as new opportunities are added regularly.`;
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responseContent,
        sender: 'assistant',
        timestamp: new Date(),
        suggestedOpportunities: suggestedOpportunities.length > 0 ? suggestedOpportunities : undefined
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Notify parent component about suggested opportunities
      if (suggestedOpportunities.length > 0 && onSuggestOpportunities) {
        onSuggestOpportunities(suggestedOpportunities);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
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

  return (
    <div className="flex flex-col h-full border-l border-border">
      <div className="p-3 border-b border-border bg-muted/30">
        <h2 className="font-semibold flex items-center gap-2">
          <Bot size={18} />
          Astra Assistant
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
    </div>
  );
};

export default EnhancedChatInterface;