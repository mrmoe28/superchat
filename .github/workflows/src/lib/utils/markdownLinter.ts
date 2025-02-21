interface ListStyle {
  type: 'one' | 'one_or_ordered' | 'ordered' | 'zero';
}

interface LintOptions {
  listStyle: ListStyle['type'];
}

interface LintResult {
  isValid: boolean;
  errors: string[];
  fixedContent?: string;
}

export const markdownLinter = {
  validateOrderedLists: (content: string, options: LintOptions = { listStyle: 'one_or_ordered' }): LintResult => {
    const lines = content.split('\n');
    const errors: string[] = [];
    let fixedContent = '';
    let currentListNumber = 1;
    let inList = false;
    let previousIndentation = '';

    const isListItem = (line: string): boolean => {
      return /^\s*\d+\.\s/.test(line);
    };

    const getListNumber = (line: string): number => {
      const match = line.match(/^\s*(\d+)\./);
      return match ? parseInt(match[1], 10) : 0;
    };

    const getIndentation = (line: string): string => {
      const match = line.match(/^(\s*)/);
      return match ? match[1] : '';
    };

    const formatListItem = (line: string, number: number): string => {
      const indentation = getIndentation(line);
      const content = line.replace(/^\s*\d+\.\s*/, '');
      return `${indentation}${number}. ${content}`;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const currentIndentation = getIndentation(line);

      if (isListItem(line)) {
        const number = getListNumber(line);

        // Start of a new list or continuation with different indentation
        if (!inList || currentIndentation !== previousIndentation) {
          currentListNumber = 1;
          inList = true;
        }

        switch (options.listStyle) {
          case 'one':
            if (number !== 1) {
              errors.push(`Line ${i + 1}: Expected list item to start with '1.'`);
              fixedContent += formatListItem(line, 1) + '\n';
            } else {
              fixedContent += line + '\n';
            }
            break;

          case 'ordered':
            if (number !== currentListNumber) {
              errors.push(`Line ${i + 1}: Expected list item to be '${currentListNumber}.'`);
              fixedContent += formatListItem(line, currentListNumber) + '\n';
            } else {
              fixedContent += line + '\n';
            }
            currentListNumber++;
            break;

          case 'zero':
            if (number !== 0) {
              errors.push(`Line ${i + 1}: Expected list item to start with '0.'`);
              fixedContent += formatListItem(line, 0) + '\n';
            } else {
              fixedContent += line + '\n';
            }
            break;

          case 'one_or_ordered':
            if (i > 0 && isListItem(lines[i - 1])) {
              const prevNumber = getListNumber(lines[i - 1]);
              if (number !== prevNumber && number !== prevNumber + 1) {
                errors.push(`Line ${i + 1}: List item should either match previous number or increment by 1`);
                fixedContent += formatListItem(line, prevNumber + 1) + '\n';
              } else {
                fixedContent += line + '\n';
              }
            } else {
              if (number !== 1) {
                errors.push(`Line ${i + 1}: First list item should start with '1.'`);
                fixedContent += formatListItem(line, 1) + '\n';
              } else {
                fixedContent += line + '\n';
              }
            }
            break;
        }

        previousIndentation = currentIndentation;
      } else {
        // Handle code blocks and other non-list content
        const isCodeBlock = line.trim().startsWith('```');
        if (isCodeBlock) {
          inList = false;
        }
        
        // If it's an empty line or doesn't match list pattern, just add it as is
        fixedContent += line + '\n';
        
        // Reset list tracking if we encounter a blank line
        if (!line.trim()) {
          inList = false;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      fixedContent: fixedContent.trim(),
    };
  },

  // Helper function to fix common list formatting issues
  fixListFormatting: (content: string, options: LintOptions = { listStyle: 'one_or_ordered' }): string => {
    const result = markdownLinter.validateOrderedLists(content, options);
    return result.fixedContent || content;
  },

  // Helper function to validate code block indentation within lists
  validateCodeBlockIndentation: (content: string): LintResult => {
    const lines = content.split('\n');
    const errors: string[] = [];
    let fixedContent = '';
    let inList = false;
    let listIndentation = '';
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isListItem = /^\s*\d+\.\s/.test(line);
      const isCodeBlockMarker = line.trim().startsWith('```');

      if (isListItem) {
        inList = true;
        listIndentation = line.match(/^(\s*)/)?.[1] || '';
        fixedContent += line + '\n';
      } else if (isCodeBlockMarker) {
        if (inList && !inCodeBlock) {
          // Starting a code block within a list
          inCodeBlock = true;
          const expectedIndentation = listIndentation + '   ';
          if (!line.startsWith(expectedIndentation)) {
            errors.push(`Line ${i + 1}: Code block should be indented with 3 spaces from list item`);
            fixedContent += expectedIndentation + line.trim() + '\n';
          } else {
            fixedContent += line + '\n';
          }
        } else if (inCodeBlock) {
          // Ending a code block
          inCodeBlock = false;
          fixedContent += line + '\n';
        } else {
          // Code block not in a list
          fixedContent += line + '\n';
        }
      } else if (inCodeBlock && inList) {
        // Content within a code block in a list
        const expectedIndentation = listIndentation + '   ';
        if (!line.startsWith(expectedIndentation) && line.trim()) {
          errors.push(`Line ${i + 1}: Code block content should maintain indentation`);
          fixedContent += expectedIndentation + line.trim() + '\n';
        } else {
          fixedContent += line + '\n';
        }
      } else {
        // Regular content
        fixedContent += line + '\n';
        if (!line.trim()) {
          inList = false;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      fixedContent: fixedContent.trim(),
    };
  },
}; 