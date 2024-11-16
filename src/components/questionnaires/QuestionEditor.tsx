import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Switch,
  HStack,
  IconButton,
  Button,
  useColorModeValue,
  Collapse,
  Text,
  FormHelperText,
  Divider,
  Tag,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import type { Question, QuestionType, QuestionOption } from '../../types/questionnaire';

interface QuestionEditorProps {
  question: Question;
  onChange: (updates: Partial<Question>) => void;
  onDelete: () => void;
  availableTags: { id: string; name: string; color: string }[];
}

export const QuestionEditor = ({
  question,
  onChange,
  onDelete,
  availableTags
}: QuestionEditorProps) => {
  const [showValidation, setShowValidation] = useState(false);
  const [showOptions, setShowOptions] = useState(
    question.type === 'singleChoice' || question.type === 'multiChoice'
  );

  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    setShowOptions(question.type === 'singleChoice' || question.type === 'multiChoice');
  }, [question.type]);

  const questionTypes: { value: QuestionType; label: string }[] = [
    { value: 'shortText', label: 'Short Text' },
    { value: 'longText', label: 'Long Text' },
    { value: 'singleChoice', label: 'Single Choice' },
    { value: 'multiChoice', label: 'Multiple Choice' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'file', label: 'File Upload' },
    { value: 'boolean', label: 'Yes/No' }
  ];

  const addOption = () => {
    const newOption: QuestionOption = {
      id: `option-${Date.now()}`,
      text: '',
      value: ''
    };
    onChange({
      options: [...(question.options || []), newOption]
    });
  };

  const updateOption = (index: number, updates: Partial<QuestionOption>) => {
    const newOptions = [...(question.options || [])];
    newOptions[index] = { ...newOptions[index], ...updates };
    onChange({ options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = [...(question.options || [])];
    newOptions.splice(index, 1);
    onChange({ options: newOptions });
  };

  const toggleTag = (tagId: string) => {
    const newTags = question.tags.includes(tagId)
      ? question.tags.filter(id => id !== tagId)
      : [...question.tags, tagId];
    onChange({ tags: newTags });
  };

  return (
    <Box
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      p={4}
      bg={bgColor}
    >
      <VStack spacing={4} align="stretch">
        <HStack spacing={4}>
          <IconButton
            aria-label="Drag question"
            icon={<GripVertical size={16} />}
            variant="ghost"
            size="sm"
            cursor="grab"
          />
          <FormControl flex={1}>
            <Input
              value={question.text}
              onChange={(e) => onChange({ text: e.target.value })}
              placeholder="Question text"
              size="sm"
            />
          </FormControl>
          <IconButton
            aria-label="Delete question"
            icon={<Trash2 size={16} />}
            variant="ghost"
            colorScheme="red"
            size="sm"
            onClick={onDelete}
          />
        </HStack>

        <HStack spacing={4}>
          <FormControl flex={1}>
            <Select
              value={question.type}
              onChange={(e) => onChange({ type: e.target.value as QuestionType })}
              size="sm"
            >
              {questionTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl width="auto">
            <HStack>
              <FormLabel htmlFor="required" mb={0} fontSize="sm">
                Required
              </FormLabel>
              <Switch
                id="required"
                isChecked={question.required}
                onChange={(e) => onChange({ required: e.target.checked })}
                size="sm"
              />
            </HStack>
          </FormControl>
        </HStack>

        <FormControl>
          <Textarea
            value={question.description || ''}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Question description (optional)"
            size="sm"
            rows={2}
          />
        </FormControl>

        {showOptions && (
          <Box>
            <Text fontSize="sm" mb={2}>Options</Text>
            <VStack spacing={2} align="stretch">
              {question.options?.map((option, index) => (
                <HStack key={option.id}>
                  <Input
                    value={option.text}
                    onChange={(e) => updateOption(index, { text: e.target.value })}
                    placeholder="Option text"
                    size="sm"
                  />
                  <Input
                    value={option.value}
                    onChange={(e) => updateOption(index, { value: e.target.value })}
                    placeholder="Value"
                    size="sm"
                    width="120px"
                  />
                  <IconButton
                    aria-label="Remove option"
                    icon={<Trash2 size={14} />}
                    size="sm"
                    variant="ghost"
                    onClick={() => removeOption(index)}
                  />
                </HStack>
              ))}
              <Button
                leftIcon={<Plus size={14} />}
                variant="ghost"
                size="sm"
                onClick={addOption}
              >
                Add Option
              </Button>
            </VStack>
          </Box>
        )}

        <Box>
          <Text fontSize="sm" mb={2}>Tags</Text>
          <Wrap spacing={2}>
            {availableTags.map(tag => (
              <WrapItem key={tag.id}>
                <Tag
                  size="sm"
                  variant={question.tags.includes(tag.id) ? 'solid' : 'outline'}
                  colorScheme="green"
                  cursor="pointer"
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </Tag>
              </WrapItem>
            ))}
          </Wrap>
        </Box>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowValidation(!showValidation)}
        >
          {showValidation ? 'Hide Validation' : 'Show Validation'}
        </Button>

        <Collapse in={showValidation}>
          <VStack spacing={3} align="stretch">
            {question.type === 'number' && (
              <HStack spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm">Minimum</FormLabel>
                  <Input
                    type="number"
                    value={question.validation?.min || ''}
                    onChange={(e) => onChange({
                      validation: {
                        ...question.validation,
                        min: e.target.value ? Number(e.target.value) : undefined
                      }
                    })}
                    size="sm"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Maximum</FormLabel>
                  <Input
                    type="number"
                    value={question.validation?.max || ''}
                    onChange={(e) => onChange({
                      validation: {
                        ...question.validation,
                        max: e.target.value ? Number(e.target.value) : undefined
                      }
                    })}
                    size="sm"
                  />
                </FormControl>
              </HStack>
            )}

            {(question.type === 'shortText' || question.type === 'longText') && (
              <FormControl>
                <FormLabel fontSize="sm">Pattern (Regex)</FormLabel>
                <Input
                  value={question.validation?.pattern || ''}
                  onChange={(e) => onChange({
                    validation: {
                      ...question.validation,
                      pattern: e.target.value
                    }
                  })}
                  placeholder="e.g. ^[A-Za-z]+$"
                  size="sm"
                />
                <FormHelperText fontSize="xs">
                  Enter a regular expression pattern for validation
                </FormHelperText>
              </FormControl>
            )}

            {question.type === 'file' && (
              <FormControl>
                <FormLabel fontSize="sm">Allowed File Types</FormLabel>
                <Input
                  value={question.validation?.allowedFileTypes?.join(', ') || ''}
                  onChange={(e) => onChange({
                    validation: {
                      ...question.validation,
                      allowedFileTypes: e.target.value.split(',').map(t => t.trim())
                    }
                  })}
                  placeholder="e.g. .pdf, .doc, .docx"
                  size="sm"
                />
                <FormHelperText fontSize="xs">
                  Enter file extensions separated by commas
                </FormHelperText>
              </FormControl>
            )}
          </VStack>
        </Collapse>
      </VStack>
    </Box>
  );
};
