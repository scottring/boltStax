import {
  Box,
  Flex,
  Button,
  Heading,
  useDisclosure,
  Text,
  useToast,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  TableContainer,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  HStack,
  Tag,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { MoreVertical, Send, Trash2 } from 'lucide-react';
import type { ProductSheet } from '../../types/productSheet';
import type { Supplier } from '../../types/supplier';
import type { QuestionTag } from '../../types/question';
import { getAllSheets, deleteSheet, sendSheet } from '../../services/productSheets';
import { getSuppliers, getSupplier } from '../../services/suppliers';
import { getTags } from '../../services/questions';
import { CreateProductSheetModal } from './CreateProductSheetModal';

export const SupplierProductsView = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [sheets, setSheets] = useState<ProductSheet[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [tags, setTags] = useState<QuestionTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      setError(null);
      const [sheetsData, suppliersData, tagsData] = await Promise.all([
        getAllSheets(),
        getSuppliers(),
        getTags()
      ]);
      setSheets(sheetsData);
      setSuppliers(suppliersData);
      setTags(tagsData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: 'Error fetching data',
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
    fetchData();
  }, []);

  const getSupplierName = async (supplierId: string): Promise<string> => {
    try {
      // First check the local suppliers array
      const localSupplier = suppliers.find(s => s.id === supplierId);
      if (localSupplier) {
        return localSupplier.name;
      }

      // If not found locally, fetch from Firestore
      const supplier = await getSupplier(supplierId);
      // Update the local suppliers array
      setSuppliers(prev => [...prev, supplier]);
      return supplier.name;
    } catch (error) {
      console.error('Error fetching supplier:', error);
      return 'Unknown Supplier';
    }
  };

  const getStatusColor = (status: ProductSheet['status']) => {
    switch (status) {
      case 'draft':
        return 'gray';
      case 'sent':
        return 'blue';
      case 'inProgress':
        return 'orange';
      case 'completed':
        return 'green';
      default:
        return 'gray';
    }
  };

  const handleDelete = async (sheetId: string) => {
    try {
      await deleteSheet(sheetId);
      toast({
        title: 'Sheet deleted successfully',
        status: 'success',
        duration: 3000,
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error deleting sheet',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleSend = async (sheetId: string) => {
    try {
      await sendSheet(sheetId);
      toast({
        title: 'Sheet sent successfully',
        description: 'The supplier will be notified via email',
        status: 'success',
        duration: 3000,
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error sending sheet',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };

  return (
    <Box p={8}>
      <Flex justify="space-between" align="center" mb={8}>
        <Heading size="lg">Product Sheets</Heading>
        <Button onClick={onOpen}>Create New Sheet</Button>
      </Flex>

      {error && (
        <Alert status="error" mb={6}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      <Box bg="white" borderRadius="lg" shadow="sm" overflow="hidden">
        <TableContainer>
          <Table variant="simple">
            <Thead bg="gray.50">
              <Tr>
                <Th>Sheet Name</Th>
                <Th>Supplier</Th>
                <Th>Tags</Th>
                <Th>Status</Th>
                <Th>Due Date</Th>
                <Th>Created</Th>
                <Th width="100px">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <Tr key={index}>
                    {Array.from({ length: 7 }).map((_, cellIndex) => (
                      <Td key={cellIndex}>
                        <Text>Loading...</Text>
                      </Td>
                    ))}
                  </Tr>
                ))
              ) : sheets.length === 0 ? (
                <Tr>
                  <Td colSpan={7} textAlign="center" py={8}>
                    No product sheets found
                  </Td>
                </Tr>
              ) : (
                sheets.map((sheet) => (
                  <Tr key={sheet.id}>
                    <Td fontWeight="medium">{sheet.name}</Td>
                    <Td>
                      <SupplierName supplierId={sheet.supplierId} getSupplierName={getSupplierName} />
                    </Td>
                    <Td>
                      <HStack spacing={2} flexWrap="wrap">
                        {sheet.selectedTags.map(tagId => {
                          const tag = tags.find(t => t.id === tagId);
                          return tag ? (
                            <Tag
                              key={tagId}
                              size="sm"
                              borderRadius="full"
                              variant="subtle"
                              bgColor={`${tag.color}20`}
                            >
                              {tag.name}
                            </Tag>
                          ) : null;
                        })}
                      </HStack>
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={getStatusColor(sheet.status)}
                        textTransform="capitalize"
                      >
                        {sheet.status}
                      </Badge>
                    </Td>
                    <Td>
                      {sheet.dueDate ? sheet.dueDate.toLocaleDateString() : '-'}
                    </Td>
                    <Td>
                      {sheet.createdAt.toLocaleDateString()}
                    </Td>
                    <Td>
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<MoreVertical size={16} />}
                          variant="ghost"
                          size="sm"
                        />
                        <MenuList>
                          {sheet.status === 'draft' && (
                            <MenuItem
                              icon={<Send size={16} />}
                              onClick={() => handleSend(sheet.id)}
                            >
                              Send to Supplier
                            </MenuItem>
                          )}
                          <MenuItem
                            icon={<Trash2 size={16} />}
                            onClick={() => handleDelete(sheet.id)}
                            color="red.500"
                          >
                            Delete
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>

      <CreateProductSheetModal
        isOpen={isOpen}
        onClose={onClose}
        onSheetCreated={fetchData}
        suppliers={suppliers}
        tags={tags}
      />
    </Box>
  );
};

// Helper component to handle async supplier name loading
const SupplierName = ({ 
  supplierId, 
  getSupplierName 
}: { 
  supplierId: string; 
  getSupplierName: (id: string) => Promise<string>;
}) => {
  const [name, setName] = useState<string>('Loading...');

  useEffect(() => {
    getSupplierName(supplierId).then(setName);
  }, [supplierId]);

  return <>{name}</>;
};
