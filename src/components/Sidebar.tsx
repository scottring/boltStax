import { Box, VStack, Icon, Text, Flex, useColorModeValue, Image, IconButton } from '@chakra-ui/react';
import { FiUsers, FiList, FiPackage, FiShoppingBag, FiFileText, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import logo from '../assets/logo.svg';
import icon from '../assets/icon.svg';
import { useState } from 'react';

export type ViewType = 'mySuppliers' | 'questions' | 'supplierProducts' | 'customerProducts' | 'templates' | 'questionnaireResponse';

interface SidebarProps {
  onNavigate: (view: ViewType, params?: any) => void;
  currentView: ViewType;
  hasSuppliers: boolean;
}

interface NavItemProps {
  icon: any;
  children: string;
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
  isCollapsed?: boolean;
}

const NavItem = ({ icon, children, isActive, onClick, disabled, isCollapsed }: NavItemProps) => {
  const activeBg = useColorModeValue('gray.100', 'gray.700');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const color = useColorModeValue('gray.700', 'gray.200');
  const disabledColor = useColorModeValue('gray.400', 'gray.600');

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
      {!isCollapsed && <Text ml="3" fontSize="sm" fontWeight={isActive ? 'medium' : 'normal'}>
        {children}
      </Text>}
    </Flex>
  );
};

export const Sidebar = ({ onNavigate, currentView, hasSuppliers }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

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

        <VStack spacing="1" align="stretch" px={isCollapsed ? "0" : "2"} mt="4">
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
        </VStack>
      </Flex>
    </Box>
  );
};
