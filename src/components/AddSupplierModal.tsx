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
  Textarea,
  useToast,
  useColorModeValue
} from '@chakra-ui/react';
import { useState } from 'react';
import { z } from 'zod';
import { SupplierInviteSchema } from '../types/supplier';
import { inviteSupplier } from '../services/supplierInvitations';
import { useAuth } from '../contexts/AuthContext';

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSupplierAdded: () => void;
}

export const AddSupplierModal = ({ isOpen, onClose, onSupplierAdded }: AddSupplierModalProps) => {
  const toast = useToast();
  const { userData } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    primaryContact: '',
    notes: ''
  });

  const borderColor = useColorModeValue('gray.100', 'gray.600');
  const inputBg = useColorModeValue('white', 'gray.800');
  const labelColor = useColorModeValue('gray.700', 'gray.300');

  const handleSubmit = async () => {
    if (!userData) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to invite suppliers',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const validationResult = SupplierInviteSchema.safeParse(formData);

      if (!validationResult.success) {
        const formattedErrors: Record<string, string> = {};
        validationResult.error.issues.forEach((issue: z.ZodIssue) => {
          formattedErrors[issue.path[0].toString()] = issue.message;
        });
        setErrors(formattedErrors);
        setIsLoading(false);
        return;
      }

      await inviteSupplier(formData, userData.companyId);
      
      toast({
        title: 'Supplier invitation sent',
        description: 'The supplier has been invited to join the platform.',
        status: 'success',
        duration: 3000,
      });
      
      onSupplierAdded();
      onClose();
      setFormData({ name: '', contactName: '', primaryContact: '', notes: '' });
    } catch (error) {
      toast({
        title: 'Error inviting supplier',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay bg="blackAlpha.200" backdropFilter="blur(2px)" />
      <ModalContent borderRadius="xl" shadow="lg">
        <ModalHeader fontWeight="medium" pt={6}>Invite New Supplier</ModalHeader>
        <ModalCloseButton size="sm" />
        <ModalBody>
          <VStack spacing={5}>
            <FormControl isInvalid={!!errors.name}>
              <FormLabel fontSize="sm" color={labelColor}>Company Name</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter company name"
                size="sm"
                bg={inputBg}
                borderColor={borderColor}
                _hover={{ borderColor: 'gray.300' }}
                _focus={{ borderColor: 'green.500', boxShadow: 'none' }}
              />
              <FormErrorMessage fontSize="xs">{errors.name}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.contactName}>
              <FormLabel fontSize="sm" color={labelColor}>Contact Name</FormLabel>
              <Input
                value={formData.contactName}
                onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                placeholder="Enter contact name"
                size="sm"
                bg={inputBg}
                borderColor={borderColor}
                _hover={{ borderColor: 'gray.300' }}
                _focus={{ borderColor: 'green.500', boxShadow: 'none' }}
              />
              <FormErrorMessage fontSize="xs">{errors.contactName}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.primaryContact}>
              <FormLabel fontSize="sm" color={labelColor}>Contact Email</FormLabel>
              <Input
                type="email"
                value={formData.primaryContact}
                onChange={(e) => setFormData(prev => ({ ...prev, primaryContact: e.target.value }))}
                placeholder="Enter contact email"
                size="sm"
                bg={inputBg}
                borderColor={borderColor}
                _hover={{ borderColor: 'gray.300' }}
                _focus={{ borderColor: 'green.500', boxShadow: 'none' }}
              />
              <FormErrorMessage fontSize="xs">{errors.primaryContact}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.notes}>
              <FormLabel fontSize="sm" color={labelColor}>Notes (Optional)</FormLabel>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter any additional notes"
                size="sm"
                bg={inputBg}
                borderColor={borderColor}
                _hover={{ borderColor: 'gray.300' }}
                _focus={{ borderColor: 'green.500', boxShadow: 'none' }}
                minH="100px"
                resize="vertical"
              />
              <FormErrorMessage fontSize="xs">{errors.notes}</FormErrorMessage>
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
            colorScheme="green"
            size="sm"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            Send Invitation
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
