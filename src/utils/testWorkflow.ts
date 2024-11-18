import { inviteSupplier } from '../services/supplierInvitations';
import { saveSupplierAnswers, updateSupplierStatus } from '../services/suppliers';
import type { SupplierInvite } from '../types/supplier';

const generateTestEmail = (base: string = 'test'): string => {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000);
  return `${base}+${timestamp}${random}@stacksdata.com`;
};

const generateTestName = (prefix: string = 'Test Supplier'): string => {
  const random = Math.floor(Math.random() * 1000);
  return `${prefix} ${random}`;
};

export const createTestSupplier = async (companyId: string, tags: string[] = []): Promise<{
  email: string;
  name: string;
  inviteCode: string;
  supplierCompanyId: string;
}> => {
  const email = generateTestEmail();
  const name = generateTestName();
  const contactName = `Contact ${name}`;

  const invite: SupplierInvite = {
    name,
    contactName,
    primaryContact: email,
    notes: 'Test supplier created for workflow testing',
    tags
  };

  try {
    const result = await inviteSupplier(invite, companyId);
    return {
      email,
      name,
      inviteCode: result.inviteCode,
      supplierCompanyId: result.supplierCompanyId
    };
  } catch (error) {
    console.error('Error creating test supplier:', error);
    throw error;
  }
};

export const simulateFormSubmission = async (
  supplierId: string,
  questions: { id: string; required: boolean }[]
): Promise<void> => {
  // Generate test answers for all questions
  const answers: Record<string, string> = {};
  questions.forEach(question => {
    if (question.required) {
      answers[question.id] = `Test answer for question ${question.id}`;
    }
  });

  try {
    // Save answers and update status
    await saveSupplierAnswers(supplierId, answers);
    await updateSupplierStatus(supplierId, 'submitted');
  } catch (error) {
    console.error('Error simulating form submission:', error);
    throw error;
  }
};

// Example usage:
/*
// Create a test supplier
const { email, name, inviteCode, supplierCompanyId } = await createTestSupplier('yourCompanyId', ['tag1', 'tag2']);
console.log(`Created test supplier: ${name} (${email})`);
console.log(`Invite code: ${inviteCode}`);
console.log(`Supplier company ID: ${supplierCompanyId}`);

// Simulate form submission
const questions = [
  { id: 'q1', required: true },
  { id: 'q2', required: false }
];
await simulateFormSubmission(supplierCompanyId, questions);
console.log('Simulated form submission completed');
*/
