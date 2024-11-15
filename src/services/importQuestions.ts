import * as XLSX from 'xlsx';
import type { Question, QuestionTag, QuestionSection } from '../types/question';
import type { FileUnderstanding } from '../components/questions/AIImportChat';

interface ExcelRow {
  [key: string]: string | boolean | undefined;
}

class ImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImportError';
  }
}

function findColumn(row: ExcelRow, columnName: string): string | undefined {
  // Try exact match first
  if (columnName in row) {
    return columnName;
  }

  // Try case-insensitive match
  const lowerColumnName = columnName.toLowerCase();
  return Object.keys(row).find(key => key.toLowerCase() === lowerColumnName);
}

function determineQuestionType(
  row: ExcelRow,
  mappings: FileUnderstanding['columnMappings']
): Question['type'] {
  if (!mappings.type) return 'text';

  const typeColumn = findColumn(row, mappings.type);
  if (!typeColumn || !row[typeColumn]) return 'text';

  const type = String(row[typeColumn]).toLowerCase();
  
  if (type.includes('yes') || type.includes('no') || type === 'yn') {
    return 'yesNo';
  }
  if (type.includes('multi') || type.includes('choice')) {
    return 'multipleChoice';
  }
  if (type.includes('scale')) {
    return 'scale';
  }
  
  return 'text';
}

function determineRequired(
  row: ExcelRow,
  mappings: FileUnderstanding['columnMappings']
): boolean {
  if (!mappings.required) return true;

  const requiredColumn = findColumn(row, mappings.required);
  if (!requiredColumn || !row[requiredColumn]) return true;

  const value = String(row[requiredColumn]).toLowerCase();
  return !['no', 'false', '0', 'n'].includes(value);
}

function getOptions(
  row: ExcelRow,
  mappings: FileUnderstanding['columnMappings']
): string[] {
  if (!mappings.options) return [];

  const optionsColumn = findColumn(row, mappings.options);
  if (!optionsColumn || !row[optionsColumn]) return [];

  return String(row[optionsColumn])
    .split(/[,;|]/)
    .map(option => option.trim())
    .filter(Boolean);
}

function determineQuestionTags(
  row: ExcelRow,
  existingTags: QuestionTag[],
  mappings: FileUnderstanding['columnMappings']
): string[] {
  if (!mappings.tags) return [];

  const tagsColumn = findColumn(row, mappings.tags);
  if (!tagsColumn || !row[tagsColumn]) return [];

  return String(row[tagsColumn])
    .split(/[,;|]/)
    .map(tag => tag.trim())
    .filter(Boolean);
}

interface TagProcessResult {
  assignedTags: string[];
  newTags: string[];
}

function processTagsWithSuggestions(
  tagNames: string[],
  existingTags: QuestionTag[]
): TagProcessResult {
  const result: TagProcessResult = {
    assignedTags: [],
    newTags: [],
  };

  tagNames.forEach(tagName => {
    const existingTag = existingTags.find(
      t => t.name.toLowerCase() === tagName.toLowerCase()
    );

    if (existingTag) {
      result.assignedTags.push(existingTag.id);
    } else {
      result.newTags.push(tagName);
    }
  });

  return result;
}

interface SectionInfo {
  sectionId?: string;
  newSection?: string;
}

function determineSection(
  row: ExcelRow,
  sections: QuestionSection[],
  mappings: FileUnderstanding['columnMappings']
): SectionInfo {
  if (!mappings.section) return {};

  const sectionColumn = findColumn(row, mappings.section);
  if (!sectionColumn || !row[sectionColumn]) return {};

  const sectionName = String(row[sectionColumn]).trim();
  if (!sectionName) return {};

  // Try to find existing section
  const matchedSection = sections.find(
    s => s.name.toLowerCase() === sectionName.toLowerCase()
  );

  if (matchedSection) {
    return { sectionId: matchedSection.id };
  }

  // Suggest new section
  return { newSection: sectionName };
}

export const processExcelFile = async (
  file: File,
  tags: QuestionTag[],
  sections: QuestionSection[],
  onProgress: (progress: number) => void,
  understanding?: FileUnderstanding | null
): Promise<Question[]> => {
  if (!file) {
    throw new ImportError('No file provided');
  }

  if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
    throw new ImportError('Invalid file type. Please upload an Excel file (.xlsx, .xls) or CSV file');
  }

  try {
    // Read file
    const buffer = await file.arrayBuffer();
    if (!buffer || buffer.byteLength === 0) {
      throw new ImportError('File is empty');
    }
    
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, { type: 'array' });
    } catch (e) {
      throw new ImportError('Unable to read file. Please ensure it is a valid Excel or CSV file');
    }
    
    if (!workbook.SheetNames.length) {
      throw new ImportError('Excel file contains no sheets');
    }

    // Use first sheet or follow special instructions
    const sheetToUse = understanding?.specialInstructions?.includes('Use first sheet only')
      ? workbook.SheetNames[0]
      : workbook.SheetNames[0];

    const worksheet = workbook.Sheets[sheetToUse];
    if (!worksheet) {
      throw new ImportError('Selected sheet is empty');
    }

    let jsonData: ExcelRow[];
    try {
      jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);
    } catch (e) {
      throw new ImportError('Unable to parse sheet data. Please check the file format');
    }

    if (!jsonData.length) {
      throw new ImportError('No data found in the file');
    }

    // Use column mappings from AI understanding or default mappings
    const columnMappings = understanding?.columnMappings || {
      question: 'Question',
      type: 'Type',
      required: 'Required',
      options: 'Options',
      tags: 'Tags',
      section: 'Section',
    };

    // Validate required columns
    const firstRow = jsonData[0];
    const questionColumn = findColumn(firstRow, columnMappings.question);
    if (!questionColumn) {
      throw new ImportError(`Required column "${columnMappings.question}" not found in the file`);
    }

    // Process questions
    const questions: Question[] = [];
    const errors: string[] = [];
    const suggestedTags = new Set<string>();
    const suggestedSections = new Set<string>();

    let currentOrder = 0;
    let currentSectionId: string | undefined;

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const questionText = String(row[questionColumn] || '');
      
      if (!questionText.trim()) {
        errors.push(`Row ${i + 1}: Empty question text`);
        continue;
      }

      try {
        // Process tags first to collect suggestions
        const questionTags = determineQuestionTags(row, tags, columnMappings);
        const { assignedTags, newTags } = processTagsWithSuggestions(questionTags, tags);
        newTags.forEach(tag => suggestedTags.add(tag));

        // Process section
        const sectionInfo = determineSection(row, sections, columnMappings);
        if (sectionInfo.newSection) {
          suggestedSections.add(sectionInfo.newSection);
        }
        if (sectionInfo.sectionId) {
          currentSectionId = sectionInfo.sectionId;
        }

        const question: Question = {
          id: `${Date.now()}-${i}`,
          text: questionText.trim(),
          type: determineQuestionType(row, columnMappings),
          tags: assignedTags,
          required: determineRequired(row, columnMappings),
          sectionId: currentSectionId,
          order: currentOrder++,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const options = getOptions(row, columnMappings);
        if (options.length > 0) {
          question.options = options;
        } else if (question.type === 'multipleChoice') {
          errors.push(`Row ${i + 1}: Multiple choice question requires options`);
          continue;
        }

        questions.push(question);
      } catch (e) {
        errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : 'Invalid question data'}`);
      }

      onProgress(((i + 1) / jsonData.length) * 100);
    }

    // Add warnings for suggestions
    if (suggestedTags.size > 0) {
      const tagList = Array.from(suggestedTags).join(', ');
      errors.push(`Note: Found potential new tags: ${tagList}. Consider creating these tags first.`);
    }

    if (suggestedSections.size > 0) {
      const sectionList = Array.from(suggestedSections).join(', ');
      errors.push(`Note: Found potential new sections: ${sectionList}. Consider creating these sections first.`);
    }

    if (errors.length > 0) {
      throw new ImportError(`Found ${errors.length} issues:\n${errors.join('\n')}`);
    }

    if (questions.length === 0) {
      throw new ImportError('No valid questions found in the file');
    }

    return questions;
  } catch (error) {
    if (error instanceof ImportError) {
      throw error;
    }
    throw new ImportError(
      error instanceof Error 
        ? `Error processing file: ${error.message}`
        : 'Unknown error occurred while processing file'
    );
  }
};