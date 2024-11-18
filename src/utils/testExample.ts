import { createTestSupplier, simulateFormSubmission } from './testWorkflow';
import { getQuestionsByTags } from '../services/supplierQuestionnaires';
import { useAuth } from '../contexts/AuthContext';

/**
 * Example script showing how to automate supplier workflow testing
 */
export const runSupplierWorkflowTest = async (companyId: string) => {
  try {
    console.log('Starting supplier workflow test...');

    // 1. Create a test supplier with specific tags
    const tags = ['0UN6IMLSUDM2GNB2L3AS']; // Replace with actual tag IDs from your system
    const { email, name, inviteCode, supplierCompanyId } = await createTestSupplier(companyId, tags);
    
    console.log('Created test supplier:');
    console.log(`- Name: ${name}`);
    console.log(`- Email: ${email}`);
    console.log(`- Invite Code: ${inviteCode}`);
    console.log(`- Supplier Company ID: ${supplierCompanyId}`);

    // 2. Get questions for the tags
    const questions = await getQuestionsByTags(tags);
    console.log(`\nLoaded ${questions.length} questions for the supplier`);

    // 3. Simulate form submission
    const questionData = questions.map(q => ({
      id: q.id,
      required: q.required || false
    }));
    
    await simulateFormSubmission(supplierCompanyId, questionData);
    console.log('\nSimulated form submission completed successfully');

    // 4. Print test completion message
    console.log('\nSupplier workflow test completed successfully!');
    console.log('You can now check the following:');
    console.log('1. Supplier status should be "submitted"');
    console.log('2. Questionnaire responses should be saved');
    console.log('3. Email notifications should have been sent');

    return {
      email,
      name,
      inviteCode,
      supplierCompanyId
    };
  } catch (error) {
    console.error('Error running supplier workflow test:', error);
    throw error;
  }
};

// Make the function available globally for console use
(window as any).runTest = async () => {
  console.log('Running supplier workflow test...');
  
  try {
    // Get the current user's company ID from auth context
    const auth = (window as any).__FIREBASE_AUTH__;
    if (!auth?.currentUser) {
      throw new Error('Please sign in first');
    }

    // Get user data from Firestore
    const userDoc = await (window as any).__FIRESTORE__
      .doc(`users/${auth.currentUser.uid}`)
      .get();

    if (!userDoc.exists) {
      throw new Error('User data not found');
    }

    const companyId = userDoc.data().companyId;
    console.log('Using company ID:', companyId);
    
    const result = await runSupplierWorkflowTest(companyId);
    console.log('\nTest Result:', result);
    return result;
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
};

// Example usage in console:
/*
// Just run this in the browser console:
runTest()
  .then(result => {
    console.log('Test completed!');
    console.log('New supplier email:', result.email);
    console.log('Invite code:', result.inviteCode);
  })
  .catch(console.error);
*/
