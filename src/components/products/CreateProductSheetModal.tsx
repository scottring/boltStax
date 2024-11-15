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
  Text,
  HStack,
  useDisclosure,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { TagSelector } from '../questions/TagSelector';
import { createProductSheet, sendSheet } from '../../services/productSheets';
import { AddSupplierModal } from '../AddSupplierModal';
import { getSupplier } from '../../services/suppliers';
import { Plus } from 'lucide-react';
import type { Supplier } from '../../types/supplier';
import type { QuestionTag } from '../../types/question';

interface CreateProductSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSheetCreated: () => void;
  suppliers: Supplier[];
  tags: QuestionTag[];
}

export const CreateProductSheetModal = ({
  isOpen,
  onClose,
  onSheetCreated,
  suppliers,
  tags,
}: CreateProductSheetModalProps) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    supplierId: '',
    selectedTags: [] as string[],
    dueDate: '',
  });
  const [isNewSupplier, setIsNewSupplier] = useState(false);
  const { 
    isOpen: isAddSupplierOpen, 
    onOpen: onAddSupplierOpen, 
    onClose: onAddSupplierClose 
  } = useDisclosure();

  const handleSubmit = async (sendImmediately: boolean = false) => {
    setIsLoading(true);
    setErrors({});

    try {
      if (!formData.name.trim()) {
        setErrors(prev => ({ ...prev, name: 'Sheet name is required' }));
        return;
      }
      if (!formData.supplierId) {
        setErrors(prev => ({ ...prev, supplierId: 'Supplier is required' }));
        return;
      }
      if (formData.selectedTags.length === 0) {
        setErrors(prev => ({ ...prev, tags: 'At least one tag is required' }));
        return;
      }

      // Verify supplier exists before proceeding
      try {
        await getSupplier(formData.supplierId);
      } catch (error) {
        setErrors(prev => ({ ...prev, supplierId: 'Selected supplier not found' }));
        setIsLoading(false);
        return;
      }

      const dueDate = formData.dueDate ? new Date(formData.dueDate) : undefined;
      
      const sheet = await createProductSheet(
        formData.name,
        formData.supplierId,
        formData.selectedTags,
        dueDate
      );

      if (sendImmediately) {
        await sendSheet(sheet.id);
        toast({
          title: 'Sheet sent successfully',
          description: isNewSupplier 
            ? 'An invitation has been sent to the supplier'
            : 'The supplier has been notified',
          status: 'success',
          duration: 3000,
        });
      } else {
        toast({
          title: 'Sheet created successfully',
          description: 'You can send it to the supplier later',
          status: 'success',
          duration: 3000,
        });
      }

      onSheetCreated();
      onClose();
      resetForm();
    } catch (error) {
      toast({
        title: 'Error creating sheet',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      supplierId: '',
      selectedTags: [],
      dueDate: '',
    });
    setIsNewSupplier(false);
  };

  const handleSupplierAdded = async (newSupplierId: string) => {
    try {
      // Verify the new supplier exists and get its data
      await getSupplier(newSupplierId);
      setFormData(prev => ({ ...prev, supplierId: newSupplierId }));
      setIsNewSupplier(true);
      onAddSupplierClose();
      // Trigger a refresh of the parent component's supplier list
      onSheetCreated();
    } catch (error) {
      toast({
        title: 'Error selecting supplier',
        description: 'The newly added supplier could not be found',
        status: 'error',
        duration: 5000,
      });
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Product Sheet</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6}>
              <FormControl isInvalid={!!errors.name}>
                <FormLabel>Sheet Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter sheet name"
                />
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.supplierId}>
                <FormLabel>Select Supplier</FormLabel>
                <HStack>
                  <Select
                    value={formData.supplierId}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, supplierId: e.target.value }));
                      setIsNewSupplier(false);
                    }}
                    placeholder="Choose a supplier"
                  >
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </Select>
                  <Button
                    leftIcon={<Plus size={16} />}
                    onClick={onAddSupplierOpen}
                    colorScheme="green"
                    variant="ghost"
                  >
                    New
                  </Button>
                </HStack>
                <FormErrorMessage>{errors.supplierId}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.tags}>
                <FormLabel>Select Question Tags</FormLabel>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Only questions with selected tags will be included in the sheet
                </Text>
                <TagSelector
                  availableTags={tags}
                  selectedTagIds={formData.selectedTags}
                  onChange={(selectedTags) => setFormData(prev => ({ ...prev, selectedTags }))}
                />
                <FormErrorMessage>{errors.tags}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel>Due Date (Optional)</FormLabel>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="outline"
              colorScheme="green"
              mr={3}
              onClick={() => handleSubmit(false)}
              isLoading={isLoading}
            >
              Save as Draft
            </Button>
            <Button
              colorScheme="green"
              onClick={() => handleSubmit(true)}
              isLoading={isLoading}
            >
              {isNewSupplier ? 'Send & Invite Supplier' : 'Send to Supplier'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AddSupplierModal
        isOpen={isAddSupplierOpen}
        onClose={onAddSupplierClose}
        onSupplierAdded={handleSupplierAdded}
      />
    </>
  );
};
