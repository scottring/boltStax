import {
  Box,
  VStack,
  Heading,
  Text,
  Input,
  Textarea,
  Radio,
  RadioGroup,
  Checkbox,
  CheckboxGroup,
  Button,
  Progress,
  useToast,
  Alert,
  AlertIcon,
  FormControl,
  FormLabel,
  FormHelperText,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useColorModeValue,
  HStack,
  Divider,
  Badge
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import type { 
  QuestionnaireResponse,
  QuestionResponse,
  Question,
  QuestionType,
  QuestionnaireTemplate,
  QuestionnaireSection,
  SectionResponse,
  SubmissionStatus
} from '../../types/questionnaire';
import { 
  getQuestionnaireResponse,
  updateQuestionResponse,
  submitQuestionnaireResponse,
  subscribeToResponseDrafts
} from '../../services/questionnaireResponses';
import { getTemplates } from '../../services/questionnaireTemplates';
import { FileDropzone } from '../questions/FileDropzone';

interface QuestionnaireResponseViewProps {
  productSheetId: string;
  supplierId: string;
  userId: string;
}

interface MergedSection extends QuestionnaireSection {
  responses: QuestionResponse[];
}

const getStatusColor = (status: SubmissionStatus): string => {
  const statusColors: Record<SubmissionStatus, string> = {
    draft: 'gray',
    submitted: 'blue',
    approved: 'green',
    rejected: 'red',
    pending: 'orange'
  };
  return statusColors[status];
};

export const QuestionnaireResponseView = ({
  productSheetId,
  supplierId,
  userId
}: QuestionnaireResponseViewProps) => {
  const [response, setResponse] = useState<QuestionnaireResponse | null>(null);
  const [template, setTemplate] = useState<QuestionnaireTemplate | null>(null);
  const [mergedSections, setMergedSections] = useState<MergedSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.600');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [responseData, templates] = await Promise.all([
          getQuestionnaireResponse(productSheetId, supplierId),
          getTemplates()
        ]);
        setResponse(responseData);
        if (responseData) {
          const matchingTemplate = templates.find(t => t.id === responseData.templateId);
          setTemplate(matchingTemplate || null);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load questionnaire');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [productSheetId, supplierId]);

  useEffect(() => {
    if (response && template) {
      // Merge template sections with response data
      const merged = template.sections.map(section => {
        const responseSection = response.sections.find(s => s.sectionId === section.id);
        return {
          ...section,
          responses: responseSection?.responses || []
        };
      });
      setMergedSections(merged);
    }
  }, [response, template]);

  useEffect(() => {
    if (!response?.id) return;

    // Subscribe to auto-save drafts
    const unsubscribe = subscribeToResponseDrafts(response.id, (drafts) => {
      if (drafts.length > 0) {
        const latestDraft = drafts[0];
        setIsSaving(false);
        toast({
          title: 'Changes saved',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      }
    });

    return () => unsubscribe();
  }, [response?.id]);

  const handleQuestionResponse = async (
    sectionId: string,
    question: Question,
    value: QuestionResponse['value'],
    fileUrls?: string[]
  ) => {
    if (!response?.id) return;
    
    setIsSaving(true);
    try {
      await updateQuestionResponse(
        response.id,
        sectionId,
        question.id,
        value,
        userId,
        fileUrls
      );
    } catch (error) {
      toast({
        title: 'Error saving response',
        description: error instanceof Error ? error.message : 'Failed to save response',
        status: 'error',
        duration: 5000,
      });
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!response?.id) return;

    setIsSubmitting(true);
    try {
      await submitQuestionnaireResponse(response.id, userId);
      toast({
        title: 'Questionnaire submitted successfully',
        status: 'success',
        duration: 3000,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Error submitting questionnaire',
        description: error instanceof Error ? error.message : 'Failed to submit questionnaire',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestionInput = (
    sectionId: string,
    question: Question,
    currentValue: QuestionResponse['value']
  ) => {
    switch (question.type) {
      case 'shortText':
        return (
          <Input
            value={currentValue as string || ''}
            onChange={(e) => handleQuestionResponse(sectionId, question, e.target.value)}
            placeholder="Enter your answer"
            size="sm"
          />
        );

      case 'longText':
        return (
          <Textarea
            value={currentValue as string || ''}
            onChange={(e) => handleQuestionResponse(sectionId, question, e.target.value)}
            placeholder="Enter your answer"
            size="sm"
            rows={4}
          />
        );

      case 'singleChoice':
        return (
          <RadioGroup
            value={currentValue as string || ''}
            onChange={(value) => handleQuestionResponse(sectionId, question, value)}
          >
            <VStack align="start" spacing={2}>
              {question.options?.map((option) => (
                <Radio key={option.id} value={option.value}>
                  {option.text}
                </Radio>
              ))}
            </VStack>
          </RadioGroup>
        );

      case 'multiChoice':
        return (
          <CheckboxGroup
            value={currentValue as string[] || []}
            onChange={(value) => handleQuestionResponse(sectionId, question, value.map(String))}
          >
            <VStack align="start" spacing={2}>
              {question.options?.map((option) => (
                <Checkbox key={option.id} value={option.value}>
                  {option.text}
                </Checkbox>
              ))}
            </VStack>
          </CheckboxGroup>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={currentValue as number || ''}
            onChange={(e) => handleQuestionResponse(sectionId, question, Number(e.target.value))}
            placeholder="Enter a number"
            size="sm"
            min={question.validation?.min}
            max={question.validation?.max}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={currentValue as string || ''}
            onChange={(e) => handleQuestionResponse(sectionId, question, e.target.value)}
            size="sm"
          />
        );

      case 'file':
        return (
          <FileDropzone
            onFilesUploaded={(urls) => handleQuestionResponse(sectionId, question, null, urls)}
            acceptedFileTypes={question.validation?.allowedFileTypes}
            existingFiles={response?.sections
              .find(s => s.sectionId === sectionId)
              ?.responses.find(r => r.questionId === question.id)
              ?.fileUrls || []}
          />
        );

      case 'boolean':
        return (
          <RadioGroup
            value={String(currentValue ?? '')}
            onChange={(value) => handleQuestionResponse(sectionId, question, value === 'true')}
          >
            <HStack spacing={4}>
              <Radio value="true">Yes</Radio>
              <Radio value="false">No</Radio>
            </HStack>
          </RadioGroup>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Box p={6}>
        <Text>Loading questionnaire...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  if (!response || !template) {
    return (
      <Box p={6}>
        <Alert status="info">
          <AlertIcon />
          No questionnaire found
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Box>
          <HStack justify="space-between" align="center" mb={2}>
            <Heading size="md">{template.title}</Heading>
            <Badge
              colorScheme={getStatusColor(response.status)}
              fontSize="sm"
              px={2}
              py={1}
              borderRadius="full"
            >
              {response.status}
            </Badge>
          </HStack>
          <Progress
            value={response.completionRate}
            size="sm"
            colorScheme="green"
            borderRadius="full"
          />
          <Text fontSize="sm" color="gray.500" mt={1}>
            {response.completionRate.toFixed(0)}% complete
          </Text>
        </Box>

        {mergedSections.map((section) => (
          <Box
            key={section.id}
            bg={bgColor}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            p={6}
          >
            <VStack spacing={6} align="stretch">
              <Box>
                <Heading size="sm" mb={2}>{section.title}</Heading>
                {section.description && (
                  <Text fontSize="sm" color="gray.600">{section.description}</Text>
                )}
              </Box>

              <Divider />

              <VStack spacing={8} align="stretch">
                {section.questions.map((question) => {
                  const response = section.responses.find(
                    r => r.questionId === question.id
                  );

                  return (
                    <FormControl
                      key={question.id}
                      isRequired={question.required}
                    >
                      <FormLabel fontSize="sm" mb={2}>
                        {question.text}
                      </FormLabel>
                      {question.description && (
                        <FormHelperText mb={2}>
                          {question.description}
                        </FormHelperText>
                      )}
                      {renderQuestionInput(section.id, question, response?.value ?? null)}
                    </FormControl>
                  );
                })}
              </VStack>
            </VStack>
          </Box>
        ))}

        {response.status === 'pending' && (
          <Button
            colorScheme="green"
            size="lg"
            onClick={onOpen}
            isLoading={isSubmitting}
          >
            Submit Questionnaire
          </Button>
        )}
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Submit Questionnaire</ModalHeader>
          <ModalBody>
            <Text>
              Are you sure you want to submit this questionnaire? You won't be able to make changes after submission.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              Submit
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};
