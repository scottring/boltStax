import {
  Box,
  Text,
  VStack,
  HStack,
  Tag,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import type { Product } from '../../types/product';
import type { QuestionTag } from '../../types/question';
import { getTags } from '../../services/questions';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const [tags, setTags] = useState<QuestionTag[]>([]);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const fetchedTags = await getTags();
        setTags(fetchedTags);
      } catch (error) {
        console.error('Error loading tags:', error);
      }
    };

    loadTags();
  }, []);

  const getTagColor = (tagName: string) => {
    const tag = tags.find(t => t.name === tagName);
    return tag?.color || '#2B6CB0';
  };

  return (
    <Box
      bg="white"
      p={5}
      borderRadius="lg"
      shadow="sm"
      border="1px"
      borderColor="gray.100"
      transition="all 0.2s"
      _hover={{ shadow: 'md' }}
    >
      <VStack align="stretch" spacing={4}>
        <Text fontSize="lg" fontWeight="medium">
          {product.name}
        </Text>

        {product.tags.length > 0 && (
          <Box>
            <Text fontSize="sm" color="gray.500" mb={2}>
              Tags:
            </Text>
            <HStack spacing={2} flexWrap="wrap">
              {product.tags.map((tagName, index) => (
                <Tag
                  key={index}
                  variant="subtle"
                  bgColor={`${getTagColor(tagName)}20`}
                >
                  {tagName}
                </Tag>
              ))}
            </HStack>
          </Box>
        )}

        <Text fontSize="sm" color="gray.500">
          Last Updated: {product.lastUpdated.toLocaleDateString()}
        </Text>
      </VStack>
    </Box>
  );
};