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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  TableContainer,
  IconButton,
  Tooltip,
  useColorModeValue,
  Text
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { Mail, ExternalLink } from 'lucide-react';
import { getCustomers } from '../services/customers';
import { useAuth } from '../contexts/AuthContext';
import type { Customer } from '../types/customer';
import { AddCustomerModal } from './AddCustomerModal';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending_invitation':
      return 'yellow';
    case 'invitation_sent':
      return 'blue';
    case 'registered':
      return 'purple';
    case 'active':
      return 'green';
    case 'inactive':
      return 'red';
    default:
      return 'gray';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending_invitation':
      return 'Pending';
    case 'invitation_sent':
      return 'Invited';
    case 'registered':
      return 'Registered';
    case 'active':
      return 'Active';
    case 'inactive':
      return 'Inactive';
    default:
      return status;
  }
};

export const CustomersView = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const { userData } = useAuth();

  const tableBg = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.100', 'gray.600');

  const fetchCustomers = async () => {
    if (!userData?.companyId) {
      setError('No company ID found');
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await getCustomers(userData.companyId);
      setCustomers(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: 'Error fetching customers',
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

  const handleAction = (customer: Customer) => {
    console.log('Action clicked for customer:', customer);
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
        <Heading size="lg">My Customers</Heading>
        <HStack spacing={4}>
          <Button variant="outline">Export Customer Data</Button>
          <Button onClick={onOpen}>Add New Customer</Button>
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
            placeholder="Search customers..."
            bg="white"
            flex={1}
          />
          <Button variant="outline">
            Filter
          </Button>
        </Flex>

        <Box 
          bg={tableBg} 
          borderRadius="lg" 
          shadow="sm" 
          overflow="hidden"
        >
          <TableContainer>
            <Table variant="simple">
              <Thead bg={headerBg}>
                <Tr>
                  <Th>Company Name</Th>
                  <Th>Contact Name</Th>
                  <Th>Email</Th>
                  <Th>Status</Th>
                  <Th>Added Date</Th>
                  <Th>Last Updated</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <Tr key={index}>
                      {Array.from({ length: 7 }).map((_, cellIndex) => (
                        <Td key={cellIndex}>
                          <Box h="20px" bg="gray.200" rounded="md" />
                        </Td>
                      ))}
                    </Tr>
                  ))
                ) : customers.length === 0 ? (
                  <Tr>
                    <Td colSpan={7} textAlign="center" py={8}>
                      <Text color="gray.500">No customers found</Text>
                    </Td>
                  </Tr>
                ) : (
                  customers.map((customer) => (
                    <Tr key={customer.id}>
                      <Td fontWeight="medium">{customer.name}</Td>
                      <Td>{customer.contactName}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <Text>{customer.primaryContact}</Text>
                          <Tooltip label="Send email">
                            <IconButton
                              aria-label="Send email"
                              icon={<Mail size={14} />}
                              size="xs"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `mailto:${customer.primaryContact}`;
                              }}
                            />
                          </Tooltip>
                        </HStack>
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={getStatusColor(customer.status)}
                          px={2}
                          py={1}
                          borderRadius="full"
                        >
                          {getStatusLabel(customer.status)}
                        </Badge>
                      </Td>
                      <Td>
                        <Text fontSize="sm" color="gray.600">
                          {customer.invitationSentDate?.toLocaleDateString() || '-'}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm" color="gray.600">
                          {customer.lastUpdated?.toLocaleDateString() || '-'}
                        </Text>
                      </Td>
                      <Td>
                        <Button
                          size="sm"
                          colorScheme="green"
                          onClick={() => handleAction(customer)}
                          leftIcon={<ExternalLink size={14} />}
                        >
                          View Details
                        </Button>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      </Box>

      <AddCustomerModal
        isOpen={isOpen}
        onClose={onClose}
        onCustomerAdded={fetchCustomers}
      />
    </Box>
  );
};
