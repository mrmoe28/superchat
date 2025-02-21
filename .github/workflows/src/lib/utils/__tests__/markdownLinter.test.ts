import { markdownLinter } from '../markdownLinter';

describe('markdownLinter', () => {
  describe('validateOrderedLists', () => {
    it('should validate one style correctly', () => {
      const content = `1. First item
1. Second item
1. Third item`;
      
      const result = markdownLinter.validateOrderedLists(content, { listStyle: 'one' });
      expect(result.isValid).toBe(true);
    });

    it('should validate ordered style correctly', () => {
      const content = `1. First item
2. Second item
3. Third item`;
      
      const result = markdownLinter.validateOrderedLists(content, { listStyle: 'ordered' });
      expect(result.isValid).toBe(true);
    });

    it('should validate zero style correctly', () => {
      const content = `0. First item
0. Second item
0. Third item`;
      
      const result = markdownLinter.validateOrderedLists(content, { listStyle: 'zero' });
      expect(result.isValid).toBe(true);
    });

    it('should validate one_or_ordered style correctly', () => {
      const content = `1. First item
1. Second item
2. Third item`;
      
      const result = markdownLinter.validateOrderedLists(content, { listStyle: 'one_or_ordered' });
      expect(result.isValid).toBe(true);
    });

    it('should detect invalid list numbering', () => {
      const content = `1. First item
3. Second item
4. Third item`;
      
      const result = markdownLinter.validateOrderedLists(content, { listStyle: 'ordered' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Line 2: Expected list item to be \'2.\'');
    });

    it('should handle nested lists correctly', () => {
      const content = `1. First item
   1. Nested item
   2. Nested item
2. Second item`;
      
      const result = markdownLinter.validateOrderedLists(content, { listStyle: 'ordered' });
      expect(result.isValid).toBe(true);
    });

    it('should handle code blocks within lists', () => {
      const content = `1. First item
   \`\`\`
   code block
   \`\`\`
2. Second item`;
      
      const result = markdownLinter.validateOrderedLists(content, { listStyle: 'ordered' });
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateCodeBlockIndentation', () => {
    it('should validate correct code block indentation in lists', () => {
      const content = `1. First item
   \`\`\`
   code block
   more code
   \`\`\`
2. Second item`;
      
      const result = markdownLinter.validateCodeBlockIndentation(content);
      expect(result.isValid).toBe(true);
    });

    it('should detect incorrect code block indentation', () => {
      const content = `1. First item
\`\`\`
code block
\`\`\`
2. Second item`;
      
      const result = markdownLinter.validateCodeBlockIndentation(content);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Code block should be indented');
    });

    it('should handle multiple levels of nesting', () => {
      const content = `1. First item
   1. Nested item
      \`\`\`
      nested code block
      \`\`\`
   2. Another nested item
2. Second item`;
      
      const result = markdownLinter.validateCodeBlockIndentation(content);
      expect(result.isValid).toBe(true);
    });
  });

  describe('fixListFormatting', () => {
    it('should fix incorrect list numbering', () => {
      const content = `1. First item
3. Second item
4. Third item`;
      
      const fixed = markdownLinter.fixListFormatting(content, { listStyle: 'ordered' });
      expect(fixed).toBe(`1. First item
2. Second item
3. Third item`);
    });

    it('should fix mixed list styles', () => {
      const content = `1. First item
2. Second item
1. Third item`;
      
      const fixed = markdownLinter.fixListFormatting(content, { listStyle: 'one' });
      expect(fixed).toBe(`1. First item
1. Second item
1. Third item`);
    });

    it('should preserve indentation while fixing', () => {
      const content = `1. First item
   3. Nested item
   4. Nested item
2. Second item`;
      
      const fixed = markdownLinter.fixListFormatting(content, { listStyle: 'ordered' });
      expect(fixed).toBe(`1. First item
   1. Nested item
   2. Nested item
2. Second item`);
    });
  });
}); 