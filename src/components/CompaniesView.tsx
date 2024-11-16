import { 
  Box, 
  Flex, 
  Button, 
  HStack, 
  Heading, 
  Input,
  useDisclosure,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import type { Supplier } from '../types/supplier';
import { SupplierTable } from './SupplierTable';
import { AddSupplierModal } from './AddSupplierModal';
import { getSuppliers } from '../services/suppliers';
import { useAuth } from '../contexts/AuthContext';

export const CompaniesView = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const { userData } = useAuth();

  const fetchSuppliers = async () => {
    if (!userData?.companyId) {
      setError('No company ID found');
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await getSuppliers(userData.companyId);
      setSuppliers(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: 'Error fetching suppliers',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [userData?.companyId]); // Re-fetch when companyId changes

  const handleAction = (supplier: Supplier) => {
    console.log('Action clicked for supplier:', supplier);
  };

  return (
    <Box p={8}>
      <Flex justify="space-between" align="center" mb={8}>
        <Heading size="lg">Companies</Heading>
        <HStack spacing={4}>
          <Button variant="outline">Export Data</Button>
          <Button onClick={onOpen}>Add New Supplier</Button>
        </HStack>
      </Flex>

      {error && (
        <Alert status="error" mb={6}>
          <AlertIcon />
          <AlertTitle mr={2}>Error!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Flex gap={4} mb={6}>
        <Input
          placeholder="Type Something"
          bg="white"
          flex={1}
        />
        <Button variant="outline">
          Filter
        </Button>
      </Flex>

      <SupplierTable 
        suppliers={suppliers}
        onAction={handleAction}
        isLoading={isLoading}
      />

      <AddSupplierModal 
        isOpen={isOpen}
        onClose={onClose}
        onSupplierAdded={fetchSuppliers}
      />
    </Box>
  );
};
