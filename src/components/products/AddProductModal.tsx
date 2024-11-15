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
  FormErrorMessage,
  VStack,
  useToast,
  HStack,
  Tag,
  Input,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { ProductSchema } from '../../types/product';
import { addProduct } from '../../services/products';
import { getTags } from '../../services/questions';
import type { QuestionTag } from '../../types/question';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
  supplierId: string;
}

export const AddProductModal = ({
  isOpen,
  onClose,
  onProductAdded,
  supplierId,
}: AddProductModalProps) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tags, setTags] = useState<QuestionTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<QuestionTag[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    tags: [] as string[],
  });

  useEffect(() => {
    const loadTags = async () => {
      try {
        const fetchedTags = await getTags();
        setTags(fetchedTags);
      } catch (error) {
        toast({
          title: 'Error loading tags',
          description: error instanceof Error ? error.message : 'An unexpected error occurred',
          status: 'error',
          duration: 5000,
        });
      }
    };

    if (isOpen) {
      loadTags();
    }
  }, [isOpen, toast]);

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const newProduct = {
        ...formData,
        id: Date.now().toString(),
        supplierId,
        lastUpdated: new Date(),
      };

      const validationResult = ProductSchema.safeParse(newProduct);

      if (!validationResult.success) {
        const formattedErrors: Record<string, string> = {};
        validationResult.error.issues.forEach(issue => {
          formattedErrors[issue.path[0].toString()] = issue.message;
        });
        setErrors(formattedErrors);
        return;
      }

      await addProduct(newProduct);
      
      toast({
        title: 'Product added successfully',
        status: 'success',
        duration: 3000,
      });
      
      onProductAdded();
      onClose();
      setFormData({
        name: '',
        tags: [],
      });
      setSelectedTags([]);
    } catch (error) {
      toast({
        title: 'Error adding product',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchValue.toLowerCase()) &&
    !selectedTags.some(selected => selected.id === tag.id)
  );

  const addTag = (tag: QuestionTag) => {
    setSelectedTags(prev => [...prev, tag]);
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, tag.name]
    }));
    setSearchValue('');
  };

  const removeTag = (tagToRemove: QuestionTag) => {
    setSelectedTags(prev => prev.filter(tag => tag.id !== tagToRemove.id));
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove.name)
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add New Product</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6}>
            <FormControl isInvalid={!!errors.name}>
              <FormLabel>Product Name</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter product name"
              />
              <FormErrorMessage>{errors.name}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>Tags</FormLabel>
              <Input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search tags..."
                mb={2}
              />
              {searchValue && filteredTags.length > 0 && (
                <VStack
                  align="stretch"
                  bg="white"
                  border="1px"
                  borderColor="gray.200"
                  borderRadius="md"
                  mt={1}
                  mb={2}
                  maxH="200px"
                  overflowY="auto"
                  position="absolute"
                  zIndex={1000}
                  width="calc(100% - 2rem)"
                >
                  {filteredTags.map(tag => (
                    <Button
                      key={tag.id}
                      variant="ghost"
                      justifyContent="start"
                      px={4}
                      py={2}
                      onClick={() => addTag(tag)}
                      _hover={{ bg: 'gray.50' }}
                    >
                      {tag.name}
                    </Button>
                  ))}
                </VStack>
              )}
              <HStack spacing={2} flexWrap="wrap">
                {selectedTags.map((tag) => (
                  <Tag
                    key={tag.id}
                    size="md"
                    borderRadius="full"
                    variant="subtle"
                    bgColor={tag.color + '20'}
                    cursor="pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag.name}
                  </Tag>
                ))}
              </HStack>
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
          >
            Add Product
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};