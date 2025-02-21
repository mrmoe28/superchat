import React, { useState } from 'react';
import { apiIntegrationService, APIConfig, APIResponse } from '../lib/services/apiIntegrationService';

interface APIIntegrationProps {
  onIntegrationComplete?: (config: APIConfig) => void;
}

export const APIIntegration: React.FC<APIIntegrationProps> = ({ onIntegrationComplete }) => {
  const [apiConfig, setApiConfig] = useState<APIConfig>({
    name: '',
    type: 'rest',
    endpoints: [{ url: '', method: 'GET' }],
  });
  const [specUrl, setSpecUrl] = useState('');
  const [testResult, setTestResult] = useState<APIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'spec'>('manual');

  const handleInputChange = (field: keyof APIConfig, value: any) => {
    setApiConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleEndpointChange = (index: number, field: string, value: string) => {
    setApiConfig(prev => ({
      ...prev,
      endpoints: prev.endpoints?.map((endpoint, i) =>
        i === index ? { ...endpoint, [field]: value } : endpoint
      ),
    }));
  };

  const handleAuthChange = (field: string, value: string) => {
    setApiConfig(prev => ({
      ...prev,
      authentication: {
        ...prev.authentication,
        type: prev.authentication?.type || 'apiKey',
        credentials: {
          ...prev.authentication?.credentials,
          [field]: value,
        },
      },
    }));
  };

  const handleParseSpec = async () => {
    setIsLoading(true);
    try {
      const result = await apiIntegrationService.parseAPISpec(specUrl);
      if (result.success && result.data) {
        setApiConfig(prev => ({
          ...prev,
          name: result.data.info?.title || prev.name,
          endpoints: result.data.paths
            ? Object.entries(result.data.paths).map(([path, methods]: [string, any]) => ({
                url: path,
                method: Object.keys(methods)[0].toUpperCase(),
              }))
            : prev.endpoints,
        }));
      }
    } catch (error) {
      console.error('Error parsing API spec:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      const result = await apiIntegrationService.testConnection(apiConfig);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to test connection',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    onIntegrationComplete?.(apiConfig);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">API Integration</h2>

      {/* Tab Navigation */}
      <div className="flex mb-6 border-b">
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 -mb-px ${
            activeTab === 'manual'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Manual Configuration
        </button>
        <button
          onClick={() => setActiveTab('spec')}
          className={`px-4 py-2 -mb-px ${
            activeTab === 'spec'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          OpenAPI Specification
        </button>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="api-name" className="block text-sm font-medium text-gray-700 mb-1">
              API Name
            </label>
            <input
              id="api-name"
              type="text"
              value={apiConfig.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter API name"
            />
          </div>
          <div>
            <label htmlFor="api-type" className="block text-sm font-medium text-gray-700 mb-1">
              API Type
            </label>
            <select
              id="api-type"
              value={apiConfig.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="rest">REST</option>
              <option value="graphql">GraphQL</option>
            </select>
          </div>
        </div>

        {activeTab === 'spec' && (
          <div>
            <label htmlFor="spec-url" className="block text-sm font-medium text-gray-700 mb-1">
              OpenAPI Specification URL
            </label>
            <div className="flex gap-2">
              <input
                id="spec-url"
                type="text"
                value={specUrl}
                onChange={(e) => setSpecUrl(e.target.value)}
                className="flex-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter OpenAPI/Swagger specification URL"
              />
              <button
                onClick={handleParseSpec}
                disabled={isLoading || !specUrl}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoading ? 'Parsing...' : 'Parse'}
              </button>
            </div>
          </div>
        )}

        {/* Endpoints */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Endpoints</h3>
          {apiConfig.endpoints?.map((endpoint, index) => (
            <div key={index} className="flex gap-4 mb-4">
              <div className="flex-1">
                <label
                  htmlFor={`endpoint-url-${index}`}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  URL
                </label>
                <input
                  id={`endpoint-url-${index}`}
                  type="text"
                  value={endpoint.url}
                  onChange={(e) => handleEndpointChange(index, 'url', e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter endpoint URL"
                />
              </div>
              <div className="w-32">
                <label
                  htmlFor={`endpoint-method-${index}`}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Method
                </label>
                <select
                  id={`endpoint-method-${index}`}
                  value={endpoint.method}
                  onChange={(e) => handleEndpointChange(index, 'method', e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
            </div>
          ))}
          <button
            onClick={() =>
              handleInputChange('endpoints', [...(apiConfig.endpoints || []), { url: '', method: 'GET' }])
            }
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Add Endpoint
          </button>
        </div>

        {/* Authentication */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Authentication</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="auth-type" className="block text-sm font-medium text-gray-700 mb-1">
                Authentication Type
              </label>
              <select
                id="auth-type"
                value={apiConfig.authentication?.type || 'apiKey'}
                onChange={(e) =>
                  handleInputChange('authentication', {
                    type: e.target.value,
                    credentials: {},
                  })
                }
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="apiKey">API Key</option>
                <option value="oauth2">OAuth 2.0</option>
                <option value="basic">Basic Auth</option>
              </select>
            </div>

            {apiConfig.authentication?.type === 'apiKey' && (
              <div>
                <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <input
                  id="api-key"
                  type="password"
                  value={apiConfig.authentication?.credentials?.apiKey || ''}
                  onChange={(e) => handleAuthChange('apiKey', e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter API key"
                />
              </div>
            )}

            {apiConfig.authentication?.type === 'basic' && (
              <>
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={apiConfig.authentication?.credentials?.username || ''}
                    onChange={(e) => handleAuthChange('username', e.target.value)}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={apiConfig.authentication?.credentials?.password || ''}
                    onChange={(e) => handleAuthChange('password', e.target.value)}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter password"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Test Connection */}
        <div>
          <button
            onClick={handleTestConnection}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 mr-4"
          >
            {isLoading ? 'Testing...' : 'Test Connection'}
          </button>

          {testResult && (
            <div
              className={`mt-4 p-4 rounded-md ${
                testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {testResult.success ? 'Connection successful!' : `Connection failed: ${testResult.error}`}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Save Integration
          </button>
        </div>
      </div>
    </div>
  );
}; 