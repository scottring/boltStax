import { Flex, Box } from '@chakra-ui/react';
import { Sidebar, ViewType } from './components/Sidebar';
import { SuppliersView } from './components/SuppliersView';
import { QuestionsView } from './components/questions/QuestionsView';
import { SupplierProductsView } from './components/products/SupplierProductsView';
import { CustomersProductsView } from './components/customers/CustomersProductsView';
import { QuestionnaireTemplatesView } from './components/questionnaires/QuestionnaireTemplatesView';
import { QuestionnaireResponseView } from './components/questionnaires/QuestionnaireResponseView';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/auth/Login';
import { Signup } from './components/auth/Signup';

interface ViewParams {
  productSheetId?: string;
  supplierId?: string;
}

function useUrlParams() {
  const searchParams = new URLSearchParams(window.location.search);
  return {
    inviteToken: searchParams.get('invite'),
    productSheetId: searchParams.get('sheet'),
    supplierId: searchParams.get('supplier'),
    view: searchParams.get('view') as ViewType | null
  };
}

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewType>('mySuppliers');
  const [viewParams, setViewParams] = useState<ViewParams>({});
  const [showSignup, setShowSignup] = useState(false);
  const { currentUser, userData } = useAuth();
  const urlParams = useUrlParams();

  useEffect(() => {
    // Handle deep linking
    if (urlParams.view && currentUser && userData) {
      setCurrentView(urlParams.view);
      if (urlParams.productSheetId || urlParams.supplierId) {
        setViewParams({
          productSheetId: urlParams.productSheetId || undefined,
          supplierId: urlParams.supplierId || undefined
        });
      }
    }
  }, [currentUser, userData, urlParams]);

  const handleNavigate = (view: ViewType, params: ViewParams = {}) => {
    setCurrentView(view);
    setViewParams(params);
    
    // Update URL without reloading the page
    const searchParams = new URLSearchParams();
    searchParams.set('view', view);
    if (params.productSheetId) {
      searchParams.set('sheet', params.productSheetId);
    }
    if (params.supplierId) {
      searchParams.set('supplier', params.supplierId);
    }
    window.history.pushState({}, '', `?${searchParams.toString()}`);
  };

  // If not authenticated, show login/signup
  if (!currentUser || !userData) {
    if (showSignup || urlParams.inviteToken) {
      return (
        <Signup 
          inviteToken={urlParams.inviteToken || undefined}
          onSignupComplete={() => setShowSignup(false)}
          onSwitchToLogin={() => setShowSignup(false)}
        />
      );
    }
    return <Login onSwitchToSignup={() => setShowSignup(true)} />;
  }

  return (
    <Flex h="100vh">
      <Sidebar 
        onNavigate={handleNavigate} 
        currentView={currentView}
        hasSuppliers={true} // TODO: Get this from actual data
      />
      <Box flex={1} overflow="auto" p="6">
        {currentView === 'mySuppliers' && <SuppliersView />}
        {currentView === 'questions' && <QuestionsView />}
        {currentView === 'supplierProducts' && (
          <SupplierProductsView 
            onNavigateToResponse={(productSheetId, supplierId) => {
              handleNavigate('questionnaireResponse', { productSheetId, supplierId });
            }}
          />
        )}
        {currentView === 'customerProducts' && <CustomersProductsView />}
        {currentView === 'templates' && <QuestionnaireTemplatesView />}
        {currentView === 'questionnaireResponse' && viewParams.productSheetId && viewParams.supplierId && (
          <QuestionnaireResponseView
            productSheetId={viewParams.productSheetId}
            supplierId={viewParams.supplierId}
            userId={userData.id}
          />
        )}
      </Box>
    </Flex>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
