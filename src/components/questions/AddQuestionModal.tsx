import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Checkbox,
  FormErrorMessage,
  VStack,
  useToast,
  Tag,
  TagLabel,
  HStack,
  Box,
  Textarea,
  IconButton,
  Collapse,
  Text,
} from '@chakra-ui/react';
import { useState } from 'react';
import { QuestionSchema, type QuestionTag } from '../../types/question';
import { addQuestion } from '../../services/questions';
import { Plus, Minus, X } from 'lucide-react';
import { TagSelector } from './TagSelector';

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionAdded: () => void;
  tags: QuestionTag[];
}

export const AddQuestionModal = ({
  isOpen,
  onClose,
  onQuestionAdded,
  tags,
}: AddQuestionModalProps) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showOptions, setShowOptions] = useState(false);
  const [formData, setFormData] = useState({
    text: '',
    type: 'text',
    tags: [] as string[],
    required: true,
    options: [] as string[],
    description: '',
  });

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const now = new Date();
      const newQuestion = {
        ...formData,
        id: Date.now().toString(),
        createdAt: now,
        updatedAt: now,
        order: 0,
      };

      const validationResult = QuestionSchema.safeParse(newQuestion);

      if (!validationResult.success) {
        const formattedErrors: Record<string, string> = {};
        validationResult.error.issues.forEach(issue => {
          formattedErrors[issue.path[0].toString()] = issue.message;
        });
        setErrors(formattedErrors);
        setIsLoading(false);
        return;
      }

      await addQuestion(newQuestion);
      
      toast({
        title: 'Question added successfully',
        status: 'success',
        duration: 3000,
      });
      
      onQuestionAdded();
      onClose();
      setFormData({
        text: '',
        type: 'text',
        tags: [],
        required: true,
        options: [],
        description: '',
      });
      setShowOptions(false);
    } catch (error) {
      toast({
        title: 'Error adding question',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const handleTypeChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      type,
      options: type === 'multipleChoice' ? [''] : []
    }));
    setShowOptions(type === 'multipleChoice');
  };

  const handleTagsChange = (selectedTags: string[]) => {
    setFormData(prev => ({
      ...prev,
      tags: selectedTags
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add New Question</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6}>
            <FormControl isInvalid={!!errors.text}>
              <FormLabel>Question Text</FormLabel>
              <Input
                value={formData.text}
                onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                placeholder="Enter your question"
              />
              <FormErrorMessage>{errors.text}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>Description (Optional)</FormLabel>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add additional context or instructions for this question"
                rows={2}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Question Type</FormLabel>
              <Select
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value)}
              >
                <option value="text">Short Answer</option>
                <option value="yesNo">Yes/No</option>
                <option value="multipleChoice">Multiple Choice</option>
                <option value="scale">Scale</option>
              </Select>
            </FormControl>

            <Collapse in={showOptions} animateOpacity>
              <Box w="full" py={2}>
                <FormControl>
                  <FormLabel>Options</FormLabel>
                  <VStack spacing={2} align="stretch">
                    {formData.options.map((option, index) => (
                      <HStack key={index}>
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                        />
                        <IconButton
                          aria-label="Remove option"
                          icon={<Minus size={16} />}
                          onClick={() => removeOption(index)}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                        />
                      </HStack>
                    ))}
                    <Button
                      leftIcon={<Plus size={16} />}
                      variant="ghost"
                      size="sm"
                      onClick={addOption}
                      w="fit-content"
                    >
                      Add Option
                    </Button>
                  </VStack>
                </FormControl>
              </Box>
            </Collapse>

            <FormControl isInvalid={!!errors.tags}>
              <FormLabel>Tags</FormLabel>
              <TagSelector
                availableTags={tags}
                selectedTagIds={formData.tags}
                onChange={handleTagsChange}
              />
              <FormErrorMessage>{errors.tags}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <Checkbox
                isChecked={formData.required}
                onChange={(e) => setFormData(prev => ({ ...prev, required: e.target.checked }))}
                colorScheme="green"
              >
                This question requires an answer
              </Checkbox>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="green"
            onClick={handleSubmit}
            isLoading={isLoading}
            leftIcon={<Plus size={16} />}
          >
            Add Question
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};