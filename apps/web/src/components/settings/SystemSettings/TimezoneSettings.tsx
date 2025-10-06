'use client';

import { useState } from 'react';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: '+00:00' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)', offset: '-05:00' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)', offset: '-06:00' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)', offset: '-07:00' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)', offset: '-08:00' },
  { value: 'Europe/London', label: 'London', offset: '+00:00' },
  { value: 'Europe/Paris', label: 'Paris, Berlin, Rome', offset: '+01:00' },
  { value: 'Asia/Dubai', label: 'Dubai', offset: '+04:00' },
  { value: 'Asia/Kolkata', label: 'Mumbai, Kolkata', offset: '+05:30' },
  { value: 'Asia/Singapore', label: 'Singapore', offset: '+08:00' },
  { value: 'Asia/Tokyo', label: 'Tokyo', offset: '+09:00' },
  { value: 'Australia/Sydney', label: 'Sydney', offset: '+11:00' },
  { value: 'Australia/Melbourne', label: 'Melbourne', offset: '+11:00' },
  { value: 'Pacific/Auckland', label: 'Auckland', offset: '+13:00' },
];

export function TimezoneSettings() {
  const [timezone, setTimezone] = useState('UTC');
  const { toast } = useToast();

  const handleTimezoneChange = (value: string) => {
    setTimezone(value);
    // TODO: Persist timezone preference to user settings
    toast({
      title: 'Timezone updated',
      description: `Your timezone has been set to ${TIMEZONES.find((tz) => tz.value === value)?.label}`,
    });
  };

  const currentTime = new Date().toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <CardTitle>Timezone</CardTitle>
        </div>
        <CardDescription>Set your local timezone for accurate timestamps</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="timezone-select">Select Timezone</Label>
          <Select value={timezone} onValueChange={handleTimezoneChange}>
            <SelectTrigger id="timezone-select">
              <SelectValue placeholder="Select a timezone" />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{tz.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{tz.offset}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Current time in selected timezone</p>
              <p className="text-xs text-muted-foreground">
                {TIMEZONES.find((tz) => tz.value === timezone)?.label}
              </p>
            </div>
            <div className="text-2xl font-bold tabular-nums">{currentTime}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
