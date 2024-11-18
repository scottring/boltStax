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
import { getCustomers } from '../../services/customers';
import type { Customer } from '../../types/customer';
import { AddCustomerProductModal } from './AddCustomerProductModal';
import { CustomerProductCard } from './CustomerProductCard';
import { useAuth } from '../../contexts/AuthContext';

export const CustomersProductsView = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const { userData } = useAuth();

  const fetchCustomers = async () => {
    if (!userData?.companyId) return;
    
    try {
      const data = await getCustomers(userData.companyId);
      setCustomers(data);
      if (data.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchProducts = async () => {
    if (!userData?.companyId) return;
    
    setIsLoading(true);
    try {
      setError(null);
      // Get products where the authenticated company is the supplier
      const data = await getSupplierProducts(userData.companyId);
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
    fetchCustomers();
  }, [userData?.companyId]);

  useEffect(() => {
    if (userData?.companyId) {
      fetchProducts();
    }
  }, [userData?.companyId]);

  if (!userData?.companyId) {
    return null;
  }

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
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            bg="white"
          >
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
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
            <Text color="gray.500">No products available for customers</Text>
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
          supplierId={userData.companyId}  // The authenticated company is the supplier
        />
      </Box>
    </Box>
  );
};
