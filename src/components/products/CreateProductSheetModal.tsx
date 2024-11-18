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
  VStack,
  useToast,
  FormErrorMessage,
} from '@chakra-ui/react';
import { useState } from 'react';
import type { QuestionTag } from '../../types/questionnaire';
import { createProductSheet } from '../../services/productSheets';

// Using Company type from suppliers.ts until we move it to types/company.ts
interface Company {
  id: string;
  name: string;
  contactName: string;
  email: string;
  suppliers: string[];
  customers: string[];
  createdAt: Date;
  updatedAt?: Date;
  notes?: string;
}

export interface CreateProductSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSheetCreated: () => void;
  suppliers: Company[];  // Companies that have the supplier role
  tags: QuestionTag[];
  companyId: string;
}

export function CreateProductSheetModal({
  isOpen,
  onClose,
  onSheetCreated,
  suppliers,
  tags,
  companyId
}: CreateProductSheetModalProps) {
  const [name, setName] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await createProductSheet(companyId, {
        name,
        supplierId,
        selectedTags,
        status: 'draft',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      });

      toast({
        title: 'Product sheet created',
        status: 'success',
        duration: 3000,
      });

      onSheetCreated();
      onClose();
      setName('');
      setSupplierId('');
      setSelectedTags([]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create product sheet';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>Create Product Sheet</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isInvalid={!!error}>
                <FormLabel>Sheet Name</FormLabel>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter sheet name"
                  required
                />
              </FormControl>

              <FormControl>
                <FormLabel>Supplier</FormLabel>
                <Select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  placeholder="Select supplier"
                  required
                >
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Tags</FormLabel>
                <Select
                  value={selectedTags}
                  onChange={(e) => {
                    const options = e.target.options;
                    const values: string[] = [];
                    for (let i = 0; i < options.length; i++) {
                      if (options[i].selected) {
                        values.push(options[i].value);
                      }
                    }
                    setSelectedTags(values);
                  }}
                  multiple
                  required
                  height="100px"
                >
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {error && <FormErrorMessage>{error}</FormErrorMessage>}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              colorScheme="blue"
              isLoading={isLoading}
            >
              Create
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
