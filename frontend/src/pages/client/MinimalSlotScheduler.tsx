// MINIMAL WORKING EXAMPLE - Expand this based on your needs

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { slotService, TimeBlock } from '@/services/slotService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

const WEEKDAYS = [
    { value: 'monday', label: 'Mon' },
    { value: 'tuesday', label: 'Tue' },
    { value: 'wednesday', label: 'Wed' },
    { value: 'thursday', label: 'Thu' },
    { value: 'friday', label: 'Fri' },
    { value: 'saturday', label: 'Sat' },
    { value: 'sunday', label: 'Sun' },
];

export default function MinimalSlotScheduler() {
    const { turfId } = useParams();

    // State
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [activeDays, setActiveDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
    const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([
        { start: '06:00', end: '23:00', price: 1000 }
    ]);
    const [slotDuration, setSlotDuration] = useState(60);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const toggleDay = (day: string) => {
        setActiveDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const handleGenerate = async () => {
        if (!turfId || !startDate || !endDate) {
            alert('Please fill all fields');
            return;
        }

        setLoading(true);
        try {
            const response = await slotService.bulkGenerateSlots({
                turf_id: turfId,
                start_date: startDate,
                end_date: endDate,
                active_days: activeDays,
                time_blocks: timeBlocks,
                slot_duration: slotDuration,
                conflict_strategy: 'skip'
            });

            setResult(response.data);
            alert(`Success! Created ${response.data.created} slots`);
        } catch (error: any) {
            alert('Error: ' + (error.response?.data?.error || 'Failed to generate slots'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold">Bulk Slot Generator</h1>

            <Card className="p-6 space-y-4">
                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Start Date</label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">End Date</label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate || new Date().toISOString().split('T')[0]}
                        />
                    </div>
                </div>

                {/* Days of Week */}
                <div>
                    <label className="block text-sm font-medium mb-2">Active Days</label>
                    <div className="flex gap-2 flex-wrap">
                        {WEEKDAYS.map(({ value, label }) => (
                            <Button
                                key={value}
                                variant={activeDays.includes(value) ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => toggleDay(value)}
                            >
                                {label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Time Block (Simple - just one block) */}
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Start Time</label>
                        <Input
                            type="time"
                            value={timeBlocks[0].start}
                            onChange={(e) => setTimeBlocks([{ ...timeBlocks[0], start: e.target.value }])}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">End Time</label>
                        <Input
                            type="time"
                            value={timeBlocks[0].end}
                            onChange={(e) => setTimeBlocks([{ ...timeBlocks[0], end: e.target.value }])}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Price (₹)</label>
                        <Input
                            type="number"
                            value={timeBlocks[0].price}
                            onChange={(e) => setTimeBlocks([{ ...timeBlocks[0], price: Number(e.target.value) }])}
                        />
                    </div>
                </div>

                {/* Slot Duration */}
                <div>
                    <label className="block text-sm font-medium mb-2">Slot Duration (minutes)</label>
                    <select
                        className="w-full border rounded-md p-2"
                        value={slotDuration}
                        onChange={(e) => setSlotDuration(Number(e.target.value))}
                    >
                        <option value={30}>30 minutes</option>
                        <option value={60}>60 minutes</option>
                        <option value={90}>90 minutes</option>
                        <option value={120}>120 minutes</option>
                    </select>
                </div>

                {/* Generate Button */}
                <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full"
                    size="lg"
                >
                    {loading ? 'Generating...' : 'Generate Slots'}
                </Button>

                {/* Result */}
                {result && (
                    <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-md">
                        <p className="font-bold text-green-800">✅ Success!</p>
                        <p>Created: {result.created} slots</p>
                        {result.skipped > 0 && <p>Skipped: {result.skipped} (already existed)</p>}
                    </div>
                )}
            </Card>
        </div>
    );
}
