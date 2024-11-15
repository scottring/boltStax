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
  useColorModeValue,
  IconButton
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

  const borderColor = useColorModeValue('gray.100', 'gray.600');
  const inputBg = useColorModeValue('white', 'gray.800');
  const labelColor = useColorModeValue('gray.700', 'gray.300');
  const helperTextColor = useColorModeValue('gray.600', 'gray.400');

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
      await getSupplier(newSupplierId);
      setFormData(prev => ({ ...prev, supplierId: newSupplierId }));
      setIsNewSupplier(true);
      onAddSupplierClose();
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
        <ModalOverlay bg="blackAlpha.200" backdropFilter="blur(2px)" />
        <ModalContent borderRadius="xl" shadow="lg">
          <ModalHeader fontWeight="medium" pt={6}>Create Product Sheet</ModalHeader>
          <ModalCloseButton size="sm" />
          <ModalBody>
            <VStack spacing={6}>
              <FormControl isInvalid={!!errors.name}>
                <FormLabel fontSize="sm" color={labelColor}>Sheet Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter sheet name"
                  size="sm"
                  bg={inputBg}
                  borderColor={borderColor}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{ borderColor: 'green.500', boxShadow: 'none' }}
                />
                <FormErrorMessage fontSize="xs">{errors.name}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.supplierId}>
                <FormLabel fontSize="sm" color={labelColor}>Select Supplier</FormLabel>
                <HStack>
                  <Select
                    value={formData.supplierId}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, supplierId: e.target.value }));
                      setIsNewSupplier(false);
                    }}
                    placeholder="Choose a supplier"
                    size="sm"
                    bg={inputBg}
                    borderColor={borderColor}
                    _hover={{ borderColor: 'gray.300' }}
                    _focus={{ borderColor: 'green.500', boxShadow: 'none' }}
                  >
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </Select>
                  <IconButton
                    aria-label="Add new supplier"
                    icon={<Plus size={16} />}
                    onClick={onAddSupplierOpen}
                    colorScheme="green"
                    variant="ghost"
                    size="sm"
                  />
                </HStack>
                <FormErrorMessage fontSize="xs">{errors.supplierId}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.tags}>
                <FormLabel fontSize="sm" color={labelColor}>Select Question Tags</FormLabel>
                <Text fontSize="xs" color={helperTextColor} mb={2}>
                  Only questions with selected tags will be included in the sheet
                </Text>
                <TagSelector
                  availableTags={tags}
                  selectedTagIds={formData.selectedTags}
                  onChange={(selectedTags) => setFormData(prev => ({ ...prev, selectedTags }))}
                />
                <FormErrorMessage fontSize="xs">{errors.tags}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" color={labelColor}>Due Date (Optional)</FormLabel>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  size="sm"
                  bg={inputBg}
                  borderColor={borderColor}
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{ borderColor: 'green.500', boxShadow: 'none' }}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter borderTop="1px" borderColor={borderColor} gap={2}>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              colorScheme="green"
              size="sm"
              onClick={() => handleSubmit(false)}
              isLoading={isLoading}
            >
              Save as Draft
            </Button>
            <Button
              colorScheme="green"
              size="sm"
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
