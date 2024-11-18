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
  useColorModeValue,
  Button
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { Plus, MoreVertical, Send, Trash2, FileText } from 'lucide-react';
import type { ProductSheet } from '../../types/productSheet';
import type { QuestionTag } from '../../types/questionnaire';
import { getAllSheets, deleteSheet, sendSheet } from '../../services/productSheets';
import { getSuppliers, getSupplier } from '../../services/suppliers';
import { getTags } from '../../services/questions';
import { CreateProductSheetModal } from './CreateProductSheetModal';
import { ProductSheetView } from './ProductSheetView';
import { useAuth } from '../../contexts/AuthContext';

// Using Company type from suppliers.ts until we move it to types/company.ts
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

interface SupplierProductsViewProps {
  onNavigateToResponse: (productSheetId: string, supplierId: string) => void;
}

export const SupplierProductsView = ({ onNavigateToResponse }: SupplierProductsViewProps) => {
  const [sheets, setSheets] = useState<ProductSheet[]>([]);
  const [suppliers, setSuppliers] = useState<Company[]>([]);  // Companies that have the supplier role
  const [tags, setTags] = useState<QuestionTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSheet, setSelectedSheet] = useState<ProductSheet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const { userData } = useAuth();
  const { 
    isOpen: isCreateModalOpen, 
    onOpen: onCreateModalOpen, 
    onClose: onCreateModalClose 
  } = useDisclosure();
  const {
    isOpen: isViewModalOpen,
    onOpen: onViewModalOpen,
    onClose: onViewModalClose
  } = useDisclosure();

  const tableBg = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.100', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  const fetchData = async () => {
    if (!userData) return;
    
    setIsLoading(true);
    try {
      const [sheetsData, suppliersData, tagsData] = await Promise.all([
        getAllSheets(userData.companyId),
        getSuppliers(userData.companyId),
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
  }, [userData]);

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

  const getStatusColor = (status: string) => {
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

  const handleDelete = async (sheetId: string, e: React.MouseEvent) => {
    if (!userData) return;
    
    e.stopPropagation();
    try {
      await deleteSheet(sheetId, userData.companyId);
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

  const handleSend = async (sheetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleViewResponse = (sheet: ProductSheet, e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigateToResponse(sheet.id, sheet.supplierId);
  };

  const handleRowClick = (sheet: ProductSheet) => {
    setSelectedSheet(sheet);
    onViewModalOpen();
  };

  if (!userData) {
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
        <Heading size="lg">Product Sheets</Heading>
        <Button
          leftIcon={<Plus size={18} />}
          onClick={onCreateModalOpen}
        >
          Create New Sheet
        </Button>
      </Flex>

      <Box px="6" py="4">
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
                    <Tr 
                      key={sheet.id} 
                      _hover={{ bg: hoverBg, cursor: 'pointer' }}
                      onClick={() => handleRowClick(sheet)}
                    >
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
                        {sheet.dueDate ? new Date(sheet.dueDate).toLocaleDateString() : '-'}
                      </Td>
                      <Td py={3} fontSize="xs" color="gray.600">
                        {new Date(sheet.createdAt).toLocaleDateString()}
                      </Td>
                      <Td py={3}>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<MoreVertical size={14} />}
                            variant="ghost"
                            size="xs"
                            _hover={{ bg: 'gray.100' }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <MenuList 
                            shadow="lg" 
                            borderColor={borderColor}
                            py={1}
                            minW="150px"
                          >
                            {sheet.status !== 'draft' && (
                              <MenuItem
                                icon={<FileText size={14} />}
                                onClick={(e) => handleViewResponse(sheet, e)}
                                fontSize="sm"
                                py={2}
                              >
                                View Response
                              </MenuItem>
                            )}
                            {sheet.status === 'draft' && (
                              <MenuItem
                                icon={<Send size={14} />}
                                onClick={(e) => handleSend(sheet.id, e)}
                                fontSize="sm"
                                py={2}
                              >
                                Send to Supplier
                              </MenuItem>
                            )}
                            <MenuItem
                              icon={<Trash2 size={14} />}
                              onClick={(e) => handleDelete(sheet.id, e)}
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
      </Box>

      <CreateProductSheetModal
        isOpen={isCreateModalOpen}
        onClose={onCreateModalClose}
        onSheetCreated={fetchData}
        suppliers={suppliers}
        tags={tags}
        companyId={userData.companyId}
      />

      {selectedSheet && (
        <ProductSheetView
          isOpen={isViewModalOpen}
          onClose={onViewModalClose}
          sheet={selectedSheet}
          tags={tags}
        />
      )}
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
