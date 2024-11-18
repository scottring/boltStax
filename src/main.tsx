import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import App from './App';
import theme from './theme';
import { BrowserRouter } from 'react-router-dom';
import { TestProvider } from './utils/TestProvider';
import { AuthProvider } from './contexts/AuthContext';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <ChakraProvider theme={theme}>
        <AuthProvider>
          <TestProvider>
            <App />
          </TestProvider>
        </AuthProvider>
      </ChakraProvider>
    </BrowserRouter>
  </StrictMode>
);
