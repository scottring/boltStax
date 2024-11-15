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
  FormErrorMessage,
  VStack,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tag,
  Box,
  IconButton,
  HStack,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { useState, useRef } from 'react';
import { QuestionTagSchema, type QuestionTag } from '../../types/question';
import { addTag, updateTag, deleteTag } from '../../services/questions';
import { Edit2, Trash2 } from 'lucide-react';

interface TagsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  tags: QuestionTag[];
  onTagsUpdated: () => void;
}

export const TagsManager = ({
  isOpen,
  onClose,
  tags,
  onTagsUpdated,
}: TagsManagerProps) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingTag, setEditingTag] = useState<QuestionTag | null>(null);
  const [deleteTagId, setDeleteTagId] = useState<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#4299E1',
    description: '',
  });

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const tagData = {
        ...formData,
        id: editingTag?.id || Date.now().toString(),
      };

      const validationResult = QuestionTagSchema.safeParse(tagData);

      if (!validationResult.success) {
        const formattedErrors: Record<string, string> = {};
        validationResult.error.issues.forEach(issue => {
          formattedErrors[issue.path[0].toString()] = issue.message;
        });
        setErrors(formattedErrors);
        return;
      }

      if (editingTag) {
        await updateTag(tagData);
        toast({
          title: 'Tag updated successfully',
          status: 'success',
          duration: 3000,
        });
      } else {
        await addTag(tagData);
        toast({
          title: 'Tag added successfully',
          status: 'success',
          duration: 3000,
        });
      }
      
      onTagsUpdated();
      resetForm();
    } catch (error) {
      toast({
        title: editingTag ? 'Error updating tag' : 'Error adding tag',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (tag: QuestionTag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color,
      description: tag.description || '',
    });
  };

  const handleDelete = async () => {
    if (!deleteTagId) return;

    try {
      await deleteTag(deleteTagId);
      toast({
        title: 'Tag deleted successfully',
        status: 'success',
        duration: 3000,
      });
      onTagsUpdated();
    } catch (error) {
      toast({
        title: 'Error deleting tag',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setDeleteTagId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      color: '#4299E1',
      description: '',
    });
    setEditingTag(null);
    setErrors({});
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Manage Tags</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6}>
              <Box w="full">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Tag</Th>
                      <Th>Description</Th>
                      <Th width="100px">Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {tags.map((tag) => (
                      <Tr key={tag.id}>
                        <Td>
                          <Tag
                            size="md"
                            borderRadius="full"
                            variant="subtle"
                            bgColor={tag.color + '20'}
                          >
                            {tag.name}
                          </Tag>
                        </Td>
                        <Td>{tag.description || '-'}</Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              aria-label="Edit tag"
                              icon={<Edit2 size={16} />}
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(tag)}
                            />
                            <IconButton
                              aria-label="Delete tag"
                              icon={<Trash2 size={16} />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => setDeleteTagId(tag.id)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>

              <Box w="full" pt={6} borderTop="1px" borderColor="gray.200">
                <VStack spacing={4}>
                  <FormControl isInvalid={!!errors.name}>
                    <FormLabel>Tag Name</FormLabel>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter tag name"
                    />
                    <FormErrorMessage>{errors.name}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.color}>
                    <FormLabel>Color</FormLabel>
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    />
                    <FormErrorMessage>{errors.color}</FormErrorMessage>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Description (Optional)</FormLabel>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter tag description"
                    />
                  </FormControl>
                </VStack>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            {editingTag && (
              <Button variant="ghost" mr={3} onClick={resetForm}>
                Cancel Edit
              </Button>
            )}
            <Button variant="ghost" mr={3} onClick={onClose}>
              Close
            </Button>
            <Button
              colorScheme="green"
              onClick={handleSubmit}
              isLoading={isLoading}
            >
              {editingTag ? 'Update Tag' : 'Add Tag'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={!!deleteTagId}
        leastDestructiveRef={cancelRef}
        onClose={() => setDeleteTagId(null)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Tag
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setDeleteTagId(null)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};