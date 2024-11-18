import {
  Box,
  Flex,
  Button,
  Heading,
  useDisclosure,
  Grid,
  Text,
  VStack,
  HStack,
  useToast,
  Alert,
  AlertIcon,
  Select,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { Product } from '../../types/product';
import { getSupplierProducts } from '../../services/products';
import { getSuppliers } from '../../services/suppliers';
import { AddCustomerProductModal } from './AddCustomerProductModal';
import { CustomerProductCard } from './CustomerProductCard';
import { useAuth } from '../../contexts/AuthContext';

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

export const CustomersProductsView = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Company[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const { userData } = useAuth();

  const fetchSuppliers = async () => {
    if (!userData?.companyId) return;
    
    try {
      const data = await getSuppliers(userData.companyId);
      setSuppliers(data);
      if (data.length > 0 && !selectedSupplierId) {
        setSelectedSupplierId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchProducts = async () => {
    if (!selectedSupplierId) return;
    
    setIsLoading(true);
    try {
      setError(null);
      const data = await getSupplierProducts(selectedSupplierId);
      setProducts(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: 'Error fetching products',
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

  useEffect(() => {
    if (selectedSupplierId) {
      fetchProducts();
    }
  }, [selectedSupplierId]);

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
        <Heading size="lg">Customer Products</Heading>
        <Button onClick={onOpen}>Add New Product</Button>
      </Flex>

      <Box px="6" py="4">
        <Box mb={6}>
          <Select
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(e.target.value)}
            bg="white"
          >
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </Select>
        </Box>

        {error && (
          <Alert status="error" mb={6}>
            <AlertIcon />
            {error}
          </Alert>
        )}

        {!isLoading && products.length === 0 ? (
          <VStack spacing={4} py={8}>
            <Text color="gray.500">No products available for this customer</Text>
            <Button onClick={onOpen}>Add First Product</Button>
          </VStack>
        ) : (
          <Grid
            templateColumns="repeat(auto-fill, minmax(300px, 1fr))"
            gap={6}
            mt={6}
          >
            {products.map((product) => (
              <CustomerProductCard
                key={product.id}
                product={product}
              />
            ))}
          </Grid>
        )}

        <AddCustomerProductModal
          isOpen={isOpen}
          onClose={onClose}
          onProductAdded={fetchProducts}
          supplierId={selectedSupplierId}
        />
      </Box>
    </Box>
  );
};
