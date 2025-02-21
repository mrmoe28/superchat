import { createClient } from '@supabase/supabase-js'

// Types for project data
export interface ProjectData {
  id?: string;
  name: string;
  content: any;
  version: number;
  isPublic: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  userId?: string;
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export const projectService = {
  // Save project locally
  saveLocal: (project: ProjectData): void => {
    localStorage.setItem(`project_${project.id}`, JSON.stringify(project));
  },

  // Load project from local storage
  loadLocal: (projectId: string): ProjectData | null => {
    const data = localStorage.getItem(`project_${projectId}`);
    return data ? JSON.parse(data) : null;
  },

  // Save project to cloud (Supabase)
  saveToCloud: async (project: ProjectData): Promise<{ data: any; error: any }> => {
    const { data, error } = await supabase
      .from('projects')
      .upsert({
        ...project,
        updated_at: new Date().toISOString(),
      });

    return { data, error };
  },

  // Generate sharing link
  generateShareLink: (projectId: string, isPublic: boolean): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/preview/${projectId}${isPublic ? '?access=public' : ''}`;
  },

  // Export project as file
  exportProject: (project: ProjectData, format: 'html' | 'json'): string => {
    if (format === 'json') {
      return JSON.stringify(project, null, 2);
    }
    // Add HTML export implementation here
    return '';
  },

  // Version control methods
  saveVersion: async (project: ProjectData): Promise<{ data: any; error: any }> => {
    const { data, error } = await supabase
      .from('project_versions')
      .insert({
        project_id: project.id,
        content: project.content,
        version: project.version,
        created_at: new Date().toISOString(),
      });

    return { data, error };
  },

  getVersions: async (projectId: string): Promise<{ data: any; error: any }> => {
    const { data, error } = await supabase
      .from('project_versions')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  revertToVersion: async (projectId: string, version: number): Promise<{ data: any; error: any }> => {
    const { data: versionData, error: versionError } = await supabase
      .from('project_versions')
      .select('content')
      .eq('project_id', projectId)
      .eq('version', version)
      .single();

    if (versionError || !versionData) {
      return { data: null, error: versionError };
    }

    return await projectService.saveToCloud({
      id: projectId,
      content: versionData.content,
      version: version + 1,
      name: '', // This should be filled with actual project name
      isPublic: false,
    });
  },
}; 