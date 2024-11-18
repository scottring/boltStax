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
  SliderMark,
  Container,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tag,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInviteData } from '../../services/supplierInvitations';
import { getQuestionsByTags } from '../../services/supplierQuestionnaires';
import { sendEmail } from '../../services/email';
import { saveSupplierAnswers, updateSupplierStatus } from '../../services/suppliers';
import { resolveTagIds } from '../../services/tags';
import type { Question } from '../../types/question';
import type { Tag as TagType } from '../../types/tag';

interface SupplierQuestionsFormProps {
  inviteCode: string;
  onComplete: (answers: Record<string, string>) => Promise<void>;
}

export const SupplierQuestionsForm = ({ inviteCode, onComplete }: SupplierQuestionsFormProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);
  const [tags, setTags] = useState<TagType[]>([]);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        // Get invite data to get the tags
        const data = await getInviteData(inviteCode);
        if (!data?.tags?.length) {
          return;
        }
        setInviteData(data);

        // Resolve tag IDs to full tag objects
        const resolvedTags = await resolveTagIds(data.tags);
        setTags(resolvedTags);

        // Load questions with those tags
        const taggedQuestions = await getQuestionsByTags(data.tags);
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
      // Save answers and update supplier status
      await saveSupplierAnswers(inviteData.supplierCompanyId, answers);
      
      // Update supplier status to submitted
      await updateSupplierStatus(inviteData.supplierCompanyId, 'submitted');

      // Call the onComplete callback
      await onComplete(answers);
      
      // Send email notification to the customer
      if (inviteData?.email) {
        try {
          await sendEmail({
            to: inviteData.email,
            template: 'SHEET_SUBMITTED',
            data: {
              supplierName: inviteData.name,
              companyName: inviteData.name
            }
          });
        } catch (emailError) {
          console.error('Error sending notification email:', emailError);
          // Don't block the submission if email fails
        }
      }

      setIsSubmitted(true);
      toast({
        title: 'Success!',
        description: 'Your answers have been submitted successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Navigate to dashboard after a delay
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 3000);
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
            isDisabled={isSubmitted}
          />
        );
      case 'yesNo':
        return (
          <RadioGroup
            value={answers[question.id] || ''}
            onChange={(value) => setAnswers(prev => ({ ...prev, [question.id]: value }))}
            isDisabled={isSubmitted}
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
            isDisabled={isSubmitted}
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
              isDisabled={isSubmitted}
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
            isDisabled={isSubmitted}
          />
        );
    }
  };

  if (questions.length === 0) {
    return null;
  }

  return (
    <Box py={8} px={4} maxW="800px" mx="auto">
      {isSubmitted ? (
        <Alert
          status="success"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
          mb={6}
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Submission Successful!
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            Thank you for completing the questionnaire. You will be redirected to the dashboard shortly.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Text fontSize="xl" fontWeight="medium" mb={2}>
            Required Questions
          </Text>
          {tags.length > 0 && (
            <Wrap spacing={2} mb={6}>
              {tags.map(tag => (
                <WrapItem key={tag.id}>
                  <Tag size="md" variant="subtle" colorScheme={tag.color}>
                    {tag.name}
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          )}
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
              isDisabled={isSubmitted}
              mt={4}
              size="lg"
              w="full"
            >
              Submit
            </Button>
          </VStack>
        </>
      )}
    </Box>
  );
};
