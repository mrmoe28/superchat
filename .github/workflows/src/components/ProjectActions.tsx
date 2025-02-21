import React, { useState } from 'react';
import { projectService } from '../lib/services/projectService';
import { deploymentService, DeploymentConfig } from '../lib/services/deploymentService';

interface ProjectActionsProps {
  projectId: string;
  projectName: string;
  content: any;
  onSave?: () => void;
}

export const ProjectActions: React.FC<ProjectActionsProps> = ({
  projectId,
  projectName,
  content,
  onSave,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentPlatform, setDeploymentPlatform] = useState<DeploymentConfig['platform']>('github');
  const [showDeploymentModal, setShowDeploymentModal] = useState(false);
  const [deploymentConfig, setDeploymentConfig] = useState<Partial<DeploymentConfig>>({
    projectName,
    repositoryName: projectName.toLowerCase().replace(/\s+/g, '-'),
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save locally first
      projectService.saveLocal({
        id: projectId,
        name: projectName,
        content,
        version: 1,
        isPublic: false,
      });

      // Then save to cloud
      await projectService.saveToCloud({
        id: projectId,
        name: projectName,
        content,
        version: 1,
        isPublic: false,
      });

      onSave?.();
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    const shareLink = projectService.generateShareLink(projectId, false);
    navigator.clipboard.writeText(shareLink);
    // You could add a toast notification here
  };

  const handleExport = (format: 'html' | 'json') => {
    const exportedContent = projectService.exportProject(
      {
        id: projectId,
        name: projectName,
        content,
        version: 1,
        isPublic: false,
      },
      format
    );

    // Create and trigger download
    const blob = new Blob([exportedContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}.${format}`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      const config: DeploymentConfig = {
        platform: deploymentPlatform,
        ...deploymentConfig,
      } as DeploymentConfig;

      switch (deploymentPlatform) {
        case 'github':
          await deploymentService.deployToGithub(config, [
            {
              path: 'project.json',
              content: JSON.stringify(content, null, 2),
            },
          ]);
          break;
        case 'vercel':
          await deploymentService.deployToVercel(config);
          break;
        case 'netlify':
          await deploymentService.deployToNetlify(config);
          break;
        case 'supabase':
          await deploymentService.deployToSupabase(config);
          break;
      }
    } catch (error) {
      console.error('Error deploying project:', error);
    } finally {
      setIsDeploying(false);
      setShowDeploymentModal(false);
    }
  };

  return (
    <div className="flex gap-4 p-4">
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save'}
      </button>

      <button
        onClick={handleShare}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Share
      </button>

      <div className="relative">
        <button
          onClick={() => setShowDeploymentModal(true)}
          disabled={isDeploying}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {isDeploying ? 'Deploying...' : 'Deploy'}
        </button>

        {showDeploymentModal && (
          <div className="absolute top-full mt-2 p-4 bg-white rounded shadow-lg border">
            <h3 className="text-lg font-semibold mb-4">Deploy Project</h3>
            
            <div className="mb-4">
              <label htmlFor="platform-select" className="block text-sm font-medium mb-1">Platform</label>
              <select
                id="platform-select"
                value={deploymentPlatform}
                onChange={(e) => setDeploymentPlatform(e.target.value as DeploymentConfig['platform'])}
                className="w-full p-2 border rounded"
                aria-label="Select deployment platform"
              >
                <option value="github">GitHub</option>
                <option value="vercel">Vercel</option>
                <option value="netlify">Netlify</option>
                <option value="supabase">Supabase</option>
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="repo-name" className="block text-sm font-medium mb-1">Repository Name</label>
              <input
                id="repo-name"
                type="text"
                value={deploymentConfig.repositoryName}
                onChange={(e) =>
                  setDeploymentConfig({ ...deploymentConfig, repositoryName: e.target.value })
                }
                className="w-full p-2 border rounded"
                aria-label="Repository name"
                placeholder="Enter repository name"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeploymentModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeploy}
                disabled={isDeploying}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
              >
                {isDeploying ? 'Deploying...' : 'Deploy'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="relative group">
        <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
          Export
        </button>
        <div className="hidden group-hover:block absolute top-full mt-2 bg-white rounded shadow-lg border">
          <button
            onClick={() => handleExport('json')}
            className="block w-full px-4 py-2 text-left hover:bg-gray-100"
          >
            Export as JSON
          </button>
          <button
            onClick={() => handleExport('html')}
            className="block w-full px-4 py-2 text-left hover:bg-gray-100"
          >
            Export as HTML
          </button>
        </div>
      </div>
    </div>
  );
}; 