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
  useColorModeValue,
  Image,
  Icon,
  Tooltip,
  IconButton
} from '@chakra-ui/react';
import { FiUsers, FiFileText, FiHelpCircle, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import { useState } from 'react';
import logo from '../assets/logo.svg';
import icon from '../assets/icon.svg';

interface SidebarProps {
  onNavigate: (view: 'companies' | 'questions' | 'supplierProducts') => void;
  currentView: 'companies' | 'questions' | 'supplierProducts';
}

export const Sidebar = ({ onNavigate, currentView }: SidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  const iconColor = useColorModeValue('gray.600', 'gray.400');
  const activeColor = useColorModeValue('green.500', 'green.300');

  const menuItems = [
    { 
      text: 'Our Suppliers', 
      view: 'companies' as const, 
      icon: FiUsers,
      active: currentView === 'companies' 
    },
    { 
      text: 'Product Sheets', 
      view: 'supplierProducts' as const, 
      icon: FiFileText,
      active: currentView === 'supplierProducts' 
    },
    { 
      text: 'Question Bank', 
      view: 'questions' as const, 
      icon: FiHelpCircle,
      active: currentView === 'questions' 
    }
  ];

  return (
    <Box
      w={isExpanded ? "240px" : "72px"}
      h="100vh"
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      position="relative"
      transition="width 0.2s"
    >
      <VStack spacing={8} align="center" pt={6}>
        <Box>
          <Image 
            src={isExpanded ? logo : icon}
            alt="Stacks Data"
          />
        </Box>

        <VStack spacing={4} align="stretch" width="100%">
          {menuItems.map((item, index) => (
            <Tooltip 
              key={index} 
              label={!isExpanded ? item.text : undefined} 
              placement="right"
              hasArrow
            >
              <Flex
                px={4}
                py={3}
                align="center"
                cursor="pointer"
                color={item.active ? activeColor : iconColor}
                _hover={{ 
                  color: activeColor,
                  bg: useColorModeValue('gray.50', 'gray.700') 
                }}
                borderRadius="md"
                mx={2}
                transition="all 0.2s"
                onClick={() => onNavigate(item.view)}
              >
                <Icon 
                  as={item.icon} 
                  boxSize={5}
                  mr={isExpanded ? 3 : 0}
                />
                {isExpanded && (
                  <Text fontSize="sm">{item.text}</Text>
                )}
              </Flex>
            </Tooltip>
          ))}
        </VStack>

        <Box 
          position="absolute" 
          bottom={4} 
          left={0} 
          right={0}
          px={2}
        >
          <Menu placement="right">
            <MenuButton w="full">
              <Flex 
                justify="center" 
                align="center"
                p={2}
                borderRadius="md"
                _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
              >
                <Avatar size="sm" name="Amanda" />
                {isExpanded && (
                  <Text ml={3} fontSize="sm">Amanda</Text>
                )}
              </Flex>
            </MenuButton>
            <MenuList>
              <MenuItem>Profile</MenuItem>
              <MenuItem>Settings</MenuItem>
              <MenuItem color="red.500">Logout</MenuItem>
            </MenuList>
          </Menu>
        </Box>

        <IconButton
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          icon={isExpanded ? <FiChevronLeft /> : <FiChevronRight />}
          position="absolute"
          right="-12px"
          top="50%"
          transform="translateY(-50%)"
          size="sm"
          borderRadius="full"
          boxShadow="md"
          onClick={() => setIsExpanded(!isExpanded)}
          zIndex="1"
        />
      </VStack>
    </Box>
  );
};
