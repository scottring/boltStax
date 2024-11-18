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
import { SupplierTable } from './SupplierTable';
import { AddSupplierModal } from './AddSupplierModal';
import { getSuppliers } from '../services/suppliers';
import { useAuth } from '../contexts/AuthContext';
import type { Supplier } from '../types/supplier';

export const SuppliersView = () => {
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
  }, [userData?.companyId]);

  const handleAction = (supplier: Supplier) => {
    console.log('Action clicked for supplier:', supplier);
  };

  return (
    <Box>
      <Flex 
        justify="space-between" 
        align="center" 
        px="6" 
        py="6" 
        borderBottom="1px" 
        borderColor="gray.200"
      >
        <Heading size="lg">My Suppliers</Heading>
        <HStack spacing={4}>
          <Button variant="outline">Export Supplier Data</Button>
          <Button onClick={onOpen}>Add New Supplier</Button>
        </HStack>
      </Flex>

      <Box px="6" py="4">
        {error && (
          <Alert status="error" mb={6}>
            <AlertIcon />
            <AlertTitle mr={2}>Error!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Flex gap={4} mb={6}>
          <Input
            placeholder="Search suppliers..."
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
      </Box>

      <AddSupplierModal 
        isOpen={isOpen}
        onClose={onClose}
        onSupplierAdded={fetchSuppliers}
      />
    </Box>
  );
};
