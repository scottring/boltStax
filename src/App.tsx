import { Flex, Box } from '@chakra-ui/react';
import { Sidebar } from './components/Sidebar';
import { CompaniesView } from './components/CompaniesView';
import { QuestionsView } from './components/questions/QuestionsView';
import { SupplierProductsView } from './components/products/SupplierProductsView';
import { CustomersProductsView } from './components/customers/CustomersProductsView';
import { useState } from 'react';

function App() {
  const [currentView, setCurrentView] = useState<'companies' | 'questions' | 'supplierProducts' | 'customerProducts'>('companies');

  return (
    <Flex h="100vh">
      <Sidebar onNavigate={setCurrentView} currentView={currentView} />
      <Box flex={1} overflow="auto">
        {currentView === 'companies' && <CompaniesView />}
        {currentView === 'questions' && <QuestionsView />}
        {currentView === 'supplierProducts' && <SupplierProductsView />}
        {currentView === 'customerProducts' && <CustomersProductsView />}
      </Box>
    </Flex>
  );
}

export default App;