'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AgentType, AGENT_METADATA } from '@/types/agent';
import { AgentModelSettings } from './AgentModelSettings';

const agentConfigSchema = z.object({
  modelName: z.string().min(1, 'Model name is required'),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(1).max(100000),
  systemPrompt: z.string().min(1, 'System prompt is required'),
  additionalParameters: z.string().optional(),
});

type AgentConfigFormValues = z.infer<typeof agentConfigSchema>;

interface AgentConfigFormProps {
  agentType: AgentType;
  onClose: () => void;
}

export function AgentConfigForm({ agentType, onClose }: AgentConfigFormProps) {
  const { toast } = useToast();
  const metadata = AGENT_METADATA[agentType];

  const form = useForm<AgentConfigFormValues>({
    resolver: zodResolver(agentConfigSchema),
    defaultValues: {
      modelName: 'claude-3-5-sonnet-20241022',
      temperature: 0.7,
      maxTokens: 4096,
      systemPrompt: `You are the ${metadata.label} agent. ${metadata.description}`,
      additionalParameters: '',
    },
  });

  // TODO: Fetch existing configuration from GraphQL
  useEffect(() => {
    // Placeholder for fetching agent configuration
    // const fetchConfig = async () => {
    //   const config = await getAgentConfiguration(agentType);
    //   form.reset(config);
    // };
    // fetchConfig();
  }, [agentType]);

  const onSubmit = async (data: AgentConfigFormValues) => {
    try {
      // Parse additional parameters if provided
      let _additionalParams = undefined;
      if (data.additionalParameters) {
        try {
          _additionalParams = JSON.parse(data.additionalParameters);
        } catch {
          toast({
            title: 'Invalid JSON',
            description: 'Additional parameters must be valid JSON',
            variant: 'destructive',
          });
          return;
        }
      }

      // TODO: Call GraphQL mutation to update agent configuration
      // await updateAgentConfiguration(agentType, {
      //   ...data,
      //   additionalParameters: _additionalParams,
      // });

      toast({
        title: 'Configuration saved',
        description: `${metadata.label} agent configuration has been updated`,
      });

      onClose();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save agent configuration',
        variant: 'destructive',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">{metadata.icon}</div>
              <div>
                <CardTitle>Configure {metadata.label} Agent</CardTitle>
                <CardDescription>{metadata.description}</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <AgentModelSettings form={form} />

              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="2"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={field.value}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Controls randomness: 0 is focused, 2 is creative (current: {field.value})
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxTokens"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Tokens</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="100000"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum number of tokens to generate
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="systemPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Prompt</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={6}
                        placeholder="Enter the system prompt for this agent..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Instructions that define the agent&apos;s behavior and role
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additionalParameters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Parameters (JSON)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder='{"top_p": 0.9, "frequency_penalty": 0.5}'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional JSON object with additional model parameters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  Save Configuration
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
