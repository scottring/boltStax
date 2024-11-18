import {
  Box,
  Flex,
  Checkbox,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tag,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { Question, QuestionTag } from '../../types/question';
import { MoreVertical, Edit2, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

interface QuestionItemProps {
  question: Question;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  tags: QuestionTag[];
  selectedQuestions: string[];
  onToggleSelect: (id: string) => void;
  onEdit: (question: Question) => void;
  onDelete: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export const QuestionItem = ({
  question,
  index,
  isFirst,
  isLast,
  tags,
  selectedQuestions,
  onToggleSelect,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: QuestionItemProps) => {
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

  return (
    <Box
      bg="white"
      p={4}
      borderWidth="1px"
      borderRadius="md"
      mb={2}
      position="relative"
      transition="all 0.2s"
      _hover={{
        '& .move-buttons': {
          opacity: 1
        }
      }}
    >
      <Flex align="center">
        <Box 
          mr={4}
          className="move-buttons"
          opacity={0.5}
          transition="opacity 0.2s"
        >
          <Tooltip label={isFirst ? 'Already at top' : 'Move up'} placement="left">
            <IconButton
              aria-label="Move up"
              icon={<ChevronUp size={16} />}
              size="sm"
              variant="ghost"
              isDisabled={isFirst}
              onClick={() => onMoveUp(index)}
              mb={1}
              _hover={{ bg: 'gray.100' }}
              _active={{ bg: 'gray.200' }}
            />
          </Tooltip>
          <Tooltip label={isLast ? 'Already at bottom' : 'Move down'} placement="left">
            <IconButton
              aria-label="Move down"
              icon={<ChevronDown size={16} />}
              size="sm"
              variant="ghost"
              isDisabled={isLast}
              onClick={() => onMoveDown(index)}
              _hover={{ bg: 'gray.100' }}
              _active={{ bg: 'gray.200' }}
            />
          </Tooltip>
        </Box>
        <Checkbox
          isChecked={selectedQuestions.includes(question.id)}
          onChange={() => onToggleSelect(question.id)}
          mr={4}
        />
        <Box flex="1">
          <Text>{question.text}</Text>
          <Flex gap={2} mt={2} flexWrap="wrap">
            <Badge colorScheme={getTypeColor(question.type)}>
              {getTypeLabel(question.type)}
            </Badge>
            {question.required && (
              <Badge colorScheme="red">Required</Badge>
            )}
            {question.tags.map((tagId) => {
              const tag = tags.find(t => t.id === tagId);
              return tag ? (
                <Tag
                  key={tagId}
                  size="sm"
                  borderRadius="full"
                  variant="subtle"
                  bgColor={`${tag.color}20`}
                >
                  {tag.name}
                </Tag>
              ) : null;
            })}
          </Flex>
        </Box>
        <Menu>
          <MenuButton
            as={IconButton}
            icon={<MoreVertical size={16} />}
            variant="ghost"
            size="sm"
          />
          <MenuList>
            <MenuItem
              icon={<Edit2 size={16} />}
              onClick={() => onEdit(question)}
            >
              Edit
            </MenuItem>
            <MenuItem
              icon={<Trash2 size={16} />}
              color="red.500"
              onClick={() => onDelete(question.id)}
            >
              Delete
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    </Box>
  );
};
