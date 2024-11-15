import {
  VStack,
  Box,
  Text,
  Input,
  Button,
  HStack,
  useToast,
  Avatar,
  Flex,
  Divider,
} from '@chakra-ui/react';
import { useState, useRef, useEffect } from 'react';
import { FileDropzone } from './FileDropzone';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface AIImportChatProps {
  onUnderstanding: (understanding: FileUnderstanding) => void;
  onFileSelect: (file: File) => void;
}

export interface FileUnderstanding {
  columnMappings: {
    question: string;
    type?: string;
    required?: string;
    options?: string;
    tags?: string;
  };
  specialInstructions?: string[];
}

const INITIAL_MESSAGE = `Hi! I'll help you import your questions. Could you describe the structure of your file? 
For example:
- What columns does it have?
- Are there any special formats or conventions used?
- What sheet contains the questions?`;

export const AIImportChat = ({ onUnderstanding, onFileSelect }: AIImportChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: INITIAL_MESSAGE,
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasUnderstanding, setHasUnderstanding] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      // Here we would normally call an AI service
      // For now, we'll simulate some basic understanding
      const understanding = analyzeUserMessage(userMessage.text);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateAIResponse(understanding),
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiResponse]);
      onUnderstanding(understanding);
      setHasUnderstanding(true);
    } catch (error) {
      toast({
        title: 'Error processing message',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <VStack spacing={6} h="full">
      <Box
        flex={1}
        w="full"
        overflowY="auto"
        p={4}
        bg="gray.50"
        borderRadius="md"
        maxH="300px"
      >
        {messages.map((message) => (
          <Flex
            key={message.id}
            mb={4}
            justify={message.sender === 'user' ? 'flex-end' : 'flex-start'}
          >
            {message.sender === 'ai' && (
              <Avatar
                size="sm"
                name="AI Assistant"
                bg="green.500"
                color="white"
                mr={2}
              />
            )}
            <Box
              maxW="80%"
              bg={message.sender === 'user' ? 'green.500' : 'white'}
              color={message.sender === 'user' ? 'white' : 'black'}
              p={3}
              borderRadius="lg"
              shadow="sm"
            >
              <Text fontSize="sm" whiteSpace="pre-wrap">
                {message.text}
              </Text>
            </Box>
            {message.sender === 'user' && (
              <Avatar
                size="sm"
                name="User"
                ml={2}
              />
            )}
          </Flex>
        ))}
        <div ref={endOfMessagesRef} />
      </Box>

      <HStack w="full">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your file structure..."
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          colorScheme="green"
          onClick={handleSend}
          isLoading={isProcessing}
        >
          Send
        </Button>
      </HStack>

      {hasUnderstanding && (
        <>
          <Divider />
          <VStack w="full" spacing={4}>
            <Text fontWeight="medium">
              Great! Now you can upload your file and I'll help process it according to your description:
            </Text>
            <FileDropzone onFileSelect={onFileSelect} />
          </VStack>
        </>
      )}
    </VStack>
  );
};

// Temporary analysis function - would be replaced with actual AI service
function analyzeUserMessage(message: string): FileUnderstanding {
  const lowerMessage = message.toLowerCase();
  
  // Very basic analysis - in reality, this would be done by an AI model
  const understanding: FileUnderstanding = {
    columnMappings: {
      question: 'Question',
    },
    specialInstructions: [],
  };

  if (lowerMessage.includes('type')) {
    understanding.columnMappings.type = 'Type';
  }
  if (lowerMessage.includes('required')) {
    understanding.columnMappings.required = 'Required';
  }
  if (lowerMessage.includes('option')) {
    understanding.columnMappings.options = 'Options';
  }
  if (lowerMessage.includes('tag')) {
    understanding.columnMappings.tags = 'Tags';
  }

  // Add special instructions based on message content
  if (lowerMessage.includes('first sheet')) {
    understanding.specialInstructions?.push('Use first sheet only');
  }
  if (lowerMessage.includes('header')) {
    understanding.specialInstructions?.push('First row contains headers');
  }

  return understanding;
}

function generateAIResponse(understanding: FileUnderstanding): string {
  const mappings = understanding.columnMappings;
  let response = "I understand your file structure. Here's what I've gathered:\n\n";

  response += "Columns I've identified:\n";
  Object.entries(mappings).forEach(([key, value]) => {
    response += `- ${value} (will be used for ${key})\n`;
  });

  if (understanding.specialInstructions?.length) {
    response += "\nSpecial instructions:\n";
    understanding.specialInstructions.forEach(instruction => {
      response += `- ${instruction}\n`;
    });
  }

  response += "\nDoes this look correct? If not, please provide more details or corrections.";
  return response;
}