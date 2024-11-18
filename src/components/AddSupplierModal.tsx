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
  Box,
  List,
  ListItem,
  Text,
  Alert,
  AlertIcon,
  useOutsideClick
} from '@chakra-ui/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { z } from 'zod';
import { SupplierInviteSchema } from '../types/supplier';
import { inviteSupplier } from '../services/supplierInvitations';
import { useAuth } from '../contexts/AuthContext';
import { getTags } from '../services/tags';
import { TagSelector } from './questions/TagSelector';
import type { QuestionTag } from '../types/question';
import { searchCompaniesByName } from '../services/suppliers';
import debounce from 'lodash/debounce';

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
  const [availableTags, setAvailableTags] = useState<QuestionTag[]>([]);
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string }>>([]);
  const [showResults, setShowResults] = useState(false);
  const [existingCompany, setExistingCompany] = useState<{ id: string; name: string } | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    primaryContact: '',
    tags: [] as string[],
    notes: ''
  });

  const borderColor = useColorModeValue('gray.100', 'gray.600');
  const inputBg = useColorModeValue('white', 'gray.800');
  const labelColor = useColorModeValue('gray.700', 'gray.300');
  const resultsBg = useColorModeValue('white', 'gray.700');
  const resultsHoverBg = useColorModeValue('gray.50', 'gray.600');

  useOutsideClick({
    ref: searchRef,
    handler: () => setShowResults(false),
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
    loadTags();
  }, [toast]);

  const debouncedSearch = useCallback(
    debounce(async (searchTerm: string) => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      try {
        const results = await searchCompaniesByName(searchTerm);
        setSearchResults(results.map(company => ({ id: company.id, name: company.name })));
        setShowResults(true);
      } catch (error) {
        console.error('Error searching companies:', error);
        setSearchResults([]);
      }
    }, 300),
    []
  );

  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, name: value }));
    setExistingCompany(null);
    debouncedSearch(value);
  };

  const handleCompanySelect = (company: { id: string; name: string }) => {
    setFormData(prev => ({ ...prev, name: company.name }));
    setExistingCompany(company);
    setShowResults(false);
  };

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

    if (existingCompany) {
      toast({
        title: 'Company Already Exists',
        description: 'This company is already registered in the system.',
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
      setFormData({ name: '', contactName: '', primaryContact: '', tags: [], notes: '' });
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
            <FormControl isInvalid={!!errors.name} position="relative" ref={searchRef}>
              <FormLabel fontSize="sm" color={labelColor}>Company Name</FormLabel>
              <Input
                value={formData.name}
                onChange={handleCompanyNameChange}
                placeholder="Enter company name"
                size="sm"
                bg={inputBg}
                borderColor={borderColor}
                _hover={{ borderColor: 'gray.300' }}
                _focus={{ borderColor: 'green.500', boxShadow: 'none' }}
              />
              <FormErrorMessage fontSize="xs">{errors.name}</FormErrorMessage>
              
              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <Box
                  position="absolute"
                  top="100%"
                  left={0}
                  right={0}
                  zIndex={1}
                  mt={1}
                  bg={resultsBg}
                  borderRadius="md"
                  boxShadow="md"
                  border="1px"
                  borderColor={borderColor}
                  maxH="200px"
                  overflowY="auto"
                >
                  <List spacing={0}>
                    {searchResults.map((company) => (
                      <ListItem
                        key={company.id}
                        px={4}
                        py={2}
                        cursor="pointer"
                        _hover={{ bg: resultsHoverBg }}
                        onClick={() => handleCompanySelect(company)}
                      >
                        <Text fontSize="sm">{company.name}</Text>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Existing Company Warning */}
              {existingCompany && (
                <Alert status="warning" mt={2} size="sm" borderRadius="md">
                  <AlertIcon />
                  This company is already registered in the system
                </Alert>
              )}
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

            <FormControl>
              <FormLabel fontSize="sm" color={labelColor}>Required Question Tags</FormLabel>
              <TagSelector
                availableTags={availableTags}
                selectedTagIds={formData.tags}
                onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
              />
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
            isDisabled={!!existingCompany}
          >
            Send Invitation
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
