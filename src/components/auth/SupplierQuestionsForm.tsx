import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  Box,
  Text,
  useToast,
  FormErrorMessage,
  RadioGroup,
  Stack,
  Radio,
  HStack,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInviteData } from '../../services/supplierInvitations';
import { getQuestionsByTags } from '../../services/supplierQuestionnaires';
import type { Question } from '../../types/question';

interface SupplierQuestionsFormProps {
  inviteCode: string;
  onComplete: (answers: Record<string, string>) => Promise<void>;
}

export const SupplierQuestionsForm = ({ inviteCode, onComplete }: SupplierQuestionsFormProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        // Get invite data to get the tags
        const inviteData = await getInviteData(inviteCode);
        if (!inviteData?.tags?.length) {
          return;
        }

        // Load questions with those tags
        const taggedQuestions = await getQuestionsByTags(inviteData.tags);
        setQuestions(taggedQuestions);
        
        // Initialize answers object
        const initialAnswers: Record<string, string> = {};
        taggedQuestions.forEach((question: Question) => {
          initialAnswers[question.id] = '';
        });
        setAnswers(initialAnswers);
      } catch (error) {
        console.error('Error loading questions:', error);
        toast({
          title: 'Error loading questions',
          description: error instanceof Error ? error.message : 'Failed to load questions',
          status: 'error',
          duration: 5000,
        });
      }
    };

    loadQuestions();
  }, [inviteCode, toast]);

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrors({});

    // Validate all required questions are answered
    const newErrors: Record<string, string> = {};
    questions.forEach(question => {
      if (question.required && !answers[question.id]?.trim()) {
        newErrors[question.id] = 'This question requires an answer';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      await onComplete(answers);
      navigate('/dashboard'); // Or wherever you want to redirect after completion
    } catch (error) {
      console.error('Error submitting answers:', error);
      toast({
        title: 'Error submitting answers',
        description: error instanceof Error ? error.message : 'Failed to submit answers',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderQuestionInput = (question: Question) => {
    switch (question.type) {
      case 'text':
        return (
          <Textarea
            value={answers[question.id] || ''}
            onChange={(e) => setAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
            placeholder="Enter your answer"
            minH="100px"
          />
        );
      case 'yesNo':
        return (
          <RadioGroup
            value={answers[question.id] || ''}
            onChange={(value) => setAnswers(prev => ({ ...prev, [question.id]: value }))}
          >
            <Stack direction="row" spacing={4}>
              <Radio value="yes">Yes</Radio>
              <Radio value="no">No</Radio>
            </Stack>
          </RadioGroup>
        );
      case 'multipleChoice':
        return (
          <RadioGroup
            value={answers[question.id] || ''}
            onChange={(value) => setAnswers(prev => ({ ...prev, [question.id]: value }))}
          >
            <Stack>
              {question.options?.map((option, index) => (
                <Radio key={index} value={option}>
                  {option}
                </Radio>
              ))}
            </Stack>
          </RadioGroup>
        );
      case 'scale':
        return (
          <Box pt={6} pb={2}>
            <Slider
              value={parseInt(answers[question.id] || '0')}
              onChange={(value) => setAnswers(prev => ({ ...prev, [question.id]: value.toString() }))}
              min={1}
              max={10}
              step={1}
            >
              <SliderMark value={1} mt={2} fontSize="sm">1</SliderMark>
              <SliderMark value={5} mt={2} fontSize="sm">5</SliderMark>
              <SliderMark value={10} mt={2} fontSize="sm">10</SliderMark>
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </Box>
        );
      default:
        return (
          <Input
            value={answers[question.id] || ''}
            onChange={(e) => setAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
            placeholder="Enter your answer"
          />
        );
    }
  };

  if (questions.length === 0) {
    return null;
  }

  return (
    <Box maxW="600px" mx="auto" p={6}>
      <Text fontSize="xl" fontWeight="medium" mb={6}>
        Required Questions
      </Text>
      <VStack spacing={6} align="stretch">
        {questions.map((question) => (
          <FormControl key={question.id} isInvalid={!!errors[question.id]} isRequired={question.required}>
            <FormLabel>{question.text}</FormLabel>
            {renderQuestionInput(question)}
            <FormErrorMessage>{errors[question.id]}</FormErrorMessage>
          </FormControl>
        ))}
        <Button
          colorScheme="green"
          onClick={handleSubmit}
          isLoading={isLoading}
          mt={4}
        >
          Submit
        </Button>
      </VStack>
    </Box>
  );
};
