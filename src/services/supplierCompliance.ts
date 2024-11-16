import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Supplier, ComplianceRecord } from '../types/supplier';
import type { QuestionnaireSubmission, Question } from '../types/questionnaire';

const SUPPLIERS_COLLECTION = 'suppliers';
const COMPLIANCE_RECORDS_COLLECTION = 'complianceRecords';
const SUBMISSIONS_COLLECTION = 'submissions';
const COMPLIANCE_REPORTS_COLLECTION = 'complianceReports';

interface ComplianceReport {
  id: string;
  supplierId: string;
  generatedAt: Date;
  overallScore: number;
  categoryScores: Record<string, number>;
  findings: Array<{
    category: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    recommendation?: string;
  }>;
  questionnairesAnalyzed: string[];
}

export const addComplianceRecord = async (
  supplierId: string,
  record: Omit<ComplianceRecord, 'date'>
): Promise<void> => {
  try {
    // Add the compliance record
    await addDoc(collection(db, COMPLIANCE_RECORDS_COLLECTION), {
      supplierId,
      ...record,
      date: Timestamp.fromDate(new Date())
    });

    // Update supplier's compliance score
    const supplierRef = doc(db, SUPPLIERS_COLLECTION, supplierId);
    const supplierDoc = await getDoc(supplierRef);
    const supplierData = supplierDoc.data();

    if (!supplierData) {
      throw new Error('Supplier not found');
    }

    const complianceHistory = [...(supplierData.complianceHistory || []), {
      ...record,
      date: Timestamp.fromDate(new Date())
    }];

    // Calculate new compliance score (average of last 3 records)
    const recentRecords = complianceHistory
      .sort((a, b) => b.date.toMillis() - a.date.toMillis())
      .slice(0, 3);
    
    const newScore = Math.round(
      recentRecords.reduce((sum, record) => sum + record.score, 0) / recentRecords.length
    );

    await updateDoc(supplierRef, {
      complianceScore: newScore,
      complianceHistory,
      lastUpdated: Timestamp.fromDate(new Date())
    });
  } catch (error) {
    console.error('Error adding compliance record:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to add compliance record: ${error.message}`);
    }
    throw new Error('Failed to add compliance record');
  }
};

export const generateComplianceReport = async (
  supplierId: string,
  questionnaireIds: string[]
): Promise<ComplianceReport> => {
  try {
    // Get all questionnaire submissions for analysis
    const submissionsQuery = query(
      collection(db, SUBMISSIONS_COLLECTION),
      where('supplierId', '==', supplierId),
      where('questionnaireId', 'in', questionnaireIds),
      where('status', '==', 'approved')
    );
    
    const submissions = await getDocs(submissionsQuery);
    
    // Calculate scores by category
    const categoryScores: Record<string, { total: number; count: number }> = {};
    const findings: ComplianceReport['findings'] = [];

    submissions.forEach(doc => {
      const submission = doc.data() as QuestionnaireSubmission;
      Object.entries(submission.answers).forEach(([questionId, answer]) => {
        const question = (submission as any).questions?.find((q: Question) => q.id === questionId);
        if (!question) return;

        question.tags.forEach((tag: string) => {
          if (!categoryScores[tag]) {
            categoryScores[tag] = { total: 0, count: 0 };
          }

          // Add to category score
          if (answer.flagged) {
            categoryScores[tag].total += 50; // Partial compliance
            findings.push({
              category: tag,
              description: `Question "${question.text}" was flagged: ${answer.comments || ''}`,
              severity: 'medium',
              recommendation: 'Review and update response based on previous feedback'
            });
          } else {
            categoryScores[tag].total += 100; // Full compliance
          }
          categoryScores[tag].count++;
        });
      });
    });

    // Calculate final scores
    const finalCategoryScores: Record<string, number> = {};
    let totalScore = 0;
    let categoryCount = 0;

    Object.entries(categoryScores).forEach(([category, { total, count }]) => {
      const categoryScore = Math.round(total / count);
      finalCategoryScores[category] = categoryScore;
      totalScore += categoryScore;
      categoryCount++;
    });

    const overallScore = Math.round(totalScore / (categoryCount || 1)); // Avoid division by zero

    // Create the report
    const reportData = {
      supplierId,
      generatedAt: new Date(),
      overallScore,
      categoryScores: finalCategoryScores,
      findings,
      questionnairesAnalyzed: questionnaireIds
    };

    const reportDoc = await addDoc(collection(db, COMPLIANCE_REPORTS_COLLECTION), {
      ...reportData,
      generatedAt: Timestamp.fromDate(reportData.generatedAt)
    });

    return {
      id: reportDoc.id,
      ...reportData
    };
  } catch (error) {
    console.error('Error generating compliance report:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate compliance report: ${error.message}`);
    }
    throw new Error('Failed to generate compliance report');
  }
};

export const getSupplierComplianceHistory = async (
  supplierId: string,
  startDate?: Date,
  endDate?: Date
): Promise<ComplianceRecord[]> => {
  try {
    const supplierDoc = await getDoc(doc(db, SUPPLIERS_COLLECTION, supplierId));
    if (!supplierDoc.exists()) {
      throw new Error('Supplier not found');
    }

    let complianceHistory = supplierDoc.data()?.complianceHistory || [];

    // Convert Firestore Timestamps to Dates
    complianceHistory = complianceHistory.map((record: any) => ({
      ...record,
      date: record.date.toDate()
    }));

    // Filter by date range if provided
    if (startDate || endDate) {
      complianceHistory = complianceHistory.filter((record: ComplianceRecord) => {
        if (startDate && record.date < startDate) return false;
        if (endDate && record.date > endDate) return false;
        return true;
      });
    }

    return complianceHistory.sort((a: ComplianceRecord, b: ComplianceRecord) => 
      b.date.getTime() - a.date.getTime()
    );
  } catch (error) {
    console.error('Error fetching compliance history:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch compliance history: ${error.message}`);
    }
    throw new Error('Failed to fetch compliance history');
  }
};
