import {
  Box,
  Flex,
  IconButton,
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
  HStack,
  Tag,
  Skeleton,
  Tooltip,
  useColorModeValue
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { Plus, MoreVertical, Send, Trash2 } from 'lucide-react';
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

  const tableBg = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.100', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

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
      const localSupplier = suppliers.find(s => s.id === supplierId);
      if (localSupplier) {
        return localSupplier.name;
      }
      const supplier = await getSupplier(supplierId);
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
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="md" fontWeight="medium">Product Sheets</Heading>
        <Tooltip label="Create New Sheet" hasArrow>
          <IconButton
            aria-label="Create new sheet"
            icon={<Plus size={18} />}
            onClick={onOpen}
            colorScheme="green"
            variant="ghost"
            size="sm"
          />
        </Tooltip>
      </Flex>

      {error && (
        <Alert status="error" mb={6} borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      )}

      <Box 
        bg={tableBg} 
        borderRadius="xl" 
        borderWidth="1px"
        borderColor={borderColor}
        overflow="hidden"
        boxShadow="sm"
      >
        <TableContainer>
          <Table variant="simple" size="sm">
            <Thead bg={headerBg}>
              <Tr>
                <Th py={4} fontSize="xs" textTransform="none">Sheet Name</Th>
                <Th py={4} fontSize="xs" textTransform="none">Supplier</Th>
                <Th py={4} fontSize="xs" textTransform="none">Tags</Th>
                <Th py={4} fontSize="xs" textTransform="none">Status</Th>
                <Th py={4} fontSize="xs" textTransform="none">Due Date</Th>
                <Th py={4} fontSize="xs" textTransform="none">Created</Th>
                <Th width="50px"></Th>
              </Tr>
            </Thead>
            <Tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <Tr key={index}>
                    {Array.from({ length: 7 }).map((_, cellIndex) => (
                      <Td key={cellIndex}>
                        <Skeleton height="16px" />
                      </Td>
                    ))}
                  </Tr>
                ))
              ) : sheets.length === 0 ? (
                <Tr>
                  <Td colSpan={7} textAlign="center" py={8}>
                    <Text color="gray.500" fontSize="sm">No product sheets found</Text>
                  </Td>
                </Tr>
              ) : (
                sheets.map((sheet) => (
                  <Tr key={sheet.id} _hover={{ bg: hoverBg }}>
                    <Td py={3} fontSize="sm" fontWeight="medium">{sheet.name}</Td>
                    <Td py={3}>
                      <SupplierName supplierId={sheet.supplierId} getSupplierName={getSupplierName} />
                    </Td>
                    <Td py={3}>
                      <HStack spacing={1} flexWrap="wrap">
                        {sheet.selectedTags.map(tagId => {
                          const tag = tags.find(t => t.id === tagId);
                          return tag ? (
                            <Tag
                              key={tagId}
                              size="sm"
                              borderRadius="full"
                              variant="subtle"
                              bgColor={`${tag.color}15`}
                              color={tag.color}
                              fontSize="xs"
                              px={2}
                              py={0.5}
                            >
                              {tag.name}
                            </Tag>
                          ) : null;
                        })}
                      </HStack>
                    </Td>
                    <Td py={3}>
                      <Badge
                        colorScheme={getStatusColor(sheet.status)}
                        textTransform="capitalize"
                        borderRadius="full"
                        px={2}
                        py={0.5}
                        fontSize="xs"
                      >
                        {sheet.status}
                      </Badge>
                    </Td>
                    <Td py={3} fontSize="xs" color="gray.600">
                      {sheet.dueDate ? sheet.dueDate.toLocaleDateString() : '-'}
                    </Td>
                    <Td py={3} fontSize="xs" color="gray.600">
                      {sheet.createdAt.toLocaleDateString()}
                    </Td>
                    <Td py={3}>
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<MoreVertical size={14} />}
                          variant="ghost"
                          size="xs"
                          _hover={{ bg: 'gray.100' }}
                        />
                        <MenuList 
                          shadow="lg" 
                          borderColor={borderColor}
                          py={1}
                          minW="150px"
                        >
                          {sheet.status === 'draft' && (
                            <MenuItem
                              icon={<Send size={14} />}
                              onClick={() => handleSend(sheet.id)}
                              fontSize="sm"
                              py={2}
                            >
                              Send to Supplier
                            </MenuItem>
                          )}
                          <MenuItem
                            icon={<Trash2 size={14} />}
                            onClick={() => handleDelete(sheet.id)}
                            color="red.500"
                            fontSize="sm"
                            py={2}
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

  return <Text fontSize="xs" color="gray.700">{name}</Text>;
};
