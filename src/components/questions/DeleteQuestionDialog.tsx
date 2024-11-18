import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
} from '@chakra-ui/react';
import { RefObject } from 'react';

interface DeleteQuestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cancelRef: RefObject<HTMLButtonElement>;
  selectedCount: number;
}

export const DeleteQuestionDialog = ({
  isOpen,
  onClose,
  onConfirm,
  cancelRef,
  selectedCount,
}: DeleteQuestionDialogProps) => {
  const isSingle = selectedCount === 1;

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Delete {isSingle ? 'Question' : 'Questions'}
          </AlertDialogHeader>

          <AlertDialogBody>
            Are you sure you want to delete {isSingle ? 'this question' : `these ${selectedCount} questions`}? 
            This action cannot be undone.
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={onConfirm} ml={3}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};
