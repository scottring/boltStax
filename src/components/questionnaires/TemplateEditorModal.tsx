import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Box,
  Text,
  useToast,
  Textarea,
  Divider,
  IconButton,
  Flex,
  useColorModeValue,
  Tooltip,
  FormErrorMessage,
  Collapse
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import type { QuestionnaireTemplate, QuestionnaireSection, Question } from '../../types/questionnaire';
import { createTemplate, updateTemplate } from '../../services/questionnaireTemplates';
import { TagSelector } from '../questions/TagSelector';
import { QuestionEditor } from './QuestionEditor';

interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  template?: QuestionnaireTemplate;
  onSaved: () => void;
  availableTags: { id: string; name: string; color: string }[];
}

export const TemplateEditorModal = ({
  isOpen,
  onClose,
  template,
  onSaved,
  availableTags
}: TemplateEditorModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: [] as string[],
    sections: [] as QuestionnaireSection[]
  });

  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  useEffect(() => {
    if (template) {
      setFormData({
        title: template.title,
        description: template.description,
        tags: template.tags,
        sections: template.sections
      });
      setExpandedSections([template.sections[0]?.id || '']);
    } else {
      setFormData({
        title: '',
        description: '',
        tags: [],
        sections: []
      });
      setExpandedSections([]);
    }
  }, [template]);

  const borderColor = useColorModeValue('gray.100', 'gray.600');
  const sectionBg = useColorModeValue('gray.50', 'gray.700');

  const handleSave = async () => {
    setErrors({});
    if (!formData.title.trim()) {
      setErrors(prev => ({ ...prev, title: 'Title is required' }));
      return;
    }
    if (formData.sections.length === 0) {
      setErrors(prev => ({ ...prev, sections: 'At least one section is required' }));
      return;
    }

    setIsLoading(true);
    try {
      if (template) {
        await updateTemplate(
          template.id,
          {
            ...formData,
            updatedAt: Timestamp.now()
          },
          'Updated template content'
        );
      } else {
        await createTemplate({
          ...formData,
          createdBy: 'current-user-id', // TODO: Get from auth context
          isArchived: false
        });
      }

      toast({
        title: template ? 'Template updated' : 'Template created',
        status: 'success',
        duration: 3000
      });

      onSaved();
      onClose();
    } catch (error) {
      toast({
        title: 'Error saving template',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addSection = () => {
    const newSection: QuestionnaireSection = {
      id: `temp-${Date.now()}`,
      title: '',
      description: '',
      questions: [],
      order: formData.sections.length
    };
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
    setExpandedSections(prev => [...prev, newSection.id]);
  };

  const updateSection = (index: number, updates: Partial<QuestionnaireSection>) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === index ? { ...section, ...updates } : section
      )
    }));
  };

  const removeSection = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === formData.sections.length - 1)
    ) {
      return;
    }

    const newSections = [...formData.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    
    newSections.forEach((section, i) => {
      section.order = i;
    });

    setFormData(prev => ({
      ...prev,
      sections: newSections
    }));
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const addQuestion = (sectionIndex: number) => {
    const newQuestion: Question = {
      id: `temp-${Date.now()}`,
      text: '',
      type: 'shortText',
      required: false,
      tags: [],
      validation: {}
    };

    updateSection(sectionIndex, {
      questions: [...formData.sections[sectionIndex].questions, newQuestion]
    });
  };

  const updateQuestion = (sectionIndex: number, questionIndex: number, updates: Partial<Question>) => {
    const newQuestions = [...formData.sections[sectionIndex].questions];
    newQuestions[questionIndex] = { ...newQuestions[questionIndex], ...updates };
    updateSection(sectionIndex, { questions: newQuestions });
  };

  const removeQuestion = (sectionIndex: number, questionIndex: number) => {
    const newQuestions = [...formData.sections[sectionIndex].questions];
    newQuestions.splice(questionIndex, 1);
    updateSection(sectionIndex, { questions: newQuestions });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay bg="blackAlpha.200" backdropFilter="blur(2px)" />
      <ModalContent borderRadius="xl">
        <ModalHeader pt={6}>
          {template ? 'Edit Template' : 'Create Template'}
        </ModalHeader>

        <ModalBody>
          <VStack spacing={6}>
            <FormControl isInvalid={!!errors.title}>
              <FormLabel fontSize="sm">Template Name</FormLabel>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter template name"
                size="sm"
              />
              <FormErrorMessage>{errors.title}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Description</FormLabel>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter template description"
                size="sm"
                rows={3}
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Tags</FormLabel>
              <TagSelector
                selectedTagIds={formData.tags}
                onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
                availableTags={availableTags}
              />
            </FormControl>

            <Divider borderColor={borderColor} />

            <FormControl isInvalid={!!errors.sections}>
              <Flex justify="space-between" align="center" mb={4}>
                <FormLabel fontSize="sm" mb={0}>Sections</FormLabel>
                <Tooltip label="Add Section" hasArrow>
                  <IconButton
                    aria-label="Add section"
                    icon={<Plus size={16} />}
                    size="sm"
                    variant="ghost"
                    onClick={addSection}
                  />
                </Tooltip>
              </Flex>
              <FormErrorMessage>{errors.sections}</FormErrorMessage>

              <VStack spacing={4} align="stretch">
                {formData.sections.map((section, sectionIndex) => (
                  <Box
                    key={section.id}
                    bg={sectionBg}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor={borderColor}
                  >
                    <Flex p={4} gap={2} onClick={() => toggleSection(section.id)} cursor="pointer">
                      <Box>
                        <IconButton
                          aria-label="Move section"
                          icon={<GripVertical size={16} />}
                          size="sm"
                          variant="ghost"
                          cursor="grab"
                          onClick={e => e.stopPropagation()}
                        />
                      </Box>
                      <VStack flex={1} align="stretch" spacing={3}>
                        <Input
                          value={section.title}
                          onChange={(e) => updateSection(sectionIndex, { title: e.target.value })}
                          placeholder="Section title"
                          size="sm"
                          onClick={e => e.stopPropagation()}
                        />
                        <Textarea
                          value={section.description || ''}
                          onChange={(e) => updateSection(sectionIndex, { description: e.target.value })}
                          placeholder="Section description"
                          size="sm"
                          rows={2}
                          onClick={e => e.stopPropagation()}
                        />
                      </VStack>
                      <VStack>
                        <IconButton
                          aria-label="Move up"
                          icon={<ChevronUp size={16} />}
                          size="sm"
                          variant="ghost"
                          isDisabled={sectionIndex === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(sectionIndex, 'up');
                          }}
                        />
                        <IconButton
                          aria-label="Move down"
                          icon={<ChevronDown size={16} />}
                          size="sm"
                          variant="ghost"
                          isDisabled={sectionIndex === formData.sections.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(sectionIndex, 'down');
                          }}
                        />
                        <IconButton
                          aria-label="Remove section"
                          icon={<Trash2 size={16} />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSection(sectionIndex);
                          }}
                        />
                      </VStack>
                    </Flex>

                    <Collapse in={expandedSections.includes(section.id)}>
                      <Box p={4} pt={0}>
                        <Divider my={4} borderColor={borderColor} />
                        <VStack spacing={4} align="stretch">
                          {section.questions.map((question, questionIndex) => (
                            <QuestionEditor
                              key={question.id}
                              question={question}
                              onChange={(updates) => updateQuestion(sectionIndex, questionIndex, updates)}
                              onDelete={() => removeQuestion(sectionIndex, questionIndex)}
                              availableTags={availableTags}
                            />
                          ))}
                          <Button
                            leftIcon={<Plus size={14} />}
                            variant="ghost"
                            size="sm"
                            onClick={() => addQuestion(sectionIndex)}
                          >
                            Add Question
                          </Button>
                        </VStack>
                      </Box>
                    </Collapse>
                  </Box>
                ))}
              </VStack>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px" borderColor={borderColor} gap={2}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            colorScheme="green"
            size="sm"
            onClick={handleSave}
            isLoading={isLoading}
          >
            {template ? 'Save Changes' : 'Create Template'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
