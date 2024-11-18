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
  AlertDescription,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { SupplierTable } from './SupplierTable';
import { AddSupplierModal } from './AddSupplierModal';
import { SupplierDetailsModal } from './SupplierDetailsModal';
import { getSuppliers, deleteSuppliers } from '../services/suppliers';
import { useAuth } from '../contexts/AuthContext';
import type { Supplier } from '../types/supplier';

export const SuppliersView = () => {
  const { isOpen: isAddModalOpen, onOpen: onAddModalOpen, onClose: onAddModalClose } = useDisclosure();
  const { isOpen: isDetailsModalOpen, onOpen: onDetailsModalOpen, onClose: onDetailsModalClose } = useDisclosure();
  const { isOpen: isDeleteDialogOpen, onOpen: onDeleteDialogOpen, onClose: onDeleteDialogClose } = useDisclosure();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const { userData } = useAuth();
  const cancelRef = useRef<HTMLButtonElement>(null);

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
    setSelectedSupplier(supplier);
    onDetailsModalOpen();
  };

  const handleSelectSupplier = (supplierId: string, isSelected: boolean) => {
    setSelectedSuppliers(prev => 
      isSelected 
        ? [...prev, supplierId]
        : prev.filter(id => id !== supplierId)
    );
  };

  const handleSelectAll = (isSelected: boolean) => {
    setSelectedSuppliers(
      isSelected ? suppliers.map(supplier => supplier.id) : []
    );
  };

  const handleDelete = async () => {
    try {
      const { count } = await deleteSuppliers(selectedSuppliers);
      toast({
        title: 'Success',
        description: `Successfully deleted ${count} supplier${count === 1 ? '' : 's'}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setSelectedSuppliers([]);
      fetchSuppliers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast({
        title: 'Error deleting suppliers',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onDeleteDialogClose();
    }
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
          {selectedSuppliers.length > 0 && (
            <Button 
              colorScheme="red" 
              variant="outline"
              onClick={onDeleteDialogOpen}
            >
              Delete Selected ({selectedSuppliers.length})
            </Button>
          )}
          <Button variant="outline">Export Supplier Data</Button>
          <Button onClick={onAddModalOpen}>Add New Supplier</Button>
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
          selectedSuppliers={selectedSuppliers}
          onSelectSupplier={handleSelectSupplier}
          onSelectAll={handleSelectAll}
        />
      </Box>

      <AddSupplierModal 
        isOpen={isAddModalOpen}
        onClose={onAddModalClose}
        onSupplierAdded={fetchSuppliers}
      />

      <SupplierDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={onDetailsModalClose}
        supplier={selectedSupplier}
      />

      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteDialogClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Suppliers
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete {selectedSuppliers.length} supplier{selectedSuppliers.length === 1 ? '' : 's'}? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteDialogClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};
