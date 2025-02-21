import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { knowledgeBase, type KnowledgeEntry } from '@/lib/knowledge';
import { deploymentService } from '@/lib/services/deploymentService';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface IntegrationStatus {
  github: boolean;
  vercel: boolean;
  supabase: boolean;
  firebase: boolean;
}

interface DeploymentInput {
  github: string;
  vercel: string;
  supabase: string;
  firebase: string;
}

export const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('knowledge-base');
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [manualType, setManualType] = useState<'text' | 'markdown'>('text');
  
  // Integration states
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus>({
    github: false,
    vercel: false,
    supabase: false,
    firebase: false
  });

  // Deployment states
  const [deploymentInput, setDeploymentInput] = useState<DeploymentInput>({
    github: '',
    vercel: '',
    supabase: '',
    firebase: ''
  });

  // API keys
  const [apiKeys, setApiKeys] = useState({
    anthropic: typeof window !== 'undefined' ? localStorage.getItem('anthropic_api_key') || '' : '',
    openai: typeof window !== 'undefined' ? localStorage.getItem('openai_api_key') || '' : '',
    github: typeof window !== 'undefined' ? localStorage.getItem('github_token') || '' : ''
  });

  // Handle integration connection
  const handleConnect = async (platform: keyof IntegrationStatus) => {
    setIsLoading(true);
    setError(null);
    try {
      // Here you would typically handle OAuth flow or API key validation
      setIntegrationStatus(prev => ({ ...prev, [platform]: true }));
    } catch (err) {
      setError(`Failed to connect to ${platform}`);
      console.error(`Error connecting to ${platform}:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deployment
  const handleDeploy = async (platform: keyof DeploymentInput) => {
    if (!deploymentInput[platform]) {
      setError(`Please enter a ${platform === 'github' ? 'repository' : 'project'} name`);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const config = {
        platform,
        projectName: deploymentInput[platform],
        repositoryName: platform === 'github' ? deploymentInput[platform] : undefined
      };

      switch (platform) {
        case 'github':
          await deploymentService.deployToGithub(config, []);
          break;
        case 'vercel':
          await deploymentService.deployToVercel(config);
          break;
        case 'supabase':
          await deploymentService.deployToSupabase(config);
          break;
        case 'firebase':
          await deploymentService.deployToFirebase(config);
          break;
      }
      
      setDeploymentInput(prev => ({ ...prev, [platform]: '' }));
    } catch (err) {
      setError(`Failed to deploy to ${platform}`);
      console.error(`Error deploying to ${platform}:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deployment input change
  const handleDeploymentInputChange = (platform: keyof DeploymentInput, value: string) => {
    setDeploymentInput(prev => ({ ...prev, [platform]: value }));
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const loadedEntries = await knowledgeBase.getEntries();
    setEntries(loadedEntries);
  };

  const handleFileUpload = async (files: FileList) => {
    setIsLoading(true);
    setError(null);
    try {
      await knowledgeBase.importFiles(files);
      await loadEntries();
    } catch (err) {
      setError('Failed to import files');
      console.error('Error importing files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlImport = async () => {
    if (!urlInput.trim()) {
      setError('Please enter a valid URL');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      await knowledgeBase.importFromUrl(urlInput);
      await loadEntries();
      setUrlInput('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import from URL';
      setError(errorMessage);
      console.error('Error importing from URL:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveEntry = async (id: string) => {
    try {
      await knowledgeBase.removeEntry(id);
      await loadEntries();
    } catch (err) {
      setError('Failed to remove entry');
      console.error('Error removing entry:', err);
    }
  };

  const handleManualInput = async () => {
    if (!manualTitle.trim() || !manualContent.trim()) {
      setError('Title and content are required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      await knowledgeBase.addManualEntry(manualTitle, manualContent, manualType);
      await loadEntries();
      setManualTitle('');
      setManualContent('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add manual entry';
      setError(errorMessage);
      console.error('Error adding manual entry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveApiKey = (provider: 'anthropic' | 'openai' | 'github') => {
    const key = apiKeys[provider];
    localStorage.setItem(`${provider === 'github' ? 'github_token' : `${provider}_api_key`}`, key);
    setError(null);
    // Optionally reload the page to apply new API keys
    window.location.reload();
  };

  const tabs = [
    { id: 'knowledge-base', label: 'Knowledge Base' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'api-keys', label: 'API Keys' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'deployment', label: 'Deployment' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          style={{
            position: 'absolute',
            right: '1rem',
            top: '1rem',
            width: '24rem',
            maxHeight: 'calc(100vh - 8rem)',
            backgroundColor: 'rgb(32,33,35)',
            border: '1px solid rgb(55,65,81)',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            overflow: 'auto'
          }}
        >
          <div className="grid grid-cols-5 border-b border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2 py-2 text-xs font-medium ${
                  activeTab === tab.id
                    ? 'text-white bg-[rgb(52,53,65)]'
                    : 'text-gray-400 hover:text-white hover:bg-[rgb(42,43,55)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeTab === 'knowledge-base' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Knowledge Base Management</h3>
                
                {error && (
                  <div className="bg-red-500/10 border border-red-500 rounded-xl p-3">
                    <p className="text-sm text-red-500">{error}</p>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="bg-[rgb(52,53,65)] p-4 rounded-xl">
                    <h4 className="text-sm font-medium text-white mb-2">Import Knowledge</h4>
                    <div className="flex items-center space-x-2">
                      <button
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.md,.mdx,.txt';
                          input.multiple = true;
                          input.onchange = (e) => {
                            const files = (e.target as HTMLInputElement).files;
                            if (files) {
                              handleFileUpload(files);
                            }
                          };
                          input.click();
                        }}
                        disabled={isLoading}
                      >
                        Upload Files
                      </button>
                      <span className="text-sm text-gray-400">
                        Supports .md, .mdx, .txt
                      </span>
                    </div>
                  </div>

                  <div className="bg-[rgb(52,53,65)] p-4 rounded-xl">
                    <h4 className="text-sm font-medium text-white mb-2">Current Knowledge Base</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {entries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between py-2 px-3 bg-[rgb(42,43,55)] rounded-xl"
                        >
                          <span className="text-sm text-white">{entry.title}</span>
                          <button
                            className="text-purple-400 hover:text-purple-300"
                            onClick={() => handleRemoveEntry(entry.id)}
                            disabled={isLoading}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {entries.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-2">
                          No entries in knowledge base
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-[rgb(52,53,65)] p-4 rounded-xl">
                    <h4 className="text-sm font-medium text-white mb-2">Add Knowledge via URL</h4>
                    <div className="space-y-2">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="Enter documentation URL"
                        className="w-full px-3 py-2 bg-[rgb(42,43,55)] text-white rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                      />
                      <button
                        className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                        onClick={handleUrlImport}
                        disabled={isLoading || !urlInput.trim()}
                      >
                        Import from URL
                      </button>
                    </div>
                  </div>

                  <div className="bg-[rgb(52,53,65)] p-4 rounded-xl">
                    <h4 className="text-sm font-medium text-white mb-2">Manual Input</h4>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        placeholder="Enter title"
                        className="w-full px-3 py-2 bg-[rgb(42,43,55)] text-white rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                      />
                      <textarea
                        value={manualContent}
                        onChange={(e) => setManualContent(e.target.value)}
                        placeholder="Enter content (text or markdown)"
                        rows={4}
                        className="w-full px-3 py-2 bg-[rgb(42,43,55)] text-white rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        disabled={isLoading}
                      />
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2 text-sm text-white">
                          <input
                            type="radio"
                            checked={manualType === 'text'}
                            onChange={() => setManualType('text')}
                            className="form-radio text-blue-600"
                          />
                          <span>Text</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm text-white">
                          <input
                            type="radio"
                            checked={manualType === 'markdown'}
                            onChange={() => setManualType('markdown')}
                            className="form-radio text-blue-600"
                          />
                          <span>Markdown</span>
                        </label>
                      </div>
                      <button
                        className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                        onClick={handleManualInput}
                        disabled={isLoading || !manualTitle.trim() || !manualContent.trim()}
                      >
                        Add Entry
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Appearance Settings</h3>
                {/* Add appearance settings here */}
              </div>
            )}

            {activeTab === 'api-keys' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">API Key Management</h3>
                {error && (
                  <div className="bg-red-500/10 border border-red-500 rounded-xl p-3">
                    <p className="text-sm text-red-500">{error}</p>
                  </div>
                )}
                <div className="space-y-4">
                  <div className="bg-[rgb(52,53,65)] p-4 rounded-xl">
                    <h4 className="text-sm font-medium text-white mb-2">OpenAI API Key</h4>
                    <div className="space-y-2">
                      <input
                        type="password"
                        placeholder="Enter OpenAI API key"
                        value={apiKeys.openai}
                        onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                        className="w-full px-3 py-2 bg-[rgb(42,43,55)] text-white rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button 
                        onClick={() => handleSaveApiKey('openai')}
                        className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors"
                      >
                        Save OpenAI Key
                      </button>
                    </div>
                  </div>

                  <div className="bg-[rgb(52,53,65)] p-4 rounded-xl">
                    <h4 className="text-sm font-medium text-white mb-2">Anthropic API Key</h4>
                    <div className="space-y-2">
                      <input
                        type="password"
                        placeholder="Enter Anthropic API key"
                        value={apiKeys.anthropic}
                        onChange={(e) => setApiKeys({ ...apiKeys, anthropic: e.target.value })}
                        className="w-full px-3 py-2 bg-[rgb(42,43,55)] text-white rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button 
                        onClick={() => handleSaveApiKey('anthropic')}
                        className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors"
                      >
                        Save Anthropic Key
                      </button>
                    </div>
                  </div>

                  <div className="bg-[rgb(52,53,65)] p-4 rounded-xl">
                    <h4 className="text-sm font-medium text-white mb-2">GitHub Token</h4>
                    <div className="space-y-2">
                      <input
                        type="password"
                        placeholder="Enter GitHub token"
                        value={apiKeys.github}
                        onChange={(e) => setApiKeys({ ...apiKeys, github: e.target.value })}
                        className="w-full px-3 py-2 bg-[rgb(42,43,55)] text-white rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button 
                        onClick={() => handleSaveApiKey('github')}
                        className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors"
                      >
                        Save GitHub Token
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Integrations</h3>
                {error && (
                  <div className="bg-red-500/10 border border-red-500 rounded-xl p-3">
                    <p className="text-sm text-red-500">{error}</p>
                  </div>
                )}
                <div className="space-y-4">
                  <div className="bg-[rgb(52,53,65)] p-4 rounded-xl">
                    <h4 className="text-sm font-medium text-white mb-2">Available Integrations</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 px-3 bg-[rgb(42,43,55)] rounded-xl">
                        <div className="flex items-center space-x-3">
                          <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.374 0 0 5.374 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.626-5.374-12-12-12z"/>
                          </svg>
                          <div>
                            <h5 className="text-sm font-medium text-white">GitHub</h5>
                            <p className="text-xs text-gray-400">Connect your GitHub account</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleConnect('github')}
                          disabled={isLoading || integrationStatus.github}
                          className={`px-3 py-1 text-sm rounded transition-colors ${
                            integrationStatus.github 
                              ? 'bg-green-600 text-white'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          } disabled:opacity-50`}
                        >
                          {integrationStatus.github ? 'Connected' : 'Connect'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between py-2 px-3 bg-[rgb(42,43,55)] rounded-xl">
                        <div className="flex items-center space-x-3">
                          <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 1.892H4c-1.104 0-2 .896-2 2v16c0 1.104.896 2 2 2h16c1.104 0 2-.896 2-2v-16c0-1.104-.896-2-2-2zm-3.796 14.322c-.03.156-.179.275-.337.275H8.132a.338.338 0 01-.337-.275l-1.248-6.243a.337.337 0 01.337-.399h3.702V12.9c0 .186.151.337.338.337h2.155a.337.337 0 00.337-.337V9.572h3.702c.219 0 .382.208.337.399l-1.249 6.243z"/>
                          </svg>
                          <div>
                            <h5 className="text-sm font-medium text-white">Vercel</h5>
                            <p className="text-xs text-gray-400">Deploy with Vercel</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleConnect('vercel')}
                          disabled={isLoading || integrationStatus.vercel}
                          className={`px-3 py-1 text-sm rounded transition-colors ${
                            integrationStatus.vercel 
                              ? 'bg-green-600 text-white'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          } disabled:opacity-50`}
                        >
                          {integrationStatus.vercel ? 'Connected' : 'Connect'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between py-2 px-3 bg-[rgb(42,43,55)] rounded-xl">
                        <div className="flex items-center space-x-3">
                          <svg className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.355 13.352l-4.672-4.672c-.142-.142-.334-.219-.533-.219H6.851c-.199 0-.391.077-.533.219L1.646 13.352c-.142.142-.219.334-.219.533v6.261c0 .414.336.75.75.75h19.648c.414 0 .75-.336.75-.75v-6.261c0-.199-.077-.391-.219-.533zM3.5 19.146v-4.261l3.672-3.672h9.656l3.672 3.672v4.261H3.5z"/>
                          </svg>
                          <div>
                            <h5 className="text-sm font-medium text-white">Supabase</h5>
                            <p className="text-xs text-gray-400">Connect to Supabase</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleConnect('supabase')}
                          disabled={isLoading || integrationStatus.supabase}
                          className={`px-3 py-1 text-sm rounded transition-colors ${
                            integrationStatus.supabase 
                              ? 'bg-green-600 text-white'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          } disabled:opacity-50`}
                        >
                          {integrationStatus.supabase ? 'Connected' : 'Connect'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between py-2 px-3 bg-[rgb(42,43,55)] rounded-xl">
                        <div className="flex items-center space-x-3">
                          <svg className="w-6 h-6 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M13.5 3.75a.75.75 0 00-1.5 0v16.5a.75.75 0 001.5 0V3.75zM5.25 12a.75.75 0 01.75-.75h12a.75.75 0 010 1.5H6a.75.75 0 01-.75-.75z"/>
                          </svg>
                          <div>
                            <h5 className="text-sm font-medium text-white">Firebase</h5>
                            <p className="text-xs text-gray-400">Connect to Firebase</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleConnect('firebase')}
                          disabled={isLoading || integrationStatus.firebase}
                          className={`px-3 py-1 text-sm rounded transition-colors ${
                            integrationStatus.firebase 
                              ? 'bg-green-600 text-white'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          } disabled:opacity-50`}
                        >
                          {integrationStatus.firebase ? 'Connected' : 'Connect'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'deployment' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Deployment Settings</h3>
                {error && (
                  <div className="bg-red-500/10 border border-red-500 rounded-xl p-3">
                    <p className="text-sm text-red-500">{error}</p>
                  </div>
                )}
                <div className="space-y-4">
                  <div className="bg-[rgb(52,53,65)] p-4 rounded-xl">
                    <h4 className="text-sm font-medium text-white mb-2">Deploy to GitHub</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Repository name"
                        value={deploymentInput.github}
                        onChange={(e) => handleDeploymentInputChange('github', e.target.value)}
                        className="w-full px-3 py-2 bg-[rgb(42,43,55)] text-white rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading || !integrationStatus.github}
                      />
                      <button 
                        onClick={() => handleDeploy('github')}
                        disabled={isLoading || !integrationStatus.github}
                        className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? 'Deploying...' : 'Deploy to GitHub'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-[rgb(52,53,65)] p-4 rounded-xl">
                    <h4 className="text-sm font-medium text-white mb-2">Deploy to Vercel</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Project name"
                        value={deploymentInput.vercel}
                        onChange={(e) => handleDeploymentInputChange('vercel', e.target.value)}
                        className="w-full px-3 py-2 bg-[rgb(42,43,55)] text-white rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading || !integrationStatus.vercel}
                      />
                      <button 
                        onClick={() => handleDeploy('vercel')}
                        disabled={isLoading || !integrationStatus.vercel}
                        className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? 'Deploying...' : 'Deploy to Vercel'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-[rgb(52,53,65)] p-4 rounded-xl">
                    <h4 className="text-sm font-medium text-white mb-2">Deploy to Supabase</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Project name"
                        value={deploymentInput.supabase}
                        onChange={(e) => handleDeploymentInputChange('supabase', e.target.value)}
                        className="w-full px-3 py-2 bg-[rgb(42,43,55)] text-white rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading || !integrationStatus.supabase}
                      />
                      <button 
                        onClick={() => handleDeploy('supabase')}
                        disabled={isLoading || !integrationStatus.supabase}
                        className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? 'Deploying...' : 'Deploy to Supabase'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-[rgb(52,53,65)] p-4 rounded-xl">
                    <h4 className="text-sm font-medium text-white mb-2">Deploy to Firebase</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Project name"
                        value={deploymentInput.firebase}
                        onChange={(e) => handleDeploymentInputChange('firebase', e.target.value)}
                        className="w-full px-3 py-2 bg-[rgb(42,43,55)] text-white rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading || !integrationStatus.firebase}
                      />
                      <button 
                        onClick={() => handleDeploy('firebase')}
                        disabled={isLoading || !integrationStatus.firebase}
                        className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? 'Deploying...' : 'Deploy to Firebase'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 