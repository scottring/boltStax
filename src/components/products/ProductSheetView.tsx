import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  Text,
  Badge,
  VStack,
  HStack,
  Tag,
  useColorModeValue,
  Divider,
  Flex,
  Button
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import type { ProductSheet } from '../../types/productSheet';
import type { Supplier } from '../../types/supplier';
import type { QuestionTag } from '../../types/question';
import { getSupplier } from '../../services/suppliers';

interface ProductSheetViewProps {
  isOpen: boolean;
  onClose: () => void;
  sheet: ProductSheet;
  tags: QuestionTag[];
}

export const ProductSheetView = ({
  isOpen,
  onClose,
  sheet,
  tags
}: ProductSheetViewProps) => {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const borderColor = useColorModeValue('gray.100', 'gray.600');
  const sectionBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    const loadSupplier = async () => {
      try {
        const supplierData = await getSupplier(sheet.supplierId);
        setSupplier(supplierData);
      } catch (error) {
        console.error('Error loading supplier:', error);
      }
    };

    if (sheet.supplierId) {
      loadSupplier();
    }
  }, [sheet.supplierId]);

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay bg="blackAlpha.200" backdropFilter="blur(2px)" />
      <ModalContent borderRadius="xl" shadow="lg">
        <ModalHeader pt={6}>
          <Text fontSize="lg" fontWeight="medium">{sheet.name}</Text>
          <HStack spacing={4} mt={2}>
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
            <Text fontSize="xs" color="gray.500">
              Created {sheet.createdAt.toLocaleDateString()}
            </Text>
            {sheet.dueDate && (
              <Text fontSize="xs" color="gray.500">
                Due {sheet.dueDate.toLocaleDateString()}
              </Text>
            )}
          </HStack>
        </ModalHeader>
        <ModalCloseButton size="sm" />
        
        <ModalBody pb={6}>
          <VStack spacing={6} align="stretch">
            <Box>
              <Text fontSize="sm" color="gray.500" mb={2}>Supplier</Text>
              <Text fontSize="md">{supplier?.name || 'Loading...'}</Text>
            </Box>

            <Box>
              <Text fontSize="sm" color="gray.500" mb={2}>Tags</Text>
              <HStack spacing={2} flexWrap="wrap">
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
            </Box>

            <Divider borderColor={borderColor} />

            <Box>
              <Text fontSize="sm" color="gray.500" mb={4}>Response Status</Text>
              <Box 
                bg={sectionBg} 
                p={4} 
                borderRadius="md" 
                borderWidth="1px"
                borderColor={borderColor}
              >
                {sheet.status === 'draft' ? (
                  <Text fontSize="sm">This sheet hasn't been sent to the supplier yet.</Text>
                ) : sheet.status === 'sent' ? (
                  <Text fontSize="sm">Waiting for supplier response.</Text>
                ) : sheet.status === 'inProgress' ? (
                  <Text fontSize="sm">Supplier is currently working on the response.</Text>
                ) : (
                  <Text fontSize="sm">Response has been submitted.</Text>
                )}
              </Box>
            </Box>

            {sheet.status === 'completed' && (
              <Flex justify="flex-end">
                <Button
                  colorScheme="green"
                  size="sm"
                  onClick={() => {/* TODO: View response */}}
                >
                  View Response
                </Button>
              </Flex>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
