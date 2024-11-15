import {
  Input,
  VStack,
  Box,
  Tag,
  TagLabel,
  TagCloseButton,
  Button,
  Text,
  Portal,
} from '@chakra-ui/react';
import { useState, useRef, useEffect } from 'react';
import type { QuestionTag } from '../../types/question';

interface TagSelectorProps {
  availableTags: QuestionTag[];
  selectedTagIds: string[];
  onChange: (selectedTags: string[]) => void;
}

export const TagSelector = ({
  availableTags,
  selectedTagIds,
  onChange,
}: TagSelectorProps) => {
  const [searchValue, setSearchValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTags = availableTags.filter(tag => 
    !selectedTagIds.includes(tag.id) &&
    tag.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleTagSelect = (tagId: string) => {
    onChange([...selectedTagIds, tagId]);
    setSearchValue('');
    setIsOpen(false);
  };

  const handleTagRemove = (tagId: string) => {
    onChange(selectedTagIds.filter(id => id !== tagId));
  };

  const selectedTags = availableTags.filter(tag => selectedTagIds.includes(tag.id));

  return (
    <VStack align="stretch" spacing={3}>
      <Box position="relative">
        <Input
          ref={inputRef}
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Type to search tags..."
        />
        {isOpen && filteredTags.length > 0 && (
          <Portal>
            <Box
              ref={dropdownRef}
              position="absolute"
              top={`${inputRef.current?.getBoundingClientRect().bottom ?? 0}px`}
              left={`${inputRef.current?.getBoundingClientRect().left ?? 0}px`}
              width={`${inputRef.current?.offsetWidth ?? 0}px`}
              zIndex={1400}
              bg="white"
              boxShadow="lg"
              borderRadius="md"
              mt={1}
              maxH="200px"
              overflowY="auto"
            >
              {filteredTags.map((tag) => (
                <Button
                  key={tag.id}
                  w="full"
                  justifyContent="flex-start"
                  variant="ghost"
                  onClick={() => handleTagSelect(tag.id)}
                  py={2}
                  px={4}
                  h="auto"
                  _hover={{
                    bg: `${tag.color}10`,
                  }}
                >
                  <Tag
                    size="sm"
                    borderRadius="full"
                    variant="subtle"
                    bgColor={`${tag.color}20`}
                  >
                    <TagLabel>{tag.name}</TagLabel>
                  </Tag>
                </Button>
              ))}
            </Box>
          </Portal>
        )}
      </Box>

      {selectedTags.length > 0 && (
        <Box>
          <Text fontSize="sm" color="gray.600" mb={2}>
            Selected tags:
          </Text>
          <Box display="flex" flexWrap="wrap" gap={2}>
            {selectedTags.map((tag) => (
              <Tag
                key={tag.id}
                size="md"
                borderRadius="full"
                variant="subtle"
                bgColor={`${tag.color}20`}
              >
                <TagLabel>{tag.name}</TagLabel>
                <TagCloseButton onClick={() => handleTagRemove(tag.id)} />
              </Tag>
            ))}
          </Box>
        </Box>
      )}
    </VStack>
  );
};