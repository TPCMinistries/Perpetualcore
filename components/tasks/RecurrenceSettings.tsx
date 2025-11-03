"use client";

import { useState } from "react";
import { RepeatIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface RecurrencePattern {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  monthOfYear?: number;
  endDate?: string;
  endAfterOccurrences?: number;
  skipWeekends?: boolean;
}

interface RecurrenceSettingsProps {
  pattern: RecurrencePattern | null;
  onChange: (pattern: RecurrencePattern | null) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export function RecurrenceSettings({ pattern, onChange }: RecurrenceSettingsProps) {
  const [enabled, setEnabled] = useState(!!pattern);

  const handleEnableRecurrence = () => {
    if (!enabled) {
      onChange({
        frequency: "daily",
        interval: 1,
        skipWeekends: false,
      });
      setEnabled(true);
    } else {
      onChange(null);
      setEnabled(false);
    }
  };

  const updatePattern = (updates: Partial<RecurrencePattern>) => {
    if (pattern) {
      onChange({ ...pattern, ...updates });
    }
  };

  const toggleDayOfWeek = (day: number) => {
    if (!pattern) return;
    const currentDays = pattern.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort();
    updatePattern({ daysOfWeek: newDays });
  };

  if (!enabled) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={handleEnableRecurrence}
        className="w-full"
      >
        <RepeatIcon className="h-4 w-4 mr-2" />
        Make Recurring
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <RepeatIcon className="h-4 w-4" />
          Recurrence Settings
        </CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleEnableRecurrence}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Frequency & Interval */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Repeats</Label>
            <Select
              value={pattern.frequency}
              onValueChange={(value: any) => updatePattern({ frequency: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Every</Label>
            <Input
              type="number"
              min="1"
              value={pattern.interval}
              onChange={(e) => updatePattern({ interval: parseInt(e.target.value) || 1 })}
            />
          </div>
        </div>

        {/* Weekly: Day of Week Selection */}
        {pattern.frequency === "weekly" && (
          <div>
            <Label className="mb-2 block">Repeat on</Label>
            <div className="flex gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <Button
                  key={day.value}
                  type="button"
                  variant={(pattern.daysOfWeek || []).includes(day.value) ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => toggleDayOfWeek(day.value)}
                >
                  {day.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Monthly: Day of Month */}
        {pattern.frequency === "monthly" && (
          <div>
            <Label>Day of Month</Label>
            <Input
              type="number"
              min="1"
              max="31"
              value={pattern.dayOfMonth || 1}
              onChange={(e) => updatePattern({ dayOfMonth: parseInt(e.target.value) || 1 })}
            />
          </div>
        )}

        {/* Yearly: Month */}
        {pattern.frequency === "yearly" && (
          <div>
            <Label>Month</Label>
            <Select
              value={String(pattern.monthOfYear || 1)}
              onValueChange={(value) => updatePattern({ monthOfYear: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">January</SelectItem>
                <SelectItem value="2">February</SelectItem>
                <SelectItem value="3">March</SelectItem>
                <SelectItem value="4">April</SelectItem>
                <SelectItem value="5">May</SelectItem>
                <SelectItem value="6">June</SelectItem>
                <SelectItem value="7">July</SelectItem>
                <SelectItem value="8">August</SelectItem>
                <SelectItem value="9">September</SelectItem>
                <SelectItem value="10">October</SelectItem>
                <SelectItem value="11">November</SelectItem>
                <SelectItem value="12">December</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Skip Weekends */}
        {(pattern.frequency === "daily" || pattern.frequency === "weekly") && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="skipWeekends"
              className="h-4 w-4 rounded border-gray-300"
              checked={pattern.skipWeekends || false}
              onChange={(e) => updatePattern({ skipWeekends: e.target.checked })}
            />
            <Label htmlFor="skipWeekends" className="cursor-pointer">
              Skip weekends
            </Label>
          </div>
        )}

        {/* End Condition */}
        <div>
          <Label className="mb-2 block">Ends</Label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="endNever"
                name="endCondition"
                checked={!pattern.endDate && !pattern.endAfterOccurrences}
                onChange={() => updatePattern({ endDate: undefined, endAfterOccurrences: undefined })}
                className="h-4 w-4"
              />
              <Label htmlFor="endNever" className="cursor-pointer">
                Never
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="endDate"
                name="endCondition"
                checked={!!pattern.endDate}
                onChange={() => {}}
                className="h-4 w-4"
              />
              <Label htmlFor="endDate" className="cursor-pointer">
                On
              </Label>
              <Input
                type="date"
                value={pattern.endDate || ""}
                onChange={(e) => updatePattern({ endDate: e.target.value, endAfterOccurrences: undefined })}
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="endAfter"
                name="endCondition"
                checked={!!pattern.endAfterOccurrences}
                onChange={() => {}}
                className="h-4 w-4"
              />
              <Label htmlFor="endAfter" className="cursor-pointer">
                After
              </Label>
              <Input
                type="number"
                min="1"
                value={pattern.endAfterOccurrences || ""}
                onChange={(e) => updatePattern({ endAfterOccurrences: parseInt(e.target.value), endDate: undefined })}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">occurrences</span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {getRecurrenceSummary(pattern)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function getRecurrenceSummary(pattern: RecurrencePattern): string {
  const { frequency, interval } = pattern;
  let summary = `Repeats every ${interval > 1 ? interval + " " : ""}`;

  switch (frequency) {
    case "daily":
      summary += interval === 1 ? "day" : "days";
      break;
    case "weekly":
      summary += interval === 1 ? "week" : "weeks";
      if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
        const days = pattern.daysOfWeek.map(d => DAYS_OF_WEEK[d].label).join(", ");
        summary += ` on ${days}`;
      }
      break;
    case "monthly":
      summary += interval === 1 ? "month" : "months";
      if (pattern.dayOfMonth) {
        summary += ` on day ${pattern.dayOfMonth}`;
      }
      break;
    case "yearly":
      summary += interval === 1 ? "year" : "years";
      break;
  }

  if (pattern.skipWeekends) {
    summary += ", skipping weekends";
  }

  if (pattern.endDate) {
    summary += ` until ${new Date(pattern.endDate).toLocaleDateString()}`;
  } else if (pattern.endAfterOccurrences) {
    summary += ` for ${pattern.endAfterOccurrences} times`;
  }

  return summary;
}
