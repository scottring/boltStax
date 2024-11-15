import {
  Box,
  Flex,
  Button,
  Heading,
  useDisclosure,
  Text,
  VStack,
  HStack,
  useToast,
  Alert,
  AlertIcon,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Checkbox,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tag,
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { Question, QuestionTag } from '../../types/question';
import { getQuestions, getTags, deleteQuestion, initializeSupplierQuestions } from '../../services/questions';
import { AddQuestionModal } from './AddQuestionModal';
import { TagsManager } from './TagsManager';
import { ImportQuestionsModal } from './ImportQuestionsModal';
import { MoreVertical, Edit2, Trash2 } from 'lucide-react';

export const QuestionsView = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isTagsOpen,
    onOpen: onTagsOpen,
    onClose: onTagsClose
  } = useDisclosure();
  const {
    isOpen: isImportOpen,
    onOpen: onImportOpen,
    onClose: onImportClose
  } = useDisclosure();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tags, setTags] = useState<QuestionTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();

  const fetchData = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      await initializeSupplierQuestions();
      
      const [questionsData, tagsData] = await Promise.all([
        getQuestions(),
        getTags()
      ]);
      
      setQuestions(questionsData);
      setTags(tagsData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: 'Error fetching data',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    onOpen();
  };

  const handleDelete = async () => {
    try {
      await Promise.all(selectedQuestions.map(id => deleteQuestion(id)));
      toast({
        title: 'Questions deleted successfully',
        status: 'success',
        duration: 3000,
      });
      setSelectedQuestions([]);
      fetchData();
    } catch (error) {
      toast({
        title: 'Error deleting questions',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedQuestions.length === questions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(questions.map(q => q.id));
    }
  };

  const toggleSelectQuestion = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
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
    <Box p={8}>
      <Flex justify="space-between" align="center" mb={8}>
        <Heading size="lg">Question Bank</Heading>
        <HStack spacing={4}>
          <Button onClick={onTagsOpen}>Manage Tags</Button>
          <Button onClick={onImportOpen}>Import Questions</Button>
          <Button 
            onClick={() => {
              setEditingQuestion(null);
              onOpen();
            }}
          >
            Add New Question
          </Button>
        </HStack>
      </Flex>

      {error && (
        <Alert status="error" mb={6}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {selectedQuestions.length > 0 && (
        <Flex justify="space-between" align="center" mb={4} p={4} bg="gray.50" borderRadius="md">
          <Text>{selectedQuestions.length} question(s) selected</Text>
          <Button
            leftIcon={<Trash2 size={16} />}
            colorScheme="red"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            Delete Selected
          </Button>
        </Flex>
      )}

      {isLoading ? (
        <Text>Loading questions...</Text>
      ) : questions.length === 0 ? (
        <VStack spacing={4} py={8}>
          <Text color="gray.500">No questions available</Text>
          <HStack spacing={4}>
            <Button onClick={onImportOpen}>Import Questions</Button>
            <Button onClick={onOpen}>Add Your First Question</Button>
          </HStack>
        </VStack>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th width="40px">
                  <Checkbox
                    isChecked={selectedQuestions.length === questions.length}
                    isIndeterminate={selectedQuestions.length > 0 && selectedQuestions.length < questions.length}
                    onChange={toggleSelectAll}
                  />
                </Th>
                <Th>Question</Th>
                <Th>Type</Th>
                <Th>Tags</Th>
                <Th width="100px">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {questions.map((question) => (
                <Tr key={question.id}>
                  <Td>
                    <Checkbox
                      isChecked={selectedQuestions.includes(question.id)}
                      onChange={() => toggleSelectQuestion(question.id)}
                    />
                  </Td>
                  <Td>
                    <VStack align="start" spacing={1}>
                      <Text>{question.text}</Text>
                      {question.description && (
                        <Text fontSize="sm" color="gray.600">
                          {question.description}
                        </Text>
                      )}
                    </VStack>
                  </Td>
                  <Td>
                    <Badge colorScheme={getTypeColor(question.type)}>
                      {getTypeLabel(question.type)}
                    </Badge>
                    {question.required && (
                      <Badge ml={2} colorScheme="red">Required</Badge>
                    )}
                  </Td>
                  <Td>
                    <Flex gap={2} flexWrap="wrap">
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
                  </Td>
                  <Td>
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
                          onClick={() => handleEdit(question)}
                        >
                          Edit
                        </MenuItem>
                        <MenuItem
                          icon={<Trash2 size={16} />}
                          color="red.500"
                          onClick={() => {
                            setSelectedQuestions([question.id]);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          Delete
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      <AddQuestionModal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setEditingQuestion(null);
        }}
        onQuestionAdded={fetchData}
        tags={tags}
        editingQuestion={editingQuestion}
      />

      <TagsManager
        isOpen={isTagsOpen}
        onClose={onTagsClose}
        tags={tags}
        onTagsUpdated={fetchData}
      />

      <ImportQuestionsModal
        isOpen={isImportOpen}
        onClose={onImportClose}
        onQuestionsImported={fetchData}
        tags={tags}
        sections={[]}
      />

      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete {selectedQuestions.length === 1 ? 'Question' : 'Questions'}
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete {selectedQuestions.length === 1 ? 'this question' : `these ${selectedQuestions.length} questions`}? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};