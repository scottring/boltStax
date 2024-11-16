import { 
  Box, 
  Text, 
  VStack, 
  Link, 
  Icon,
  useColorModeValue
} from '@chakra-ui/react';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File } from 'lucide-react';

export interface FileDropzoneProps {
  acceptedFileTypes?: string[];
  existingFiles?: string[];
  onFilesUploaded: (urls: string[]) => void;
}

export const FileDropzone = ({
  acceptedFileTypes,
  existingFiles = [],
  onFilesUploaded
}: FileDropzoneProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // TODO: Implement actual file upload logic
    const mockUrls = acceptedFiles.map(file => 
      URL.createObjectURL(file)
    );
    onFilesUploaded(mockUrls);
  }, [onFilesUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes 
      ? Object.fromEntries(acceptedFileTypes.map(type => [type, []]))
      : undefined
  });

  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const activeBgColor = useColorModeValue('gray.100', 'gray.600');

  return (
    <VStack spacing={4} align="stretch">
      <Box
        {...getRootProps()}
        borderWidth={2}
        borderStyle="dashed"
        borderColor={isDragActive ? 'green.500' : borderColor}
        borderRadius="md"
        p={6}
        bg={isDragActive ? activeBgColor : bgColor}
        cursor="pointer"
        transition="all 0.2s"
        _hover={{
          borderColor: 'green.500'
        }}
      >
        <input {...getInputProps()} />
        <VStack spacing={2}>
          <Icon as={Upload} boxSize={6} color={isDragActive ? 'green.500' : 'gray.500'} />
          <Text textAlign="center" color="gray.500">
            {isDragActive
              ? 'Drop files here'
              : 'Drag and drop files here, or click to select files'}
          </Text>
          {acceptedFileTypes && (
            <Text fontSize="sm" color="gray.500">
              Accepted file types: {acceptedFileTypes.join(', ')}
            </Text>
          )}
        </VStack>
      </Box>

      {existingFiles.length > 0 && (
        <VStack align="stretch" spacing={2}>
          <Text fontSize="sm" fontWeight="medium">Uploaded Files:</Text>
          {existingFiles.map((file, index) => (
            <Link
              key={index}
              href={file}
              target="_blank"
              rel="noopener noreferrer"
              fontSize="sm"
              color="green.500"
              display="flex"
              alignItems="center"
            >
              <Icon as={File} mr={2} boxSize={4} />
              {file.split('/').pop()}
            </Link>
          ))}
        </VStack>
      )}
    </VStack>
  );
};
