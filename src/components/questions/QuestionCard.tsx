import {
  Box,
  Text,
  Tag,
  TagLabel,
  VStack,
  HStack,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Collapse,
  List,
  ListItem,
} from '@chakra-ui/react';
import { useState } from 'react';
import { MoreVertical, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { Question, QuestionTag } from '../../types/question';

interface QuestionCardProps {
  question: Question;
  tags: QuestionTag[];
  onEdit?: (question: Question) => void;
  onDelete?: (questionId: string) => void;
}

export const QuestionCard = ({ 
  question, 
  tags,
  onEdit,
  onDelete,
}: QuestionCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTagColor = (tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    return tag?.color || 'gray.500';
  };

  const getTypeColor = (type: Question['type']) => {
    switch (type) {
      case 'text':
        return 'blue';
      case 'yesNo':
        return 'green';
      case 'multipleChoice':
        return 'purple';
      case 'scale':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getTypeLabel = (type: Question['type']) => {
    switch (type) {
      case 'text':
        return 'Short Answer';
      case 'yesNo':
        return 'Yes/No';
      case 'multipleChoice':
        return 'Multiple Choice';
      case 'scale':
        return 'Scale';
      default:
        return type;
    }
  };

  return (
    <Box
      bg="white"
      p={5}
      borderRadius="lg"
      shadow="sm"
      border="1px"
      borderColor="gray.100"
      transition="all 0.2s"
      _hover={{ shadow: 'md' }}
      position="relative"
    >
      <VStack align="stretch" spacing={4}>
        <HStack justify="space-between" align="flex-start">
          <VStack align="stretch" spacing={2} flex={1}>
            <Text fontSize="md" fontWeight="medium">
              {question.text}
            </Text>
            {question.description && (
              <Text fontSize="sm" color="gray.600">
                {question.description}
              </Text>
            )}
          </VStack>
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<MoreVertical size={16} />}
              variant="ghost"
              size="sm"
              aria-label="More options"
            />
            <MenuList>
              {onEdit && (
                <MenuItem icon={<Edit2 size={16} />} onClick={() => onEdit(question)}>
                  Edit
                </MenuItem>
              )}
              {onDelete && (
                <MenuItem 
                  icon={<Trash2 size={16} />} 
                  onClick={() => onDelete(question.id)}
                  color="red.500"
                >
                  Delete
                </MenuItem>
              )}
            </MenuList>
          </Menu>
        </HStack>

        <HStack spacing={2} flexWrap="wrap">
          <Badge colorScheme={getTypeColor(question.type)}>
            {getTypeLabel(question.type)}
          </Badge>
          {question.required && (
            <Badge colorScheme="red">
              Required
            </Badge>
          )}
        </HStack>

        {question.options && question.options.length > 0 && (
          <Box>
            <HStack 
              spacing={2} 
              cursor="pointer" 
              onClick={() => setIsExpanded(!isExpanded)}
              color="gray.600"
            >
              <Text fontSize="sm" fontWeight="medium">Options</Text>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </HStack>
            <Collapse in={isExpanded}>
              <List spacing={1} mt={2}>
                {question.options.map((option, index) => (
                  <ListItem key={index} fontSize="sm" color="gray.600">
                    • {option}
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </Box>
        )}

        <Box>
          <Text fontSize="sm" color="gray.500" mb={2}>
            Tags:
          </Text>
          <HStack spacing={2} flexWrap="wrap">
            {question.tags.map((tagId) => {
              const tag = tags.find(t => t.id === tagId);
              return tag ? (
                <Tag
                  key={tagId}
                  size="sm"
                  borderRadius="full"
                  variant="subtle"
                  bgColor={tag.color + '20'}
                >
                  <TagLabel>{tag.name}</TagLabel>
                </Tag>
              ) : null;
            })}
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};