import {
  Box,
  Flex,
  Heading,
  IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Tag as ChakraTag,
  HStack,
  Text,
  useToast,
  useColorModeValue,
  Tooltip
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { Plus, MoreVertical, Edit2, Archive, Copy } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import type { QuestionnaireTemplate } from '../../types/questionnaire';
import type { Tag } from '../../types/tag';
import { getTemplates, archiveTemplate } from '../../services/questionnaireTemplates';
import { getTags } from '../../services/tags';
import { TemplateEditorModal } from './TemplateEditorModal';

export const QuestionnaireTemplatesView = () => {
  const [templates, setTemplates] = useState<QuestionnaireTemplate[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedTemplate, setSelectedTemplate] = useState<QuestionnaireTemplate | undefined>(undefined);

  const tableBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.700');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [fetchedTemplates, fetchedTags] = await Promise.all([
        getTemplates(),
        getTags()
      ]);
      setTemplates(fetchedTemplates);
      setTags(fetchedTags);
    } catch (error) {
      toast({
        title: 'Error fetching data',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleArchive = async (template: QuestionnaireTemplate) => {
    try {
      await archiveTemplate(template.id);
      toast({
        title: 'Template archived',
        status: 'success',
        duration: 3000,
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error archiving template',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleEdit = (template: QuestionnaireTemplate) => {
    setSelectedTemplate(template);
    onOpen();
  };

  const handleDuplicate = (template: QuestionnaireTemplate) => {
    setSelectedTemplate({
      ...template,
      id: '',
      title: `${template.title} (Copy)`,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      version: 1
    });
    onOpen();
  };

  const handleCreateNew = () => {
    setSelectedTemplate(undefined);
    onOpen();
  };

  const getTagById = (tagId: string) => {
    return tags.find(tag => tag.id === tagId);
  };

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="md" fontWeight="medium">Questionnaire Templates</Heading>
        <Tooltip label="Create New Template" hasArrow>
          <IconButton
            aria-label="Create new template"
            icon={<Plus size={18} />}
            onClick={handleCreateNew}
            colorScheme="green"
            variant="ghost"
            size="sm"
          />
        </Tooltip>
      </Flex>

      <Box
        bg={tableBg}
        borderRadius="xl"
        borderWidth="1px"
        borderColor={borderColor}
        overflow="hidden"
        boxShadow="sm"
      >
        <Table variant="simple" size="sm">
          <Thead bg={headerBg}>
            <Tr>
              <Th py={4} fontSize="xs" textTransform="none">Template Name</Th>
              <Th py={4} fontSize="xs" textTransform="none">Tags</Th>
              <Th py={4} fontSize="xs" textTransform="none">Sections</Th>
              <Th py={4} fontSize="xs" textTransform="none">Questions</Th>
              <Th py={4} fontSize="xs" textTransform="none">Last Updated</Th>
              <Th py={4} fontSize="xs" textTransform="none">Version</Th>
              <Th width="50px"></Th>
            </Tr>
          </Thead>
          <Tbody>
            {templates.map((template) => (
              <Tr key={template.id}>
                <Td fontWeight="medium">{template.title}</Td>
                <Td>
                  <HStack spacing={1} flexWrap="wrap">
                    {template.tags.map(tagId => {
                      const tag = getTagById(tagId);
                      return tag ? (
                        <ChakraTag
                          key={tagId}
                          size="sm"
                          borderRadius="full"
                          variant="subtle"
                          bgColor={`${tag.color}15`}
                          color={tag.color}
                        >
                          {tag.name}
                        </ChakraTag>
                      ) : null;
                    })}
                  </HStack>
                </Td>
                <Td>
                  <Text fontSize="sm">{template.sections.length}</Text>
                </Td>
                <Td>
                  <Text fontSize="sm">
                    {template.sections.reduce((total, section) => total + section.questions.length, 0)}
                  </Text>
                </Td>
                <Td>
                  <Text fontSize="sm">
                    {template.updatedAt.toDate().toLocaleDateString()}
                  </Text>
                </Td>
                <Td>
                  <Text fontSize="sm">v{template.version}</Text>
                </Td>
                <Td>
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      icon={<MoreVertical size={14} />}
                      variant="ghost"
                      size="xs"
                      _hover={{ bg: 'gray.100' }}
                    />
                    <MenuList shadow="lg" py={1} minW="150px">
                      <MenuItem
                        icon={<Edit2 size={14} />}
                        onClick={() => handleEdit(template)}
                        fontSize="sm"
                      >
                        Edit
                      </MenuItem>
                      <MenuItem
                        icon={<Copy size={14} />}
                        onClick={() => handleDuplicate(template)}
                        fontSize="sm"
                      >
                        Duplicate
                      </MenuItem>
                      <MenuItem
                        icon={<Archive size={14} />}
                        onClick={() => handleArchive(template)}
                        color="red.500"
                        fontSize="sm"
                      >
                        Archive
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      <TemplateEditorModal
        isOpen={isOpen}
        onClose={onClose}
        template={selectedTemplate}
        onSaved={fetchData}
        availableTags={tags}
      />
    </Box>
  );
};
