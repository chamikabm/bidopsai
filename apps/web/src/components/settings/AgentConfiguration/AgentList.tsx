'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AgentType, AGENT_METADATA } from '@/types/agent';
import { AgentConfigForm } from './AgentConfigForm';
import { cn } from '@/lib/utils';

export function AgentList() {
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);

  const agents = Object.values(AgentType);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Agent Configuration</CardTitle>
          <CardDescription>
            Configure AI models and parameters for each agent type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agentType) => {
              const metadata = AGENT_METADATA[agentType];
              return (
                <motion.div
                  key={agentType}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={cn(
                      'cursor-pointer transition-colors hover:border-primary',
                      selectedAgent === agentType && 'border-primary bg-accent'
                    )}
                    onClick={() => setSelectedAgent(agentType)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-3xl">{metadata.icon}</div>
                          <div>
                            <div className="font-semibold">{metadata.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {agentType}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAgent(agentType);
                          }}
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {metadata.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedAgent && (
        <AgentConfigForm
          agentType={selectedAgent}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </div>
  );
}
