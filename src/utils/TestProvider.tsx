import { ReactNode, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { runSupplierWorkflowTest } from './testExample';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface TestProviderProps {
  children: ReactNode;
}

export function TestProvider({ children }: TestProviderProps) {
  const { currentUser, userData } = useAuth();

  useEffect(() => {
    // Expose test function to window object
    (window as any).runTest = async () => {
      if (!currentUser || !userData) {
        console.error('Error: You must be logged in to run tests');
        console.log('\nPlease:');
        console.log('1. Sign in to your account');
        console.log('2. Refresh the page');
        console.log('3. Try running runTest() again\n');
        return;
      }

      try {
        console.log('Starting test with:');
        console.log('- User:', userData.email);
        console.log('- Company ID:', userData.companyId);
        console.log('\nRunning test...\n');
        
        const result = await runSupplierWorkflowTest(userData.companyId);
        
        console.log('\n✅ Test completed successfully!\n');
        console.log('Created Test Supplier:');
        console.log('----------------------');
        console.log('Name:', result.name);
        console.log('Email:', result.email);
        console.log('Invite Code:', result.inviteCode);
        console.log('Company ID:', result.supplierCompanyId);
        
        console.log('\nNext Steps:');
        console.log('1. Check your email for the invitation');
        console.log('2. Use the invite code to sign up as the supplier');
        console.log('3. Fill out the questionnaire');
        console.log('\nOr run another test with runTest()\n');
        
        return result;
      } catch (error) {
        console.error('\n❌ Test failed:', error);
        console.log('\nTroubleshooting steps:');
        console.log('1. Make sure you have the correct permissions');
        console.log('2. Check that your company ID is valid');
        console.log('3. Try refreshing the page and running the test again');
        throw error;
      }
    };

    // Log instructions when the app loads
    if (currentUser && userData) {
      console.log('\n🧪 Test Framework Ready!');
      console.log('To run supplier workflow tests:');
      console.log('1. Type runTest() in the console');
      console.log('2. Press Enter');
      console.log('3. Watch the test results appear');
      console.log('\nThe test will create a new supplier and simulate the entire workflow.\n');
    }
  }, [currentUser, userData]);

  return <>{children}</>;
}
