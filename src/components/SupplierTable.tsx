import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Box,
  Text,
  Skeleton,
  TableContainer,
  HStack,
  Badge,
  Tooltip,
  IconButton
} from '@chakra-ui/react';
import { Mail, ExternalLink } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  contactName: string;
  email: string;
  createdAt: Date;
  updatedAt?: Date;
  notes?: string;
}

interface SupplierTableProps {
  suppliers: Company[];
  onAction: (supplier: Company) => void;
  isLoading?: boolean;
}

export const SupplierTable = ({ suppliers, onAction, isLoading = false }: SupplierTableProps) => {
  return (
    <Box bg="white" borderRadius="lg" shadow="sm" overflow="hidden">
      <TableContainer>
        <Table variant="simple">
          <Thead bg="gray.50">
            <Tr>
              <Th>Company Name</Th>
              <Th>Contact Name</Th>
              <Th>Email</Th>
              <Th>Added Date</Th>
              <Th>Last Updated</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <Tr key={index}>
                  {Array.from({ length: 6 }).map((_, cellIndex) => (
                    <Td key={cellIndex}>
                      <Skeleton height="20px" />
                    </Td>
                  ))}
                </Tr>
              ))
            ) : suppliers.length === 0 ? (
              <Tr>
                <Td colSpan={6} textAlign="center" py={8}>
                  <Text color="gray.500">No suppliers found</Text>
                </Td>
              </Tr>
            ) : (
              suppliers.map((supplier) => (
                <Tr key={supplier.id}>
                  <Td fontWeight="medium">{supplier.name}</Td>
                  <Td>{supplier.contactName}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <Text>{supplier.email}</Text>
                      <Tooltip label="Send email">
                        <IconButton
                          aria-label="Send email"
                          icon={<Mail size={14} />}
                          size="xs"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `mailto:${supplier.email}`;
                          }}
                        />
                      </Tooltip>
                    </HStack>
                  </Td>
                  <Td>
                    <Text fontSize="sm" color="gray.600">
                      {supplier.createdAt.toLocaleDateString()}
                    </Text>
                  </Td>
                  <Td>
                    <Text fontSize="sm" color="gray.600">
                      {supplier.updatedAt?.toLocaleDateString() || '-'}
                    </Text>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        colorScheme="green"
                        onClick={() => onAction(supplier)}
                        leftIcon={<ExternalLink size={14} />}
                      >
                        View Details
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};
