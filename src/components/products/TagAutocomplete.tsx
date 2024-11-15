import {
  Input,
  Box,
  VStack,
  Text,
  useOutsideClick,
} from '@chakra-ui/react';
import { useRef, useState } from 'react';
import type { Tag } from '../../types/tag';

interface TagAutocompleteProps {
  tags: Tag[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (tag: string) => void;
  placeholder?: string;
}

export const TagAutocomplete = ({
  tags,
  value,
  onChange,
  onSelect,
  placeholder
}: TagAutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useOutsideClick({
    ref: ref,
    handler: () => setIsOpen(false),
  });

  const filteredTags = tags
    .filter(tag => 
      tag.name.toLowerCase().includes(value.toLowerCase()) && 
      value.length > 0
    )
    .slice(0, 5);

  return (
    <Box position="relative" ref={ref}>
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredTags.length > 0) {
              onSelect(filteredTags[0].name);
              setIsOpen(false);
            }
          }
        }}
      />
      {isOpen && filteredTags.length > 0 && (
        <VStack
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={1}
          bg="white"
          borderRadius="md"
          shadow="lg"
          spacing={0}
          zIndex={1000}
          maxH="200px"
          overflowY="auto"
        >
          {filteredTags.map((tag) => (
            <Box
              key={tag.id}
              w="full"
              px={4}
              py={2}
              cursor="pointer"
              _hover={{ bg: 'gray.50' }}
              onClick={() => {
                onSelect(tag.name);
                setIsOpen(false);
              }}
            >
              <Text>{tag.name}</Text>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
};