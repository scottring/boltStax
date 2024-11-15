import {
  Box,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useDropzone } from 'react-dropzone';
import { useCallback } from 'react';

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
}

export const FileDropzone = ({ onFileSelect }: FileDropzoneProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      console.log('File selected:', file.name, file.type, file.size);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    multiple: false,
    maxSize: 5242880, // 5MB
  });

  return (
    <Box
      {...getRootProps()}
      w="full"
      p={10}
      border="2px"
      borderColor={isDragActive ? 'green.500' : 'gray.200'}
      borderStyle="dashed"
      borderRadius="md"
      bg={isDragActive ? 'green.50' : 'gray.50'}
      cursor="pointer"
      transition="all 0.2s"
      _hover={{ bg: 'gray.100' }}
    >
      <input {...getInputProps()} />
      <VStack spacing={2}>
        <Text color="gray.600">
          {isDragActive
            ? 'Drop the file here'
            : 'Drag and drop an Excel file, or click to select'}
        </Text>
        <Text fontSize="sm" color="gray.500">
          Supports .xlsx, .xls, and .csv files (max 5MB)
        </Text>
      </VStack>
    </Box>
  );
};