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
import type { Supplier } from '../types/supplier';

interface SupplierTableProps {
  suppliers: Supplier[];
  onAction: (supplier: Supplier) => void;
  isLoading?: boolean;
}

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
                      <Skeleton height="20px" />
                    </Td>
                  ))}
                </Tr>
              ))
            ) : suppliers.length === 0 ? (
              <Tr>
                <Td colSpan={7} textAlign="center" py={8}>
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
                      <Text>{supplier.primaryContact}</Text>
                      <Tooltip label="Send email">
                        <IconButton
                          aria-label="Send email"
                          icon={<Mail size={14} />}
                          size="xs"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `mailto:${supplier.primaryContact}`;
                          }}
                        />
                      </Tooltip>
                    </HStack>
                  </Td>
                  <Td>
                    <Badge
                      colorScheme={getStatusColor(supplier.status)}
                      px={2}
                      py={1}
                      borderRadius="full"
                    >
                      {getStatusLabel(supplier.status)}
                    </Badge>
                  </Td>
                  <Td>
                    <Text fontSize="sm" color="gray.600">
                      {supplier.invitationSentDate?.toLocaleDateString() || '-'}
                    </Text>
                  </Td>
                  <Td>
                    <Text fontSize="sm" color="gray.600">
                      {supplier.lastUpdated?.toLocaleDateString() || '-'}
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
