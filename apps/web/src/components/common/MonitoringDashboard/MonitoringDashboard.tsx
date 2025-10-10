'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { errorTracker, logger, analytics } from '@/lib/monitoring';
import { performanceMonitor } from '@/lib/performance';

/**
 * Monitoring Dashboard Component
 * Development tool for viewing monitoring data
 * Only visible in development mode
 */
export function MonitoringDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [errors, setErrors] = useState(errorTracker.getErrors());
  const [logs, setLogs] = useState(logger.getLogs());
  const [analyticsData, setAnalyticsData] = useState(analytics.getSummary());
  const [performance, setPerformance] = useState(performanceMonitor.getSummary());

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setErrors(errorTracker.getErrors());
      setLogs(logger.getLogs());
      setAnalyticsData(analytics.getSummary());
      setPerformance(performanceMonitor.getSummary());
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50"
        variant="outline"
        size="sm"
      >
        📊 Monitoring
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[600px] max-h-[600px] overflow-auto bg-background border rounded-lg shadow-lg">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Monitoring Dashboard</CardTitle>
              <CardDescription>Development monitoring tools</CardDescription>
            </div>
            <Button onClick={() => setIsOpen(false)} variant="ghost" size="sm">
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="errors">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="errors">
                Errors
                {errors.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {errors.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="errors" className="space-y-2">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Recent Errors</h3>
                <Button onClick={() => errorTracker.clearErrors()} size="sm" variant="outline">
                  Clear
                </Button>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-auto">
                {errors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No errors tracked</p>
                ) : (
                  errors.slice(-10).reverse().map((error) => (
                    <div key={error.id} className="p-2 border rounded text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant={
                          error.severity === 'critical' ? 'destructive' :
                          error.severity === 'high' ? 'destructive' :
                          error.severity === 'medium' ? 'default' : 'secondary'
                        }>
                          {error.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(error.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="font-mono text-xs">{error.message}</p>
                      {error.context.component && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Component: {error.context.component}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="logs" className="space-y-2">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Recent Logs</h3>
                <Button onClick={() => logger.clearLogs()} size="sm" variant="outline">
                  Clear
                </Button>
              </div>
              <div className="space-y-1 max-h-[400px] overflow-auto">
                {logs.slice(-20).reverse().map((log, index) => (
                  <div key={index} className="p-1 text-xs font-mono">
                    <span className={
                      log.level === 'error' ? 'text-red-500' :
                      log.level === 'warn' ? 'text-yellow-500' :
                      log.level === 'info' ? 'text-blue-500' : 'text-gray-500'
                    }>
                      [{log.level.toUpperCase()}]
                    </span>
                    {' '}
                    <span className="text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    {' '}
                    {log.message}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-2">
              <h3 className="font-semibold mb-2">Analytics Summary</h3>
              <div className="space-y-2">
                <div className="p-2 border rounded">
                  <p className="text-sm font-semibold">Session</p>
                  <p className="text-xs text-muted-foreground">{analyticsData.sessionId}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 border rounded">
                    <p className="text-xs text-muted-foreground">Events</p>
                    <p className="text-lg font-bold">{analyticsData.totalEvents}</p>
                  </div>
                  <div className="p-2 border rounded">
                    <p className="text-xs text-muted-foreground">Page Views</p>
                    <p className="text-lg font-bold">{analyticsData.totalPageViews}</p>
                  </div>
                  <div className="p-2 border rounded">
                    <p className="text-xs text-muted-foreground">Actions</p>
                    <p className="text-lg font-bold">{analyticsData.totalActions}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-2">
              <h3 className="font-semibold mb-2">Performance Metrics</h3>
              <div className="space-y-2">
                <div className="p-2 border rounded">
                  <p className="text-sm font-semibold mb-2">Web Vitals</p>
                  <div className="space-y-1">
                    {Object.entries(performance.webVitals).map(([name, data]) => (
                      <div key={name} className="flex justify-between text-xs">
                        <span>{name}</span>
                        <span>
                          {data.value.toFixed(2)}ms
                          <Badge
                            variant={
                              data.rating === 'good' ? 'default' :
                              data.rating === 'needs-improvement' ? 'secondary' : 'destructive'
                            }
                            className="ml-2"
                          >
                            {data.rating}
                          </Badge>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-2 border rounded">
                  <p className="text-sm font-semibold mb-2">Custom Metrics</p>
                  <p className="text-xs text-muted-foreground">
                    {performance.customMetrics.count} metrics tracked
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
