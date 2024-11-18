import React from 'react';
import {
  Box,
  Flex,
  Image,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  Avatar,
  Text,
  Button,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.svg';
import { useAuth } from '../contexts/AuthContext';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userData, signOut } = useAuth();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.700');

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <Box
      as="header"
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={10}
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      px={4}
      py={2}
      boxShadow="sm"
    >
      <Flex
        maxW="1400px"
        mx="auto"
        align="center"
        justify="space-between"
        h="60px"
      >
        {/* Logo Section */}
        <Flex align="center">
          <Image src={logo} h="32px" alt="Logo" />
        </Flex>

        {/* Navigation Section */}
        <HStack spacing={8} display={{ base: 'none', md: 'flex' }}>
          <Button variant="ghost" onClick={() => navigate('/suppliers')}>
            Suppliers
          </Button>
          <Button variant="ghost" onClick={() => navigate('/customers')}>
            Customers
          </Button>
          <Button variant="ghost" onClick={() => navigate('/products')}>
            Products
          </Button>
          <Button variant="ghost" onClick={() => navigate('/questionnaires')}>
            Questionnaires
          </Button>
        </HStack>

        {/* User Profile Section */}
        <HStack spacing={4}>
          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              rounded="full"
              px={2}
              py={1}
              _hover={{ bg: 'gray.50' }}
            >
              <HStack spacing={2}>
                <Avatar
                  size="sm"
                  name={userData?.name || currentUser?.email || 'User'}
                  bg="brand.500"
                  color="white"
                />
                <Text
                  display={{ base: 'none', md: 'block' }}
                  fontSize="sm"
                  fontWeight="medium"
                >
                  {userData?.name || currentUser?.email?.split('@')[0] || 'User'}
                </Text>
              </HStack>
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => navigate('/profile')}>Profile</MenuItem>
              <MenuItem onClick={() => navigate('/settings')}>Settings</MenuItem>
              <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  );
};

export default Header;
