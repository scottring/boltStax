import {
  Box,
  Text,
  Flex,
  Tag,
  VStack,
  Badge,
} from '@chakra-ui/react';
import type { Question, QuestionTag, QuestionSection } from '../../types/question';

interface QuestionPreviewProps {
  question: Question;
  tags: QuestionTag[];
  sections: QuestionSection[];
}

export const QuestionPreview = ({ question, tags, sections }: QuestionPreviewProps) => {
  const section = question.sectionId 
    ? sections.find(s => s.id === question.sectionId)
    : undefined;

  return (
    <Box
      p={3}
      bg="gray.50"
      borderRadius="md"
      mb={2}
    >
      <VStack align="stretch" spacing={2}>
        {section && (
          <Text fontSize="xs" color="gray.500">
            Section: {section.name}
          </Text>
        )}
        <Text fontSize="sm">{question.text}</Text>
        <Flex gap={2} flexWrap="wrap">
          <Tag size="sm" colorScheme="blue">
            {question.type}
          </Tag>
          {question.required && (
            <Tag size="sm" colorScheme="red">
              Required
            </Tag>
          )}
          {question.tags.map((tagId) => {
            const tag = tags.find(t => t.id === tagId);
            return tag ? (
              <Tag
                key={tagId}
                size="sm"
                bgColor={`${tag.color}20`}
              >
                {tag.name}
              </Tag>
            ) : null;
          })}
        </Flex>
      </VStack>
    </Box>
  );
};