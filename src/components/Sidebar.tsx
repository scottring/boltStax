import { 
  Box, 
  VStack, 
  Text,
  Flex,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue
} from '@chakra-ui/react';

interface SidebarProps {
  onNavigate: (view: 'companies' | 'questions' | 'supplierProducts') => void;
  currentView: 'companies' | 'questions' | 'supplierProducts';
}

export const Sidebar = ({ onNavigate, currentView }: SidebarProps) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const menuItems = [
    { text: 'Our Suppliers', view: 'companies' as const, active: currentView === 'companies' },
    { text: 'Product Sheets', view: 'supplierProducts' as const, active: currentView === 'supplierProducts' },
    { text: 'Question Bank', view: 'questions' as const, active: currentView === 'questions' }
  ];

  return (
    <Box
      w="250px"
      h="100vh"
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      py={4}
    >
      <VStack spacing={8} align="stretch">
        <Box px={4}>
          <Text fontSize="xl" fontWeight="bold">StacksData</Text>
        </Box>

        <VStack spacing={1} align="stretch">
          {menuItems.map((item, index) => (
            <Flex
              key={index}
              px={4}
              py={3}
              align="center"
              cursor="pointer"
              bg={item.active ? 'gray.100' : 'transparent'}
              _hover={{ bg: 'gray.50' }}
              borderRadius="md"
              mx={2}
              onClick={() => onNavigate(item.view)}
            >
              <Text 
                color={item.active ? 'green.500' : 'gray.600'} 
                fontWeight={item.active ? 'medium' : 'normal'}
              >
                {item.text}
              </Text>
            </Flex>
          ))}
        </VStack>

        <Box mt="auto" px={4}>
          <Menu>
            <MenuButton w="full">
              <Flex align="center" gap={3} p={2}>
                <Avatar size="sm" name="Amanda" />
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="medium">Amanda</Text>
                  <Text fontSize="xs" color="gray.500">Show Profile</Text>
                </Box>
              </Flex>
            </MenuButton>
            <MenuList>
              <MenuItem>Profile</MenuItem>
              <MenuItem>Settings</MenuItem>
              <MenuItem color="red.500">Logout</MenuItem>
            </MenuList>
          </Menu>
        </Box>
      </VStack>
    </Box>
  );
};