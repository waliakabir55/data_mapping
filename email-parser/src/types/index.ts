// export interface ParseRequest {
//     email: string;
//     targetSchema: string;
// }

// export interface ParseResponse {
//     extractedData: any;
//     mappedData: any;
// }

// types/index.ts

// First, let's define metrics-related interfaces
export interface MetricEntry {
    startTime: number;
    endTime: number;
    tokensUsed: number;
    modelCost: number;
    successfulParse: boolean;
    schemaEvolutionSuggested: boolean;
}

export interface AggregateMetrics {
    totalProcessed: number;
    successRate: number;
    averageProcessingTime: number;
    totalCost: number;
    schemaEvolutionRate: number;
}

export interface ProcessingMetrics {
    processingTime: number;
    tokensUsed: number;
    estimatedCost: number;
    recentPerformance: AggregateMetrics;
}

// Schema-related interfaces
export interface ValidationResult {
    success: boolean;
    errors: string[];
}

export interface ConfidenceScores {
    [fieldName: string]: number;
}

export interface SchemaField {
    type: string;
    required: boolean;
    description?: string;
}

export interface SchemaDefinition {
    [fieldName: string]: SchemaField;
}

export interface SchemaSuggestion {
    fieldName: string;
    suggestedType: string;
    reason: string;
    sampleValue: any;
}

// Main request/response interfaces
export interface ParseRequest {
    email: string;
    targetSchema: string;
    options?: {
        modelName?: string;
        temperature?: number;
        enableSchemaEvolution?: boolean;
    };
}

export interface ParseResponse {
    extractedData: Record<string, any>;
    mappedData: Record<string, any>;
    additionalFields?: Record<string, any>;
    schemaSuggestions?: SchemaSuggestion[];
    validation: ValidationResult;
    confidenceScores: ConfidenceScores;
    processingMetrics: ProcessingMetrics;
}