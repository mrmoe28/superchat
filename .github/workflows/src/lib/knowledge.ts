export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  type: 'markdown' | 'text';
  source?: string;
  createdAt: Date;
  updatedAt: Date;
}

class KnowledgeBaseService {
  private storage: Storage | null;
  private STORAGE_KEY = 'knowledge_base';

  constructor() {
    this.storage = typeof window !== 'undefined' ? window.localStorage : null;
  }

  private async readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  async importFiles(files: FileList): Promise<KnowledgeEntry[]> {
    const entries: KnowledgeEntry[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const content = await this.readFile(file);
      const type = file.name.endsWith('.md') || file.name.endsWith('.mdx') 
        ? 'markdown' 
        : 'text';

      entries.push({
        id: crypto.randomUUID(),
        title: file.name.replace(/\.[^/.]+$/, ""),
        content,
        type,
        source: 'file',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await this.addEntries(entries);
    return entries;
  }

  async importFromUrl(url: string): Promise<KnowledgeEntry> {
    try {
      // Validate URL
      try {
        new URL(url);
      } catch {
        throw new Error('Invalid URL format');
      }

      const response = await fetch(url, {
        headers: {
          'Accept': 'text/plain,text/markdown,text/html,application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || 
          !contentType.includes('text/') && 
          !contentType.includes('application/json') && 
          !contentType.includes('application/x-markdown')) {
        throw new Error('Unsupported content type. Only text and markdown files are supported.');
      }

      const content = await response.text();
      const type = url.endsWith('.md') || url.endsWith('.mdx') || 
                   contentType.includes('markdown')
        ? 'markdown' 
        : 'text';

      const entry: KnowledgeEntry = {
        id: crypto.randomUUID(),
        title: url.split('/').pop()?.replace(/\.[^/.]+$/, "") || 'Untitled',
        content,
        type,
        source: url,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.addEntries([entry]);
      return entry;
    } catch (error) {
      console.error('Error importing from URL:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to import from URL');
    }
  }

  async getEntries(): Promise<KnowledgeEntry[]> {
    if (!this.storage) return [];
    
    try {
      const data = this.storage.getItem(this.STORAGE_KEY);
      if (!data) return [];

      const entries = JSON.parse(data);
      return entries.map((entry: any) => ({
        ...entry,
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt)
      }));
    } catch (error) {
      console.error('Error getting entries:', error);
      return [];
    }
  }

  async addEntries(entries: KnowledgeEntry[]): Promise<void> {
    if (!this.storage) return;

    try {
      const existingEntries = await this.getEntries();
      const updatedEntries = [...existingEntries, ...entries];
      this.storage.setItem(this.STORAGE_KEY, JSON.stringify(updatedEntries));
    } catch (error) {
      console.error('Error adding entries:', error);
      throw error;
    }
  }

  async removeEntry(id: string): Promise<void> {
    if (!this.storage) return;

    try {
      const entries = await this.getEntries();
      const updatedEntries = entries.filter(entry => entry.id !== id);
      this.storage.setItem(this.STORAGE_KEY, JSON.stringify(updatedEntries));
    } catch (error) {
      console.error('Error removing entry:', error);
      throw error;
    }
  }

  async addManualEntry(title: string, content: string, type: 'markdown' | 'text'): Promise<KnowledgeEntry> {
    if (!title.trim() || !content.trim()) {
      throw new Error('Title and content are required');
    }

    const entry: KnowledgeEntry = {
      id: crypto.randomUUID(),
      title: title.trim(),
      content: content.trim(),
      type,
      source: 'manual',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.addEntries([entry]);
    return entry;
  }

  async clearKnowledgeBase(): Promise<void> {
    if (!this.storage) return;
    
    try {
      this.storage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing knowledge base:', error);
      throw error;
    }
  }
}

export const knowledgeBase = new KnowledgeBaseService(); 