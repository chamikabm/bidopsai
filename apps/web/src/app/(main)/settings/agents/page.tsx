'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

// Agent configuration schema
const agentConfigSchema = z.object({
  modelName: z.string().min(1, 'Model name is required'),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(100).max(100000),
  enabled: z.boolean(),
});

type AgentConfig = z.infer<typeof agentConfigSchema>;

interface AgentSettings {
  id: string;
  name: string;
  description: string;
  config: AgentConfig;
}

export default function AgentConfigurationPage() {
  const [selectedAgent, setSelectedAgent] = useState<string>('supervisor');
  const [isSaving, setIsSaving] = useState(false);

  // Mock agent configurations
  const agents: AgentSettings[] = [
    {
      id: 'supervisor',
      name: 'Supervisor Agent (Workflow)',
      description: 'Orchestrates the entire workflow and manages task distribution',
      config: {
        modelName: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        temperature: 0.7,
        maxTokens: 4096,
        enabled: true,
      },
    },
    {
      id: 'parser',
      name: 'Parser Agent',
      description: 'Parses uploaded documents and extracts structured data',
      config: {
        modelName: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        temperature: 0.3,
        maxTokens: 8192,
        enabled: true,
      },
    },
    {
      id: 'analysis',
      name: 'Analysis Agent',
      description: 'Analyzes documents and identifies requirements and opportunities',
      config: {
        modelName: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        temperature: 0.5,
        maxTokens: 8192,
        enabled: true,
      },
    },
    {
      id: 'content',
      name: 'Content Agent',
      description: 'Creates proposals, Q&A documents, and system designs',
      config: {
        modelName: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        temperature: 0.7,
        maxTokens: 16384,
        enabled: true,
      },
    },
    {
      id: 'knowledge',
      name: 'Knowledge Agent',
      description: 'Retrieves internal data from knowledge bases',
      config: {
        modelName: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        temperature: 0.3,
        maxTokens: 4096,
        enabled: true,
      },
    },
    {
      id: 'compliance',
      name: 'Compliance Agent',
      description: 'Verifies compliance requirements and standards',
      config: {
        modelName: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        temperature: 0.2,
        maxTokens: 8192,
        enabled: true,
      },
    },
    {
      id: 'qa',
      name: 'QA Agent',
      description: 'Verifies artifacts meet standards and requirements',
      config: {
        modelName: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        temperature: 0.3,
        maxTokens: 8192,
        enabled: true,
      },
    },
    {
      id: 'comms',
      name: 'Communications Agent',
      description: 'Sends notifications via email and Slack',
      config: {
        modelName: 'anthropic.claude-3-haiku-20240307-v1:0',
        temperature: 0.5,
        maxTokens: 2048,
        enabled: true,
      },
    },
    {
      id: 'submission',
      name: 'Submission Agent',
      description: 'Submits documents to client portals',
      config: {
        modelName: 'anthropic.claude-3-haiku-20240307-v1:0',
        temperature: 0.3,
        maxTokens: 2048,
        enabled: true,
      },
    },
  ];

  const currentAgent = agents.find((a) => a.id === selectedAgent);

  const form = useForm<AgentConfig>({
    resolver: zodResolver(agentConfigSchema),
    values: currentAgent?.config || {
      modelName: '',
      temperature: 0.7,
      maxTokens: 4096,
      enabled: true,
    },
  });

  const handleSave = async (data: AgentConfig) => {
    setIsSaving(true);
    try {
      console.log('Saving agent configuration:', { agentId: selectedAgent, config: data });
      // TODO: Implement save mutation
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error saving configuration:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    form.reset(currentAgent?.config);
  };

  const availableModels = [
    { value: 'anthropic.claude-3-5-sonnet-20241022-v2:0', label: 'Claude 3.5 Sonnet v2' },
    { value: 'anthropic.claude-3-5-sonnet-20240620-v1:0', label: 'Claude 3.5 Sonnet v1' },
    { value: 'anthropic.claude-3-opus-20240229-v1:0', label: 'Claude 3 Opus' },
    { value: 'anthropic.claude-3-sonnet-20240229-v1:0', label: 'Claude 3 Sonnet' },
    { value: 'anthropic.claude-3-haiku-20240307-v1:0', label: 'Claude 3 Haiku' },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Agent Configuration</h1>
        <p className="text-muted-foreground mt-2">
          Configure AI models, temperatures, and parameters for each agent
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Agents</CardTitle>
            <CardDescription>Select an agent to configure</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-accent transition-colors ${
                    selectedAgent === agent.id ? 'bg-accent' : ''
                  }`}
                >
                  <div className="font-medium">{agent.name}</div>
                  <div className="text-sm text-muted-foreground line-clamp-1">
                    {agent.description}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        agent.config.enabled
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {agent.config.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Configuration Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{currentAgent?.name}</CardTitle>
            <CardDescription>{currentAgent?.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
              {/* Model Selection */}
              <div className="space-y-2">
                <Label htmlFor="modelName">AI Model *</Label>
                <Select
                  value={form.watch('modelName')}
                  onValueChange={(value) => form.setValue('modelName', value)}
                >
                  <SelectTrigger id="modelName">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.modelName && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.modelName.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  The foundation model used for this agent
                </p>
              </div>

              <Separator />

              {/* Temperature */}
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature: {form.watch('temperature')}</Label>
                <Input
                  id="temperature"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  {...form.register('temperature', { valueAsNumber: true })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0 (Precise)</span>
                  <span>1 (Balanced)</span>
                  <span>2 (Creative)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Controls randomness in responses. Lower values are more focused and
                  deterministic.
                </p>
              </div>

              {/* Max Tokens */}
              <div className="space-y-2">
                <Label htmlFor="maxTokens">Maximum Tokens *</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  min="100"
                  max="100000"
                  step="128"
                  {...form.register('maxTokens', { valueAsNumber: true })}
                />
                {form.formState.errors.maxTokens && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.maxTokens.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Maximum length of the response (100 - 100,000 tokens)
                </p>
              </div>

              <Separator />

              {/* Enable/Disable Agent */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enabled">Agent Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable this agent in the workflow
                  </p>
                </div>
                <Switch
                  id="enabled"
                  checked={form.watch('enabled')}
                  onCheckedChange={(checked: boolean) => form.setValue('enabled', checked)}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={isSaving}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button type="submit" disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}