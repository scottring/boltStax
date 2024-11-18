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
  useColorModeValue,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { CustomerInviteSchema } from '../types/customer';
import { inviteCustomer } from '../services/customers';
import { useAuth } from '../contexts/AuthContext';
import { TagSelector } from './questions/TagSelector';
import { getTags } from '../services/tags';
import type { QuestionTag } from '../types/question';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerAdded: () => void;
}

export const AddCustomerModal = ({
  isOpen,
  onClose,
  onCustomerAdded,
}: AddCustomerModalProps) => {
  const toast = useToast();
  const { userData } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableTags, setAvailableTags] = useState<QuestionTag[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    primaryContact: '',
    tags: [] as string[],
    notes: ''
  });

  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await getTags();
        setAvailableTags(tags);
      } catch (error) {
        console.error('Error loading tags:', error);
        toast({
          title: 'Error loading tags',
          description: error instanceof Error ? error.message : 'Failed to load tags',
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
    if (!userData) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to invite customers',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const validationResult = CustomerInviteSchema.safeParse(formData);

      if (!validationResult.success) {
        const formattedErrors: Record<string, string> = {};
        validationResult.error.issues.forEach((issue) => {
          formattedErrors[issue.path[0].toString()] = issue.message;
        });
        setErrors(formattedErrors);
        setIsLoading(false);
        return;
      }

      await inviteCustomer(formData, userData.companyId);
      
      toast({
        title: 'Customer invitation sent',
        description: 'The customer has been invited to join the platform.',
        status: 'success',
        duration: 3000,
      });
      
      onCustomerAdded();
      onClose();
      setFormData({
        name: '',
        contactName: '',
        primaryContact: '',
        tags: [],
        notes: ''
      });
    } catch (error) {
      toast({
        title: 'Error inviting customer',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagsChange = (selectedTags: string[]) => {
    setFormData(prev => ({
      ...prev,
      tags: selectedTags
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay bg="blackAlpha.200" backdropFilter="blur(2px)" />
      <ModalContent borderRadius="xl" shadow="lg">
        <ModalHeader fontWeight="medium" pt={6}>Invite New Customer</ModalHeader>
        <ModalCloseButton size="sm" />
        <ModalBody>
          <VStack spacing={5}>
            <FormControl isInvalid={!!errors.name}>
              <FormLabel fontSize="sm">Company Name</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter company name"
                size="sm"
              />
              <FormErrorMessage fontSize="xs">{errors.name}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.contactName}>
              <FormLabel fontSize="sm">Contact Name</FormLabel>
              <Input
                value={formData.contactName}
                onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                placeholder="Enter contact name"
                size="sm"
              />
              <FormErrorMessage fontSize="xs">{errors.contactName}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.primaryContact}>
              <FormLabel fontSize="sm">Contact Email</FormLabel>
              <Input
                type="email"
                value={formData.primaryContact}
                onChange={(e) => setFormData(prev => ({ ...prev, primaryContact: e.target.value }))}
                placeholder="Enter contact email"
                size="sm"
              />
              <FormErrorMessage fontSize="xs">{errors.primaryContact}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Tags</FormLabel>
              <TagSelector
                availableTags={availableTags}
                selectedTagIds={formData.tags}
                onChange={handleTagsChange}
              />
            </FormControl>

            <FormControl isInvalid={!!errors.notes}>
              <FormLabel fontSize="sm">Notes (Optional)</FormLabel>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter any additional notes"
                size="sm"
                minH="100px"
                resize="vertical"
              />
              <FormErrorMessage fontSize="xs">{errors.notes}</FormErrorMessage>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter gap={2}>
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
