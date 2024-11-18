import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Box,
  Divider,
  VStack,
  Badge,
  Spinner,
  Center
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { getQuestionsByTags, getSupplierAnswers } from '../services/supplierQuestionnaires';
import type { Question } from '../types/question';
import type { Supplier } from '../types/supplier';

interface SupplierDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
}

export const SupplierDetailsModal = ({ isOpen, onClose, supplier }: SupplierDetailsModalProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (supplier?.tags) {
        setIsLoading(true);
        try {
          const [questionData, answerData] = await Promise.all([
            getQuestionsByTags(supplier.tags),
            getSupplierAnswers(supplier.id)
          ]);
          setQuestions(questionData);
          setAnswers(answerData);
        } catch (error) {
          console.error('Error loading supplier details:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (isOpen && supplier) {
      loadData();
    }
  }, [isOpen, supplier]);

  if (!supplier) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent maxW="800px">
        <ModalHeader>
          <Text fontSize="2xl">{supplier.name}</Text>
          <Text fontSize="md" color="gray.600" mt={1}>{supplier.primaryContact}</Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={6} align="stretch">
            <Box>
              <Text fontWeight="bold" mb={2}>Company Information</Text>
              <Table variant="simple">
                <Tbody>
                  <Tr>
                    <Td fontWeight="medium" width="200px">Contact Name</Td>
                    <Td>{supplier.contactName}</Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="medium">Email</Td>
                    <Td>{supplier.primaryContact}</Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="medium">Status</Td>
                    <Td>
                      <Badge colorScheme={supplier.status === 'active' ? 'green' : 'orange'}>
                        {supplier.status}
                      </Badge>
                    </Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="medium">Tags</Td>
                    <Td>
                      {supplier.tags?.map((tag, index) => (
                        <Badge key={index} mr={2} colorScheme="blue">
                          {tag}
                        </Badge>
                      ))}
                    </Td>
                  </Tr>
                </Tbody>
              </Table>
            </Box>

            <Divider />

            <Box>
              <Text fontWeight="bold" mb={4}>Questionnaire Responses</Text>
              {isLoading ? (
                <Center py={8}>
                  <Spinner />
                </Center>
              ) : (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th width="50%">Question</Th>
                      <Th>Response</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {questions.map((question) => (
                      <Tr key={question.id}>
                        <Td fontWeight="medium">{question.text}</Td>
                        <Td>{answers?.[question.id] || 'Not answered'}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
