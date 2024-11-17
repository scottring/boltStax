import { Box, VStack, Icon, Text, Flex, useColorModeValue, Image, IconButton } from '@chakra-ui/react';
import { FiUsers, FiList, FiPackage, FiShoppingBag, FiFileText, FiChevronLeft, FiChevronRight, FiLogOut, FiLogIn, FiUser } from 'react-icons/fi';
import logo from '../assets/logo.svg';
import icon from '../assets/icon.svg';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export type ViewType = 'mySuppliers' | 'questions' | 'supplierProducts' | 'customerProducts' | 'templates' | 'questionnaireResponse';

interface SidebarProps {
  onNavigate: (view: ViewType, params?: any) => void;
  currentView: ViewType;
  hasSuppliers: boolean;
}

interface NavItemProps {
  icon: any;
  children: string | React.ReactNode;
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
  isCollapsed?: boolean;
  subText?: string;
}

const NavItem = ({ icon, children, isActive, onClick, disabled, isCollapsed, subText }: NavItemProps) => {
  const activeBg = useColorModeValue('gray.100', 'gray.700');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const color = useColorModeValue('gray.700', 'gray.200');
  const disabledColor = useColorModeValue('gray.400', 'gray.600');
  const subTextColor = useColorModeValue('gray.500', 'gray.400');

  return (
    <Flex
      align="center"
      px="4"
      py="3"
      cursor={disabled ? 'not-allowed' : 'pointer'}
      role="group"
      bg={isActive ? activeBg : 'transparent'}
      _hover={disabled ? {} : { bg: hoverBg }}
      onClick={disabled ? undefined : onClick}
      color={disabled ? disabledColor : color}
      opacity={disabled ? 0.6 : 1}
      justify={isCollapsed ? "center" : "flex-start"}
    >
      <Icon as={icon} fontSize="16" />
      {!isCollapsed && (
        <Flex direction="column" ml="3">
          <Text fontSize="sm" fontWeight={isActive ? 'medium' : 'normal'}>
            {children}
          </Text>
          {subText && (
            <Text fontSize="xs" color={subTextColor}>
              {subText}
            </Text>
          )}
        </Flex>
      )}
    </Flex>
  );
};

export const Sidebar = ({ onNavigate, currentView, hasSuppliers }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const { currentUser, userData, signOut } = useAuth();

  const handleAuthClick = async () => {
    if (currentUser) {
      await signOut();
      window.location.href = '/login';
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <Box
      as="nav"
      pos="sticky"
      top="0"
      h="100vh"
      bg={bg}
      borderRight="1px"
      borderColor={borderColor}
      w={isCollapsed ? "16" : "64"}
      transition="width 0.2s"
      position="relative"
    >
      <Flex direction="column" h="full">
        <Flex 
          px={isCollapsed ? "2" : "6"} 
          py="6" 
          align="center" 
          justify="center"
        >
          <Box width={isCollapsed ? "32px" : "auto"}>
            <Image 
              src={isCollapsed ? icon : logo} 
              alt="Stacks Data" 
              height="32px"
              width={isCollapsed ? "32px" : "auto"}
              objectFit="contain"
            />
          </Box>
        </Flex>

        <IconButton
          icon={isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setIsCollapsed(!isCollapsed)}
          variant="solid"
          size="sm"
          position="absolute"
          top="7"
          right="-3"
          transform="translateX(50%)"
          borderRadius="full"
          boxShadow="base"
          bg={bg}
          _hover={{ bg: bg }}
          _active={{ bg: bg }}
          zIndex="1"
        />

        <VStack spacing="1" align="stretch" px={isCollapsed ? "0" : "2"} mt="4" flex="1">
          <NavItem
            icon={FiUsers}
            isActive={currentView === 'mySuppliers'}
            onClick={() => onNavigate('mySuppliers')}
            isCollapsed={isCollapsed}
          >
            My Suppliers
          </NavItem>
          
          <NavItem
            icon={FiList}
            isActive={currentView === 'questions'}
            onClick={() => onNavigate('questions')}
            isCollapsed={isCollapsed}
          >
            Questions
          </NavItem>

          <NavItem
            icon={FiPackage}
            isActive={currentView === 'supplierProducts'}
            onClick={() => onNavigate('supplierProducts')}
            disabled={!hasSuppliers}
            isCollapsed={isCollapsed}
          >
            Supplier Products
          </NavItem>

          <NavItem
            icon={FiShoppingBag}
            isActive={currentView === 'customerProducts'}
            onClick={() => onNavigate('customerProducts')}
            isCollapsed={isCollapsed}
          >
            Customer Products
          </NavItem>

          <NavItem
            icon={FiFileText}
            isActive={currentView === 'templates'}
            onClick={() => onNavigate('templates')}
            isCollapsed={isCollapsed}
          >
            Templates
          </NavItem>

          <Box mt="auto" mb="4">
            <NavItem
              icon={currentUser ? FiUser : FiLogIn}
              onClick={handleAuthClick}
              isCollapsed={isCollapsed}
              subText={currentUser && userData ? userData.email : undefined}
            >
              {currentUser && userData ? userData.name : 'Login'}
            </NavItem>
          </Box>
        </VStack>
      </Flex>
    </Box>
  );
};
