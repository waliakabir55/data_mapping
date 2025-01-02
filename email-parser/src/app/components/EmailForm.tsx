'use client';

import React, { useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    ParseResponse,
    SchemaSuggestion,
} from '@/types';

// sample emails
const SAMPLE_EMAILS = [
    `Subject: Meeting Report - Q4 Planning
From: john.doe@company.com
Date: 2024-01-15
Content: Team reviewed Q4 targets. Action items: 1) Update sales forecast 2) Schedule client meetings 3) Prepare budget revision by Friday.`,
    `Subject: New Product Launch
From: marketing@company.com
Date: 2024-01-16
Content: Successfully launched Product X. First day metrics: 1000 signups, $50k revenue. Customer feedback largely positive.`,
    `Subject: IT Support Ticket #1234
From: support@company.com
Date: 2024-01-17
Content: Server downtime reported in EU region. Issue resolved within 2 hours. Root cause: network configuration error.`
];

// sample target schema
const SAMPLE_TARGET_SCHEMA = {
    id: { type: "string", required: true, description: "Unique identifier" },
    date: { type: "string", required: true, description: "Email date" },
    subject: { type: "string", required: true, description: "Email subject" },
    category: { type: "string", required: true, description: "Email category" },
    priority: { type: "number", required: true, description: "Priority level" },
    actionItems: { 
        type: "string[]", 
        required: false, 
        description: "List of action items" 
    }
};

export default function EmailForm() {
    // Enhanced state management
    const [email, setEmail] = useState('');
    const [targetSchema, setTargetSchema] = useState(
        JSON.stringify(SAMPLE_TARGET_SCHEMA, null, 2)
    );
    const [result, setResult] = useState<ParseResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Handler for schema suggestions
    const handleSchemaSuggestion = (suggestion: SchemaSuggestion) => {
        try {
            const currentSchema = JSON.parse(targetSchema);
            const updatedSchema = {
                ...currentSchema,
                [suggestion.fieldName]: {
                    type: suggestion.suggestedType,
                    required: false,
                    description: suggestion.reason
                }
            };
            setTargetSchema(JSON.stringify(updatedSchema, null, 2));
        } catch (err) {
            setError('Failed to update schema');
        }
    };

    const handleSampleClick = (sampleEmail: string) => {
        setEmail(sampleEmail);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/parse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, targetSchema }),
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to process email');
            }
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to render confidence indicators
    const renderConfidence = (score: number) => {
        const getColor = (s: number) => {
            if (s >= 0.8) return 'bg-green-500';
            if (s >= 0.6) return 'bg-yellow-500';
            return 'bg-red-500';
        };

        return (
            <div className="flex items-center space-x-2">
                <Progress 
                    value={score * 100} 
                    className={`w-24 ${getColor(score)}`}
                />
                <span>{(score * 100).toFixed(1)}%</span>
            </div>
        );
    };

    // Helper components
    const MetricItem = ({ label, value }: { label: string; value: string | number }) => (
        <div className="p-4 border rounded-lg bg-card">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold">{value}</p>
        </div>
    );

    const ResultsTable = ({
        data,
        confidenceScores,
        title
    }: {
        data: Record<string, any>;
        confidenceScores: Record<string, number>;
        title: string;
    }) => (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Field</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead className="w-[200px]">Confidence</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.entries(data).map(([key, value]) => (
                            <TableRow key={key}>
                                <TableCell className="font-medium">{key}</TableCell>
                                <TableCell>
                                    {Array.isArray(value) ? value.join(', ') : String(value)}
                                </TableCell>
                                <TableCell>
                                    <ConfidenceIndicator score={confidenceScores[key] || 0} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );

    const ConfidenceIndicator = ({ score }: { score: number }) => {
        const getColor = (s: number) => {
            if (s >= 0.8) return 'bg-success';
            if (s >= 0.6) return 'bg-warning';
            return 'bg-destructive';
        };

        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger className="flex items-center space-x-2">
                        <Progress 
                            value={score * 100} 
                            className={`w-[100px] ${getColor(score)}`}
                        />
                        <span className="text-sm">
                            {(score * 100).toFixed(1)}%
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Confidence Score: {(score * 100).toFixed(1)}%</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    };

    return (
        <div className="container mx-auto py-6 space-y-8">
            {/* Main Form Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Email Parser and Schema Mapper</CardTitle>
                    <CardDescription>
                        Parse email content and map it to your target schema using AI
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Tabs defaultValue="input" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="input">Email Input</TabsTrigger>
                                <TabsTrigger value="schema">Target Schema</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="input" className="space-y-4">
                                <div className="space-y-2">
                                    <Textarea
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Paste your email content here..."
                                        className="min-h-[200px] font-mono"
                                    />
                                    
                                    <div className="flex space-x-2 mt-2">
                                        {SAMPLE_EMAILS.map((sampleEmail, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => setEmail(sampleEmail)}
                                                className="px-4 py-2 bg-gray-200 rounded"
                                            >
                                                Sample {index + 1}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>
                            
                            <TabsContent value="schema" className="space-y-4">
                                <Textarea
                                    value={targetSchema}
                                    onChange={(e) => setTargetSchema(e.target.value)}
                                    placeholder="Define your target schema in JSON format..."
                                    className="min-h-[200px] font-mono"
                                />
                            </TabsContent>
                        </Tabs>
                        
                        <div className="flex justify-end">
                            <button 
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-blue-500 text-white rounded"
                            >
                                {loading ? 'Processing...' : 'Process Email'}
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Results Section */}
            {result && (
                <div className="space-y-6">
                    {/* Metrics Dashboard Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Processing Metrics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <MetricItem
                                    label="Processing Time"
                                    value={`${result.processingMetrics.processingTime}ms`}
                                />
                                <MetricItem
                                    label="Tokens Used"
                                    value={result.processingMetrics.tokensUsed}
                                />
                                <MetricItem
                                    label="Estimated Cost"
                                    value={`$${result.processingMetrics.estimatedCost.toFixed(4)}`}
                                />
                                <MetricItem
                                    label="Success Rate"
                                    value={`${(result.processingMetrics.recentPerformance.successRate * 100).toFixed(1)}%`}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Results Tabs */}
                    <Tabs defaultValue="extracted" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="extracted">Extracted Data</TabsTrigger>
                            <TabsTrigger value="mapped">Mapped Data</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="extracted">
                            <ResultsTable
                                data={result.extractedData}
                                confidenceScores={result.confidenceScores}
                                title="Extracted Raw Data"
                            />
                        </TabsContent>
                        
                        <TabsContent value="mapped">
                            <ResultsTable
                                data={result.mappedData}
                                confidenceScores={result.confidenceScores}
                                title="Schema-Mapped Data"
                            />
                        </TabsContent>
                    </Tabs>

                    {/* Schema Suggestions */}
                    {result.schemaSuggestions && result.schemaSuggestions.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Schema Evolution Suggestions</CardTitle>
                                <CardDescription>
                                    Click on a suggestion to update your schema
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[200px] rounded-md border p-4">
                                    {result.schemaSuggestions.map((suggestion, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-4 hover:bg-accent rounded-lg cursor-pointer"
                                            onClick={() => handleSchemaSuggestion(suggestion)}
                                        >
                                            <div className="space-y-1">
                                                <p className="font-medium">{suggestion.fieldName}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {suggestion.reason}
                                                </p>
                                            </div>
                                            <Badge variant="secondary">
                                                {suggestion.suggestedType}
                                            </Badge>
                                        </div>
                                    ))}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}