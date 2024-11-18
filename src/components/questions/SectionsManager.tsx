import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  Input,
  IconButton,
  Text,
  useToast,
  Box,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { GripVertical, Plus, X, Edit2 } from 'lucide-react';
import { QuestionSection } from '../../types/question';
import { getSections, addSection, updateSection, deleteSection } from '../../services/questions';

interface SectionsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSectionsUpdated: () => void;
}

export const SectionsManager = ({ isOpen, onClose, onSectionsUpdated }: SectionsManagerProps) => {
  const [sections, setSections] = useState<QuestionSection[]>([]);
  const [newSectionName, setNewSectionName] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchSections();
    }
  }, [isOpen]);

  const fetchSections = async () => {
    try {
      const fetchedSections = await getSections();
      setSections(fetchedSections);
    } catch (error) {
      toast({
        title: 'Error fetching sections',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleAddSection = async () => {
    if (!newSectionName.trim()) return;

    try {
      await addSection({
        name: newSectionName.trim(),
        order: sections.length,
        description: ''
      });
      setNewSectionName('');
      await fetchSections();
      onSectionsUpdated();
    } catch (error) {
      toast({
        title: 'Error adding section',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleUpdateSection = async (sectionId: string, newName: string) => {
    try {
      const section = sections.find(s => s.id === sectionId);
      if (!section) return;

      await updateSection({
        ...section,
        name: newName.trim()
      });
      setEditingSectionId(null);
      await fetchSections();
      onSectionsUpdated();
    } catch (error) {
      toast({
        title: 'Error updating section',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      await deleteSection(sectionId);
      await fetchSections();
      onSectionsUpdated();
    } catch (error) {
      toast({
        title: 'Error deleting section',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order for all affected sections
    const updatedSections = items.map((section, index) => ({
      ...section,
      order: index
    }));

    setSections(updatedSections);

    try {
      await Promise.all(
        updatedSections.map(section => updateSection(section))
      );
      onSectionsUpdated();
    } catch (error) {
      toast({
        title: 'Error updating section order',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
      });
      await fetchSections(); // Revert to original order on error
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Manage Sections</ModalHeader>
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <HStack>
              <Input
                placeholder="New section name"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
              />
              <IconButton
                aria-label="Add section"
                icon={<Plus size={20} />}
                onClick={handleAddSection}
              />
            </HStack>

            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="sections">
                {(provided) => (
                  <VStack
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    spacing={2}
                    align="stretch"
                  >
                    {sections.map((section, index) => (
                      <Draggable
                        key={section.id}
                        draggableId={section.id}
                        index={index}
                      >
                        {(provided) => (
                          <Box
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            bg="gray.50"
                            p={2}
                            borderRadius="md"
                          >
                            <HStack>
                              <Box {...provided.dragHandleProps}>
                                <GripVertical size={20} />
                              </Box>
                              {editingSectionId === section.id ? (
                                <Input
                                  value={section.name}
                                  onChange={(e) => {
                                    const updatedSections = sections.map(s =>
                                      s.id === section.id ? { ...s, name: e.target.value } : s
                                    );
                                    setSections(updatedSections);
                                  }}
                                  onBlur={() => handleUpdateSection(section.id, section.name)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      handleUpdateSection(section.id, section.name);
                                    }
                                  }}
                                  autoFocus
                                />
                              ) : (
                                <Text flex="1">{section.name}</Text>
                              )}
                              <IconButton
                                aria-label="Edit section"
                                icon={<Edit2 size={16} />}
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingSectionId(section.id)}
                              />
                              <IconButton
                                aria-label="Delete section"
                                icon={<X size={16} />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => handleDeleteSection(section.id)}
                              />
                            </HStack>
                          </Box>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </VStack>
                )}
              </Droppable>
            </DragDropContext>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
