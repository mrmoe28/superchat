-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    content JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID REFERENCES auth.users(id)
);

-- Create project_versions table for version control
CREATE TABLE IF NOT EXISTS project_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    content JSONB NOT NULL,
    version INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id)
);

-- Create deployments table for deployment configurations
CREATE TABLE IF NOT EXISTS deployments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    configuration JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deployed_at TIMESTAMP WITH TIME ZONE,
    deployed_by UUID REFERENCES auth.users(id)
);

-- Create api_integrations table
CREATE TABLE IF NOT EXISTS api_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    configuration JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id)
);

-- Create RLS policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_integrations ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view their own projects"
    ON projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view public projects"
    ON projects FOR SELECT
    USING (is_public = true);

CREATE POLICY "Users can create their own projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
    ON projects FOR DELETE
    USING (auth.uid() = user_id);

-- Project versions policies
CREATE POLICY "Users can view versions of their projects"
    ON project_versions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_versions.project_id
        AND (projects.user_id = auth.uid() OR projects.is_public = true)
    ));

CREATE POLICY "Users can create versions of their projects"
    ON project_versions FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_versions.project_id
        AND projects.user_id = auth.uid()
    ));

-- Deployments policies
CREATE POLICY "Users can view their project deployments"
    ON deployments FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = deployments.project_id
        AND projects.user_id = auth.uid()
    ));

CREATE POLICY "Users can create deployments for their projects"
    ON deployments FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = deployments.project_id
        AND projects.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their project deployments"
    ON deployments FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = deployments.project_id
        AND projects.user_id = auth.uid()
    ));

-- API integrations policies
CREATE POLICY "Users can view their project integrations"
    ON api_integrations FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = api_integrations.project_id
        AND projects.user_id = auth.uid()
    ));

CREATE POLICY "Users can create integrations for their projects"
    ON api_integrations FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = api_integrations.project_id
        AND projects.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their project integrations"
    ON api_integrations FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = api_integrations.project_id
        AND projects.user_id = auth.uid()
    ));

-- Create indexes for better performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_project_versions_project_id ON project_versions(project_id);
CREATE INDEX idx_deployments_project_id ON deployments(project_id);
CREATE INDEX idx_api_integrations_project_id ON api_integrations(project_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deployments_updated_at
    BEFORE UPDATE ON deployments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_integrations_updated_at
    BEFORE UPDATE ON api_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 