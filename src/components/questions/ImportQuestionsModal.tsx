import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  Box,
  Progress,
  useToast,
  Alert,
  AlertIcon,
  Text,
  Link,
  List,
  ListItem,
  Code,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  IconButton,
  HStack,
  Input,
  Select,
  Checkbox,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { useState } from 'react';
import { FileDropzone } from './FileDropzone';
import { QuestionPreview } from './QuestionPreview';
import { AIImportChat, type FileUnderstanding } from './AIImportChat';
import { processExcelFile } from '../../services/importQuestions';
import { addQuestion } from '../../services/questions';
import type { Question, QuestionTag, QuestionSection } from '../../types/question';
import { Pencil, X } from 'lucide-react';

interface ImportQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionsImported: () => void;
  tags: QuestionTag[];
  sections: QuestionSection[];
}

export const ImportQuestionsModal = ({
  isOpen,
  onClose,
  onQuestionsImported,
  tags,
  sections,
}: ImportQuestionsModalProps) => {
  const toast = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedQuestions, setProcessedQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileUnderstanding, setFileUnderstanding] = useState<FileUnderstanding | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);
    setProcessedQuestions([]);
    setProgress(0);
    setIsProcessing(true);
    setEditingIndex(null);
    setEditingQuestion(null);

    try {
      const questions = await processExcelFile(file, tags, sections, setProgress, fileUnderstanding);
      setProcessedQuestions(questions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process file';
      setError(errorMessage);
      toast({
        title: 'Error processing file',
        description: errorMessage,
        status: 'error',
        duration: null,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      for (const question of processedQuestions) {
        await addQuestion(question);
      }
      
      toast({
        title: 'Questions imported successfully',
        description: `${processedQuestions.length} questions have been imported`,
        status: 'success',
        duration: 3000,
      });
      onQuestionsImported();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import questions';
      setError(errorMessage);
      toast({
        title: 'Error importing questions',
        description: errorMessage,
        status: 'error',
        duration: null,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnderstanding = (understanding: FileUnderstanding) => {
    setFileUnderstanding(understanding);
  };

  const handleClear = () => {
    setProcessedQuestions([]);
    setError(null);
    setProgress(0);
    setEditingIndex(null);
    setEditingQuestion(null);
    setFileUnderstanding(null);
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingQuestion({ ...processedQuestions[index] });
  };

  const saveEdit = () => {
    if (editingIndex === null || !editingQuestion) return;

    const updatedQuestions = [...processedQuestions];
    updatedQuestions[editingIndex] = editingQuestion;
    setProcessedQuestions(updatedQuestions);
    setEditingIndex(null);
    setEditingQuestion(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingQuestion(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent maxW="800px">
        <ModalHeader>Import Questions</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6}>
            {error && (
              <Alert status="error" variant="left-accent">
                <AlertIcon />
                <Box>
                  <Text fontWeight="medium" mb={2}>Error Details:</Text>
                  <Text whiteSpace="pre-wrap">{error}</Text>
                </Box>
              </Alert>
            )}

            {!processedQuestions.length && (
              <Tabs isFitted variant="enclosed" w="full">
                <TabList mb="1em">
                  <Tab>Standard Import</Tab>
                  <Tab>AI-Assisted Import</Tab>
                </TabList>

                <TabPanels>
                  <TabPanel>
                    <VStack spacing={4}>
                      <FileDropzone onFileSelect={handleFileSelect} />
                      <Box>
                        <Text fontSize="sm" fontWeight="medium" mb={2}>Required Columns:</Text>
                        <List spacing={2} fontSize="sm" color="gray.600">
                          <ListItem>
                            <Code>Question</Code> - The question text (required)
                          </ListItem>
                          <ListItem>
                            <Code>Type</Code> - Question type: text, yesNo, multipleChoice, or scale (optional)
                          </ListItem>
                          <ListItem>
                            <Code>Required</Code> - Is the question required? yes/no or true/false (optional)
                          </ListItem>
                          <ListItem>
                            <Code>Options</Code> - Comma-separated options for multiple choice questions (optional)
                          </ListItem>
                          <ListItem>
                            <Code>Tags</Code> - Comma, semicolon, or pipe-separated tags (optional)
                          </ListItem>
                          <ListItem>
                            <Code>Section</Code> - Section name for grouping questions (optional)
                          </ListItem>
                        </List>
                      </Box>
                      <Link
                        href="/template.xlsx"
                        download
                        color="green.500"
                        fontSize="sm"
                      >
                        Download template file
                      </Link>
                    </VStack>
                  </TabPanel>
                  <TabPanel>
                    <AIImportChat 
                      onUnderstanding={handleUnderstanding}
                      onFileSelect={handleFileSelect}
                    />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            )}

            {isProcessing && (
              <Box w="full">
                <Text mb={2}>Processing file...</Text>
                <Progress value={progress} size="sm" colorScheme="green" />
              </Box>
            )}

            {processedQuestions.length > 0 && (
              <VStack w="full" align="stretch" spacing={4}>
                <HStack justify="space-between">
                  <Text fontWeight="medium">
                    {processedQuestions.length} questions found:
                  </Text>
                  <Button
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    leftIcon={<X size={16} />}
                    onClick={handleClear}
                  >
                    Clear All
                  </Button>
                </HStack>
                <Box maxH="300px" overflowY="auto">
                  {processedQuestions.map((question, index) => (
                    <Box key={index} position="relative">
                      {editingIndex === index ? (
                        <Box p={4} bg="gray.50" borderRadius="md" mb={2}>
                          <VStack spacing={4}>
                            <FormControl>
                              <FormLabel>Question Text</FormLabel>
                              <Input
                                value={editingQuestion?.text || ''}
                                onChange={(e) => setEditingQuestion(prev => 
                                  prev ? { ...prev, text: e.target.value } : null
                                )}
                              />
                            </FormControl>
                            <FormControl>
                              <FormLabel>Type</FormLabel>
                              <Select
                                value={editingQuestion?.type || 'text'}
                                onChange={(e) => setEditingQuestion(prev =>
                                  prev ? { ...prev, type: e.target.value as Question['type'] } : null
                                )}
                              >
                                <option value="text">Text</option>
                                <option value="yesNo">Yes/No</option>
                                <option value="multipleChoice">Multiple Choice</option>
                                <option value="scale">Scale</option>
                              </Select>
                            </FormControl>
                            <FormControl>
                              <Checkbox
                                isChecked={editingQuestion?.required || false}
                                onChange={(e) => setEditingQuestion(prev =>
                                  prev ? { ...prev, required: e.target.checked } : null
                                )}
                              >
                                Required
                              </Checkbox>
                            </FormControl>
                            <HStack spacing={2}>
                              <Button size="sm" onClick={saveEdit} colorScheme="green">
                                Save
                              </Button>
                              <Button size="sm" onClick={cancelEdit} variant="ghost">
                                Cancel
                              </Button>
                            </HStack>
                          </VStack>
                        </Box>
                      ) : (
                        <Box position="relative">
                          <IconButton
                            aria-label="Edit question"
                            icon={<Pencil size={16} />}
                            size="sm"
                            position="absolute"
                            right={2}
                            top={2}
                            zIndex={1}
                            onClick={() => startEditing(index)}
                          />
                          <QuestionPreview
                            question={question}
                            tags={tags}
                            sections={sections}
                          />
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              </VStack>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          {processedQuestions.length > 0 && (
            <Button
              colorScheme="green"
              onClick={handleImport}
              isLoading={isProcessing}
            >
              Import {processedQuestions.length} Questions
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};