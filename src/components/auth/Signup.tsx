import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
  Container,
  Heading,
  FormErrorMessage,
  Link,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useSteps,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SupplierQuestionsForm } from './SupplierQuestionsForm';
import { getInviteData } from '../../services/supplierInvitations';

interface SignupProps {
  inviteToken?: string;
  onSignupComplete: () => void;
  onSwitchToLogin: () => void;
}

const steps = [
  { title: 'Account', description: 'Create your account' },
  { title: 'Questions', description: 'Answer required questions' }
];

export function Signup({ inviteToken, onSignupComplete, onSwitchToLogin }: SignupProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasTags, setHasTags] = useState(false);
  const { signUp } = useAuth();
  const toast = useToast();
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });

  // Check if invitation has tags when component mounts
  useEffect(() => {
    const checkInviteTags = async () => {
      if (inviteToken) {
        try {
          const inviteData = await getInviteData(inviteToken);
          setHasTags(!!inviteData?.tags?.length);
        } catch (error) {
          console.error('Error checking invite tags:', error);
        }
      }
    };
    checkInviteTags();
  }, [inviteToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signUp(email, password, name, inviteToken);
      
      if (hasTags) {
        setActiveStep(1); // Move to questions step
      } else {
        toast({
          title: 'Account created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onSignupComplete();
      }
    } catch (err) {
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to create account. Please try again.'
      );
      toast({
        title: 'Signup failed',
        description: error,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionsComplete = async (answers: Record<string, string>) => {
    try {
      // Store the answers
      // This would typically be handled by the SupplierQuestionsForm's onComplete prop
      toast({
        title: 'Account setup complete',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onSignupComplete();
    } catch (error) {
      toast({
        title: 'Error saving answers',
        description: error instanceof Error ? error.message : 'Failed to save answers',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
      <Box
        py={{ base: '8', sm: '12' }}
        px={{ base: '4', sm: '10' }}
        bg="white"
        boxShadow={{ base: 'none', sm: 'md' }}
        borderRadius={{ base: 'none', sm: 'xl' }}
      >
        {hasTags && (
          <Stepper index={activeStep} mb={8}>
            {steps.map((step, index) => (
              <Step key={index}>
                <StepIndicator>
                  <StepStatus
                    complete={<StepIcon />}
                    incomplete={<StepNumber />}
                    active={<StepNumber />}
                  />
                </StepIndicator>
                <Box flexShrink='0'>
                  <StepTitle>{step.title}</StepTitle>
                  <StepDescription>{step.description}</StepDescription>
                </Box>
                <StepSeparator />
              </Step>
            ))}
          </Stepper>
        )}

        {activeStep === 0 ? (
          <VStack spacing="6">
            <Heading size="lg">Create Account</Heading>
            <Text color="gray.600">
              {inviteToken 
                ? "Complete your account setup" 
                : "Sign up to access the platform"}
            </Text>
            
            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <VStack spacing="5">
                <FormControl isInvalid={!!error}>
                  <FormLabel htmlFor="name">Full Name</FormLabel>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </FormControl>

                <FormControl isInvalid={!!error}>
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </FormControl>

                <FormControl isInvalid={!!error}>
                  <FormLabel htmlFor="password">Password</FormLabel>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {error && <FormErrorMessage>{error}</FormErrorMessage>}
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  fontSize="md"
                  isLoading={isLoading}
                  width="full"
                >
                  Create Account
                </Button>

                {!inviteToken && (
                  <Text fontSize="sm" color="gray.600">
                    Already have an account?{' '}
                    <Link color="blue.500" onClick={onSwitchToLogin}>
                      Sign in
                    </Link>
                  </Text>
                )}
              </VStack>
            </form>
          </VStack>
        ) : (
          inviteToken && <SupplierQuestionsForm 
            inviteCode={inviteToken}
            onComplete={handleQuestionsComplete}
          />
        )}
      </Box>
    </Container>
  );
}
