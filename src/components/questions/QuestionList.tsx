import {
  Box,
  Text,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { Question, QuestionTag, QuestionSection } from '../../types/question';
import { QuestionItem } from './QuestionItem';

interface QuestionListProps {
  questions: Question[];
  sections: QuestionSection[];
  tags: QuestionTag[];
  selectedQuestions: string[];
  onToggleSelect: (id: string) => void;
  onEdit: (question: Question) => void;
  onDelete: (id: string) => void;
  onReorder: (questions: Question[]) => void;
}

export const QuestionList = ({
  questions,
  sections,
  tags,
  selectedQuestions,
  onToggleSelect,
  onEdit,
  onDelete,
  onReorder,
}: QuestionListProps) => {
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    
    // Create a new array with spread to ensure we're working with new references
    const newQuestions = [...questions];
    // Store references to the questions being swapped
    const questionToMove = { ...newQuestions[index] };
    const questionToSwap = { ...newQuestions[index - 1] };
    
    // Swap the questions while preserving their properties
    newQuestions[index - 1] = questionToMove;
    newQuestions[index] = questionToSwap;
    
    onReorder(newQuestions);
  };

  const handleMoveDown = (index: number) => {
    if (index === questions.length - 1) return;
    
    // Create a new array with spread to ensure we're working with new references
    const newQuestions = [...questions];
    // Store references to the questions being swapped
    const questionToMove = { ...newQuestions[index] };
    const questionToSwap = { ...newQuestions[index + 1] };
    
    // Swap the questions while preserving their properties
    newQuestions[index] = questionToSwap;
    newQuestions[index + 1] = questionToMove;
    
    onReorder(newQuestions);
  };

  const renderQuestions = (filteredQuestions: Question[]) => {
    return filteredQuestions.map((question, index) => (
      <QuestionItem
        key={question.id}
        question={question}
        index={index}
        isFirst={index === 0}
        isLast={index === filteredQuestions.length - 1}
        tags={tags}
        selectedQuestions={selectedQuestions}
        onToggleSelect={onToggleSelect}
        onEdit={onEdit}
        onDelete={onDelete}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
      />
    ));
  };

  return (
    <Accordion defaultIndex={[0]} allowMultiple>
      {/* Unsorted Questions Section */}
      <AccordionItem>
        <AccordionButton>
          <Box flex="1" textAlign="left">
            <Text fontWeight="bold">Unsorted Questions</Text>
          </Box>
          <AccordionIcon />
        </AccordionButton>
        <AccordionPanel>
          {renderQuestions(questions.filter(q => !q.sectionId))}
        </AccordionPanel>
      </AccordionItem>

      {/* Sections */}
      {sections.map(section => (
        <AccordionItem key={section.id}>
          <AccordionButton>
            <Box flex="1" textAlign="left">
              <Text fontWeight="bold">{section.name}</Text>
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel>
            {renderQuestions(questions.filter(q => q.sectionId === section.id))}
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
