import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import {
  MessageCircle,
  Send,
  Bot,
  User,
  X,
  Minimize2,
  Maximize2,
  HelpCircle,
  Zap
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { findBestMatch, AIResponse } from '../lib/ai-knowledge';
import { User } from './AuthSystem';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: AIResponse['action'];
}

interface AIAssistantProps {
  activeView?: string;
  userRole?: string;
}

export function AIAssistant({ activeView, userRole }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hello! I'm your AI assistant for disaster relief operations.${userRole ? ` I see you're logged in as a ${userRole}.` : ''} I can help you with emergency procedures, resource allocation, and more. How can I assist you today?`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);


  // Dynamic quick actions based on context
  const getQuickActions = () => {
    switch (activeView) {
      case 'map':
        return ['Find nearest shelter', 'Show medical centers', 'Traffic status', 'Weather update'];
      case 'inventory':
        return ['Low stock alert', 'Add new item', 'Inventory report', 'Supply request'];
      case 'available-tasks':
        return ['Find high priority', 'My assigned tasks', 'Task guidelines', 'Report issue'];
      case 'analytics':
        return ['Export report', 'Volunteer stats', 'Donation summary', 'Resource efficiency'];
      default:
        return [
          'Emergency protocols',
          'Find volunteers',
          'Check supplies',
          'Contact emergency services'
        ];
    }
  };

  // Dynamic quick actions based on context
  if (!inputValue.trim()) return;

  const userMessage: Message = {
    id: Date.now().toString(),
    type: 'user',
    content: inputValue,
    timestamp: new Date()
  };

  setMessages(prev => [...prev, userMessage]);
  setInputValue('');
  setIsTyping(true);

  // Simulate AI processing
  setTimeout(() => {
    // Mock user object if not fully passed (or use props)
    const currentUser = { name: 'User', role: userRole || 'guest', id: '0', email: '' } as User;

    const response = findBestMatch(inputValue, activeView || 'dashboard', currentUser);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: response.text,
      action: response.action,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
  }, 800);
};

// Remove old getAIResponse function
// ...

if (!isOpen) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-2 border-blue-500/20"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </motion.div>
  );
}

return (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{
      opacity: 1,
      y: 0,
      scale: 1,
      height: isMinimized ? 'auto' : '500px'
    }}
    className="fixed bottom-6 right-6 z-50 w-96"
  >
    <Card className="shadow-2xl border-2 border-blue-200/50 dark:border-blue-800/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm">AI Assistant</CardTitle>
              <CardDescription className="text-xs">Relief Operations Support</CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 p-0"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <CardContent className="space-y-4">
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-1">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action)}
                    className="text-xs h-7"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    {action}
                  </Button>
                ))}
              </div>

              {/* Messages */}
              <ScrollArea className="h-64 w-full border rounded-lg p-2">
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-muted'
                          }`}
                      >
                        <div className="flex items-start space-x-2">
                          {message.type === 'assistant' && (
                            <Bot className="h-4 w-4 mt-0.5 text-blue-600" />
                          )}
                          {message.type === 'user' && (
                            <User className="h-4 w-4 mt-0.5" />
                          )}
                          <div>
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${message.type === 'user'
                                ? 'text-blue-100'
                                : 'text-muted-foreground'
                                }`}
                            >
                              {message.timestamp.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        {message.action && (
                          <div className="mt-2 text-xs">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="w-full text-xs h-7"
                              onClick={() => {
                                if (message.action?.type === 'navigate') {
                                  window.location.hash = message.action.value; // Simple hash nav for now, preferably use a callback
                                } else if (message.action?.type === 'call') {
                                  window.open(`tel:${message.action.value}`);
                                }
                              }}
                            >
                              {message.action.label}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-muted p-3 rounded-lg max-w-[80%]">
                        <div className="flex items-center space-x-2">
                          <Bot className="h-4 w-4 text-blue-600" />
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="flex space-x-2">
                <Input
                  placeholder="Ask me anything about relief operations..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 text-sm"
                />
                <Button
                  onClick={handleSendMessage}
                  size="sm"
                  disabled={!inputValue.trim() || isTyping}
                  className="px-3"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>AI Assistant Online</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  <HelpCircle className="h-3 w-3 mr-1" />
                  24/7 Support
                </Badge>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  </motion.div>
);
}