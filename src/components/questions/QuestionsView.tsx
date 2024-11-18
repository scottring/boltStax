import {
  Box,
  Flex,
  Button,
  Text,
  VStack,
  HStack,
  useToast,
  Alert,
  AlertIcon,
  useDisclosure,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { Question, QuestionTag, QuestionSection } from '../../types/question';
import { 
  getQuestions, 
  getTags, 
  getSections,
  deleteQuestion, 
  initializeSupplierQuestions,
  updateQuestionOrder,
  updateQuestion
} from '../../services/questions';
import { AddQuestionModal } from './AddQuestionModal';
import { TagsManager } from './TagsManager';
import { SectionsManager } from './SectionsManager';
import { ImportQuestionsModal } from './ImportQuestionsModal';
import { QuestionBankHeader } from './QuestionBankHeader';
import { QuestionList } from './QuestionList';
import { DeleteQuestionDialog } from './DeleteQuestionDialog';
import { Trash2, FolderOpen, ChevronDown } from 'lucide-react';

export const QuestionsView = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isTagsOpen,
    onOpen: onTagsOpen,
    onClose: onTagsClose
  } = useDisclosure();
  const {
    isOpen: isSectionsOpen,
    onOpen: onSectionsOpen,
    onClose: onSectionsClose
  } = useDisclosure();
  const {
    isOpen: isImportOpen,
    onOpen: onImportOpen,
    onClose: onImportClose
  } = useDisclosure();
  const {
    isOpen: isDeleteDialogOpen,
    onOpen: onDeleteDialogOpen,
    onClose: onDeleteDialogClose
  } = useDisclosure();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sections, setSections] = useState<QuestionSection[]>([]);
  const [tags, setTags] = useState<QuestionTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();

  const fetchData = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      await initializeSupplierQuestions();
      
      const [questionsData, tagsData, sectionsData] = await Promise.all([
        getQuestions(),
        getTags(),
        getSections()
      ]);
      
      setQuestions(questionsData);
      setTags(tagsData);
      setSections(sectionsData);
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
      onDeleteDialogClose();
    }
  };

  const toggleSelectQuestion = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleReorder = async (newQuestions: Question[]) => {
    setQuestions(newQuestions);

    try {
      await Promise.all(
        newQuestions.map((q, index) => 
          updateQuestionOrder(q.id, index, q.sectionId)
        )
      );

      toast({
        title: 'Question order updated',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Error updating question order',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
      });
      fetchData(); // Revert to original order on error
    }
  };

  const handleMoveToSection = async (sectionId: string | undefined) => {
    try {
      await Promise.all(
        selectedQuestions.map(questionId => {
          const question = questions.find(q => q.id === questionId);
          if (question) {
            return updateQuestion(questionId, { sectionId });
          }
          return Promise.resolve();
        })
      );

      toast({
        title: `Questions moved to ${sectionId ? sections.find(s => s.id === sectionId)?.name : 'Unsorted'}`,
        status: 'success',
        duration: 2000,
      });

      setSelectedQuestions([]);
      fetchData();
    } catch (error) {
      toast({
        title: 'Error moving questions',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };

  return (
    <Box>
      <QuestionBankHeader
        onOpenSections={onSectionsOpen}
        onOpenTags={onTagsOpen}
        onOpenImport={onImportOpen}
        onOpenAddQuestion={() => {
          setEditingQuestion(null);
          onOpen();
        }}
      />

      <Box px="6" py="4">
        {error && (
          <Alert status="error" mb={6}>
            <AlertIcon />
            {error}
          </Alert>
        )}

        {selectedQuestions.length > 0 && (
          <Flex justify="space-between" align="center" mb={4} p={4} bg="gray.50" borderRadius="md">
            <Text>{selectedQuestions.length} question(s) selected</Text>
            <HStack spacing={2}>
              <Menu>
                <MenuButton
                  as={Button}
                  leftIcon={<FolderOpen size={16} />}
                  rightIcon={<ChevronDown size={16} />}
                  size="sm"
                >
                  Move to Section
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={() => handleMoveToSection(undefined)}>
                    Unsorted
                  </MenuItem>
                  {sections.length > 0 && <MenuDivider />}
                  {sections.map(section => (
                    <MenuItem
                      key={section.id}
                      onClick={() => handleMoveToSection(section.id)}
                    >
                      {section.name}
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
              <Button
                leftIcon={<Trash2 size={16} />}
                colorScheme="red"
                size="sm"
                onClick={onDeleteDialogOpen}
              >
                Delete Selected
              </Button>
            </HStack>
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
          <QuestionList
            questions={questions}
            sections={sections}
            tags={tags}
            selectedQuestions={selectedQuestions}
            onToggleSelect={toggleSelectQuestion}
            onEdit={handleEdit}
            onDelete={onDeleteDialogOpen}
            onReorder={handleReorder}
          />
        )}
      </Box>

      <AddQuestionModal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setEditingQuestion(null);
        }}
        onQuestionAdded={fetchData}
        tags={tags}
        sections={sections}
        editingQuestion={editingQuestion}
      />

      <TagsManager
        isOpen={isTagsOpen}
        onClose={onTagsClose}
        tags={tags}
        onTagsUpdated={fetchData}
      />

      <SectionsManager
        isOpen={isSectionsOpen}
        onClose={onSectionsClose}
        onSectionsUpdated={fetchData}
      />

      <ImportQuestionsModal
        isOpen={isImportOpen}
        onClose={onImportClose}
        onQuestionsImported={fetchData}
        tags={tags}
        sections={sections}
      />

      <DeleteQuestionDialog
        isOpen={isDeleteDialogOpen}
        onClose={onDeleteDialogClose}
        onConfirm={handleDelete}
        cancelRef={cancelRef}
        selectedCount={selectedQuestions.length}
      />
    </Box>
  );
};
