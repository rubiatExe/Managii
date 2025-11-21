"use client";

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GripVertical, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

interface Job {
    id: string;
    title: string;
    company: string;
    status: string;
    fitScore: number | null;
    createdAt: string;
    order?: number;
    location?: string | null;
    category?: string | null;
}

interface JobTableProps {
    jobs: Job[];
}

function SortableJobRow({ job, onDelete }: { job: Job; onDelete: (id: string) => void }) {
    const router = useRouter();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: job.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            className="hover:bg-muted/50"
        >
            <TableCell className="w-12">
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
            </TableCell>
            <TableCell className="font-medium cursor-pointer" onClick={() => router.push(`/jobs/${job.id}`)}>
                {job.title}
            </TableCell>
            <TableCell className="cursor-pointer" onClick={() => router.push(`/jobs/${job.id}`)}>
                {job.company}
            </TableCell>
            <TableCell className="cursor-pointer" onClick={() => router.push(`/jobs/${job.id}`)}>
                <Badge variant={job.status === "Applied" ? "default" : "secondary"}>
                    {job.status}
                </Badge>
            </TableCell>
            <TableCell className="cursor-pointer" onClick={() => router.push(`/jobs/${job.id}`)}>
                {job.fitScore !== null ? (
                    <span className={job.fitScore > 80 ? "text-green-600 font-bold" : job.fitScore > 50 ? "text-yellow-600" : "text-red-600"}>
                        {job.fitScore}%
                    </span>
                ) : (
                    <span className="text-gray-400">N/A</span>
                )}
            </TableCell>
            <TableCell className="cursor-pointer" onClick={() => router.push(`/jobs/${job.id}`)}>
                {job.location || <span className="text-gray-400">N/A</span>}
            </TableCell>
            <TableCell className="cursor-pointer" onClick={() => router.push(`/jobs/${job.id}`)}>
                {job.category ? (
                    <Badge style={{
                        backgroundColor: getCategoryColor(job.category),
                        color: 'white'
                    }}>
                        {getCategoryName(job.category)}
                    </Badge>
                ) : (
                    <span className="text-gray-400">N/A</span>
                )}
            </TableCell>
            <TableCell className="cursor-pointer" onClick={() => router.push(`/jobs/${job.id}`)}>
                {new Date(job.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                    {/* View button */}
                    <Link
                        href={`/jobs/${job.id}`}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-transparent hover:bg-muted/50 h-9 px-3"
                    >
                        View
                    </Link>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this job?')) {
                                onDelete(job.id);
                            }
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}

// Helper functions for category display
function getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
        'sde': '#3b82f6',      // blue
        'aiml': '#8b5cf6',     // purple
        'cv': '#ec4899',       // pink
        'nlp': '#10b981',      // green
        'robo': '#f59e0b'      // amber
    };
    return colors[category] || '#6b7280'; // gray
}

function getCategoryName(category: string): string {
    const names: Record<string, string> = {
        'sde': 'Software Dev',
        'aiml': 'AI/ML',
        'cv': 'Computer Vision',
        'nlp': 'NLP',
        'robo': 'Robotics'
    };
    return names[category] || 'Other';
}

export function JobTable({ jobs: initialJobs }: JobTableProps) {
    const [jobs, setJobs] = useState(initialJobs);
    const [mounted, setMounted] = useState(false);
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // Auto-refresh jobs every 5 seconds
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const response = await fetch('/api/jobs');
                const data = await response.json();
                if (data.success) {
                    setJobs(data.jobs);
                }
            } catch (error) {
                console.error('Failed to refresh jobs:', error);
            }
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, []);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = jobs.findIndex((job) => job.id === active.id);
            const newIndex = jobs.findIndex((job) => job.id === over.id);

            const newJobs = arrayMove(jobs, oldIndex, newIndex);
            setJobs(newJobs);

            // Update order on server
            try {
                await Promise.all(
                    newJobs.map((job, index) =>
                        fetch(`/api/jobs/${job.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ order: index }),
                        })
                    )
                );
            } catch (error) {
                console.error('Failed to update job order:', error);
            }
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/jobs/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setJobs(jobs.filter(job => job.id !== id));
            } else {
                alert('Failed to delete job');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Error deleting job');
        }
    };

    return (
        <>
            {!mounted ? (
                <Table>
                    <TableCaption>Loading...</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>Job Title</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Fit Score</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Date Applied</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={7} className="text-center h-24">
                                Loading...
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <Table>
                        <TableCaption>Drag to reorder. Click to view details.</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12"></TableHead>
                                <TableHead>Job Title</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Fit Score</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Date Applied</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {jobs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center h-24">
                                        No jobs tracked yet. Use the Chrome Extension to add some!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <SortableContext
                                    items={jobs.map(job => job.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {jobs.map((job) => (
                                        <SortableJobRow key={job.id} job={job} onDelete={handleDelete} />
                                    ))}
                                </SortableContext>
                            )}
                        </TableBody>
                    </Table>
                </DndContext>
            )}
        </>
    );
}
