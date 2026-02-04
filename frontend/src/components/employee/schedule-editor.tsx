import { useState } from 'react';
import { Schedule } from '../../types/employee-types';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface ScheduleEditorProps {
  schedule?: Schedule;
  onChange: (schedule: Schedule) => void;
}

export const ScheduleEditor = ({ schedule, onChange }: ScheduleEditorProps) => {
  const [workDays, setWorkDays] = useState<string[]>(
    schedule?.workDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  );
  const [startTime, setStartTime] = useState(schedule?.startTime || '09:00');
  const [endTime, setEndTime] = useState(schedule?.endTime || '17:00');

  const handleDayToggle = (day: string, checked: boolean) => {
    const newDays = checked ? [...workDays, day] : workDays.filter((d) => d !== day);
    setWorkDays(newDays);
    onChange({ workDays: newDays, startTime, endTime });
  };

  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setStartTime(value);
      onChange({ workDays, startTime: value, endTime });
    } else {
      setEndTime(value);
      onChange({ workDays, startTime, endTime: value });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block">Work Days</Label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <label key={day} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={workDays.includes(day)}
                onCheckedChange={(checked: boolean) => handleDayToggle(day, !!checked)}
              />
              <span className="text-sm">{day}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Label htmlFor="startTime">Start Time</Label>
          <Input
            id="startTime"
            type="time"
            value={startTime}
            onChange={(e) => handleTimeChange('start', e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="endTime">End Time</Label>
          <Input
            id="endTime"
            type="time"
            value={endTime}
            onChange={(e) => handleTimeChange('end', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
