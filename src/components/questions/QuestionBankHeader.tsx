import {
  Flex,
  Button,
  Heading,
  HStack,
} from '@chakra-ui/react';

interface QuestionBankHeaderProps {
  onOpenSections: () => void;
  onOpenTags: () => void;
  onOpenImport: () => void;
  onOpenAddQuestion: () => void;
}

export const QuestionBankHeader = ({
  onOpenSections,
  onOpenTags,
  onOpenImport,
  onOpenAddQuestion,
}: QuestionBankHeaderProps) => {
  return (
    <Flex 
      justify="space-between" 
      align="center" 
      px="6" 
      py="6"
      borderBottom="1px"
      borderColor="gray.200"
    >
      <Heading size="lg">Question Bank</Heading>
      <HStack spacing={4}>
        <Button onClick={onOpenSections}>Manage Sections</Button>
        <Button onClick={onOpenTags}>Manage Tags</Button>
        <Button onClick={onOpenImport}>Import Questions</Button>
        <Button onClick={onOpenAddQuestion}>
          Add New Question
        </Button>
      </HStack>
    </Flex>
  );
};
