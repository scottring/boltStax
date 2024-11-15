import * as XLSX from 'xlsx';

export const generateTemplateFile = (): Blob => {
  // Create sample data
  const data = [
    {
      Question: 'Do you have a quality management system?',
      Type: 'yesNo',
      Required: 'yes',
      Options: '',
      Tags: 'Quality, Management',
      Section: 'Quality Management'
    },
    {
      Question: 'How many employees work in your quality department?',
      Type: 'multipleChoice',
      Required: 'yes',
      Options: '1-5, 6-10, 11-20, 21+',
      Tags: 'Quality, Staffing',
      Section: 'Quality Management'
    },
    {
      Question: 'Please describe your quality control process',
      Type: 'text',
      Required: 'yes',
      Options: '',
      Tags: 'Quality, Process',
      Section: 'Quality Management'
    }
  ];

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Add column widths
  const colWidths = [
    { wch: 50 }, // Question
    { wch: 15 }, // Type
    { wch: 10 }, // Required
    { wch: 30 }, // Options
    { wch: 30 }, // Tags
    { wch: 20 }  // Section
  ];
  ws['!cols'] = colWidths;

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Template');

  // Generate buffer
  const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  
  // Convert to Blob
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};