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
  useToast
} from '@chakra-ui/react';
import { useState } from 'react';
import { z } from 'zod';
import { SupplierInviteSchema } from '../types/supplier';
import { inviteSupplier } from '../services/supplierInvitations';

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSupplierAdded: (supplierId: string) => void;
}

export const AddSupplierModal = ({ isOpen, onClose, onSupplierAdded }: AddSupplierModalProps) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    primaryContact: '',
    notes: ''
  });

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      // Validate the form data
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

      const createdSupplier = await inviteSupplier(formData);
      
      toast({
        title: 'Supplier invitation sent',
        description: 'The supplier has been invited to join the platform.',
        status: 'success',
        duration: 3000,
      });
      
      onSupplierAdded(createdSupplier.id);
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
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Invite New Supplier</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isInvalid={!!errors.name}>
              <FormLabel>Company Name</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter company name"
              />
              <FormErrorMessage>{errors.name}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.contactName}>
              <FormLabel>Contact Name</FormLabel>
              <Input
                value={formData.contactName}
                onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                placeholder="Enter contact name"
              />
              <FormErrorMessage>{errors.contactName}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.primaryContact}>
              <FormLabel>Contact Email</FormLabel>
              <Input
                type="email"
                value={formData.primaryContact}
                onChange={(e) => setFormData(prev => ({ ...prev, primaryContact: e.target.value }))}
                placeholder="Enter contact email"
              />
              <FormErrorMessage>{errors.primaryContact}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.notes}>
              <FormLabel>Notes (Optional)</FormLabel>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter any additional notes"
              />
              <FormErrorMessage>{errors.notes}</FormErrorMessage>
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
            Send Invitation
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
