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
  VStack,
  useToast,
  Textarea,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { Question, QuestionTag, QuestionSection } from '../../types/question';
import { addQuestion, updateQuestion } from '../../services/questions';
import { TagSelector } from './TagSelector';

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionAdded: () => void;
  tags: QuestionTag[];
  sections: QuestionSection[];
  editingQuestion: Question | null;
}

export const AddQuestionModal = ({
  isOpen,
  onClose,
  onQuestionAdded,
  tags,
  sections,
  editingQuestion,
}: AddQuestionModalProps) => {
  const [text, setText] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<Question['type']>('text');
  const [required, setRequired] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | undefined>(undefined);
  const [options, setOptions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (editingQuestion) {
      setText(editingQuestion.text);
      setDescription(editingQuestion.description || '');
      setType(editingQuestion.type);
      setRequired(editingQuestion.required);
      setSelectedTags(editingQuestion.tags);
      setSelectedSection(editingQuestion.sectionId);
      setOptions(editingQuestion.options || []);
    } else {
      resetForm();
    }
  }, [editingQuestion]);

  const resetForm = () => {
    setText('');
    setDescription('');
    setType('text');
    setRequired(false);
    setSelectedTags([]);
    setSelectedSection(undefined);
    setOptions([]);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const questionData = {
        text,
        description,
        type,
        required,
        tags: selectedTags,
        sectionId: selectedSection,
        options: type === 'multipleChoice' ? options : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (editingQuestion) {
        await updateQuestion(editingQuestion.id, {
          ...questionData,
          order: editingQuestion.order
        });
        toast({
          title: 'Question updated',
          status: 'success',
          duration: 3000,
        });
      } else {
        const newQuestionId = await addQuestion({
          ...questionData,
          order: 0 // New questions are added at the beginning
        });
        console.log('New question added with ID:', newQuestionId); // Debug log
        toast({
          title: 'Question added',
          status: 'success',
          duration: 3000,
        });
      }

      onQuestionAdded();
      onClose();
      resetForm();
    } catch (error) {
      toast({
        title: 'Error saving question',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {editingQuestion ? 'Edit Question' : 'Add Question'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Question Text</FormLabel>
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter question text"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Description (Optional)</FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter additional details or instructions"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Question Type</FormLabel>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as Question['type'])}
              >
                <option value="text">Short Answer</option>
                <option value="yesNo">Yes/No</option>
                <option value="multipleChoice">Multiple Choice</option>
                <option value="scale">Scale</option>
              </Select>
            </FormControl>

            {type === 'multipleChoice' && (
              <FormControl>
                <FormLabel>Options (one per line)</FormLabel>
                <Textarea
                  value={options.join('\n')}
                  onChange={(e) => setOptions(e.target.value.split('\n').filter(Boolean))}
                  placeholder="Enter options"
                  rows={4}
                />
              </FormControl>
            )}

            <FormControl>
              <FormLabel>Section</FormLabel>
              <Select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value || undefined)}
              >
                <option value="">Unsorted</option>
                {sections.map(section => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Tags</FormLabel>
              <TagSelector
                availableTags={tags}
                selectedTagIds={selectedTags}
                onChange={setSelectedTags}
              />
            </FormControl>

            <FormControl>
              <Checkbox
                isChecked={required}
                onChange={(e) => setRequired(e.target.checked)}
              >
                Required
              </Checkbox>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={!text || (type === 'multipleChoice' && options.length === 0)}
          >
            {editingQuestion ? 'Save Changes' : 'Add Question'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
