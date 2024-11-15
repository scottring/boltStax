import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Progress,
  Button,
  Box,
  Badge,
  Text,
  HStack,
  Skeleton,
  TableContainer
} from '@chakra-ui/react';
import type { Supplier } from '../types/supplier';

interface SupplierTableProps {
  suppliers: Supplier[];
  onAction: (supplier: Supplier) => void;
  isLoading?: boolean;
}

export const SupplierTable = ({ suppliers, onAction, isLoading = false }: SupplierTableProps) => {
  return (
    <Box bg="white" borderRadius="lg" shadow="sm" overflow="hidden">
      <TableContainer>
        <Table variant="simple">
          <Thead bg="gray.50">
            <Tr>
              <Th>Supplier ID</Th>
              <Th>Supplier Name</Th>
              <Th>Task Progress</Th>
              <Th>Primary Contact</Th>
              <Th>Status</Th>
              <Th>Compliance Score</Th>
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
                  No suppliers found
                </Td>
              </Tr>
            ) : (
              suppliers.map((supplier) => (
                <Tr key={supplier.id}>
                  <Td fontWeight="medium">{supplier.id}</Td>
                  <Td>{supplier.name}</Td>
                  <Td>
                    <HStack spacing={3}>
                      <Progress 
                        value={supplier.taskProgress} 
                        size="sm" 
                        colorScheme="green"
                        borderRadius="full"
                        width="100px"
                      />
                      <Text fontSize="sm">{supplier.taskProgress}%</Text>
                    </HStack>
                  </Td>
                  <Td>{supplier.primaryContact}</Td>
                  <Td>
                    <Badge
                      colorScheme={supplier.status === 'active' ? 'green' : 'gray'}
                      borderRadius="full"
                      px={2}
                    >
                      {supplier.status}
                    </Badge>
                  </Td>
                  <Td>
                    {supplier.complianceScore ? (
                      <Text color={supplier.complianceScore >= 80 ? 'green.500' : 'orange.500'}>
                        {supplier.complianceScore}%
                      </Text>
                    ) : '-'}
                  </Td>
                  <Td>
                    <Button
                      size="sm"
                      colorScheme="green"
                      onClick={() => onAction(supplier)}
                    >
                      Action
                    </Button>
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