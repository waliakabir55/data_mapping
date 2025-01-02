import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { appendToFile } from '@/lib/db';
import { 
    ParseRequest, 
    ParseResponse, 
    MetricEntry,
    ValidationResult,
    ConfidenceScores 
} from '@/types';
import { metricsManager } from '@/lib/metrics';

// Helper function to extract JSON from a string using regex
// it cleanly extracts the first JSON object from the string
function extractJsonFromString(input: string): string {
    const jsonRegex = /{[^]*}/;
    const match = input.match(jsonRegex);
    return match ? match[0] : '{}';
}

// model choice
const modelChoice = "gpt-4o"

// openai client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// POST request handler for parsing emails
export async function POST(request: Request) {
    // start time
    const startTime = Date.now();
    // tokens used
    let tokensUsed = 0;
    // schema evolution suggested
    let schemaEvolutionSuggested = false;

    try {
        const body: ParseRequest = await request.json();
        const { email, targetSchema } = body;

        // Enhanced system prompt for extraction with schema evolution
        const system_prompt_extraction = `
        You are a data extraction expert. Extract structured data from the email into a logical JSON schema.
        If you identify data that doesn't fit the target schema but seems important, include it in an "additional_fields" object.
        Create appropriate fields based on the content. Return the mapped data in JSON format.
        
        ## OUTPUT FORMAT
        {
          "extracted_data": {
            // core extracted fields
          },
          "additional_fields": {
            // fields that might be valuable but don't fit the current schema
          },
          "schema_suggestions": {
            // suggestions for evolving the schema if valuable data was found
          }
        }
          
        Make sure to only output the JSON object and nothing else. No comments or other text.`;

        const extractionUserPrompt = `Email content: ${email}`;

        const extractionResponse = await openai.chat.completions.create({
            model: modelChoice,
            messages: [
                { role: "system", content: system_prompt_extraction },
                { role: "user", content: extractionUserPrompt }
            ],
            temperature: 0.0, // Lower temperature for more consistent extraction
        });

        console.log(extractionResponse.choices[0].message.content);

        // update tokens used
        tokensUsed += extractionResponse.usage?.total_tokens || 0;
        
        // extract data
        const extractedData = JSON.parse(
            extractJsonFromString(extractionResponse.choices[0].message.content ?? '')
        );

        // check if we have schema evolution suggestions
        if (extractedData.schema_suggestions && 
            Object.keys(extractedData.schema_suggestions).length > 0) {
            schemaEvolutionSuggested = true;
        }

        const mappingSystemPrompt = `
        You are a data mapping expert. Map the extracted data to the target schema and validate the output.
        For each field:
        1. Ensure type correctness
        2. Apply any necessary transformations
        3. Validate against schema constraints

        ## OUTPUT FORMAT
        {
          "mapped_data": {
            // mapped data
          },
          "validation": {
            "success": boolean,
            "errors": [] // Any validation issues
          },
          "confidence_scores": {} // Confidence for each mapped field
        }

        Make sure to only output the JSON object and nothing else. No comments or other text.`;

        const mappingUserPrompt = `
        Extracted data: ${JSON.stringify(extractedData)}s
        Target schema: ${targetSchema}`;

        // enhanced mapping prompt that includes validation
        const mappingResponse = await openai.chat.completions.create({
            model: modelChoice,
            messages: [
                {
                    role: "system",
                    content: mappingSystemPrompt,
                },
                {
                    role: "user",
                    content: mappingUserPrompt
                }
            ],
            temperature: 0.0,
        });

        console.log(mappingResponse.choices[0].message.content);

        // update tokens used
        tokensUsed += mappingResponse.usage?.total_tokens || 0;

        // parse mapped data
        const mappedResult = JSON.parse(
            extractJsonFromString(mappingResponse.choices[0].message.content ?? '')
        );

        // calculate processing metrics
        const endTime = Date.now();
        const modelCost = tokensUsed * (modelChoice === 'gpt-4o' ? 0.00003 : 0.000002);

        // create metric entry
        const metricEntry: MetricEntry = {
            startTime,
            endTime,
            tokensUsed,
            modelCost,
            successfulParse: mappedResult.validation.success,
            schemaEvolutionSuggested
        };

        metricsManager.addMetric(metricEntry);

        // get recent performance metrics
        const recentPerformance = metricsManager.getRecentMetrics();

        // create response
        const response: ParseResponse = {
            extractedData: extractedData.extracted_data,
            mappedData: mappedResult.mapped_data,
            additionalFields: extractedData.additional_fields,
            schemaSuggestions: extractedData.schema_suggestions,
            validation: mappedResult.validation,
            confidenceScores: mappedResult.confidence_scores,
            processingMetrics: {
                processingTime: endTime - startTime,
                tokensUsed,
                estimatedCost: modelCost,
                recentPerformance
            }
        };

        // append to file
        await appendToFile(response);

        // return response
        return NextResponse.json(response);

        } catch (error) {
        // calculate processing metrics
        const endTime = Date.now();
        // calculate model cost
        const modelCost = tokensUsed * (modelChoice === 'gpt-4o' ? 0.00003 : 0.000002);

            // Log error metric
            const errorMetric: MetricEntry = {
                startTime,
                endTime,
                tokensUsed,
                modelCost: tokensUsed * 0.00003,
                successfulParse: false,
                schemaEvolutionSuggested
            };
            
            // add error metric
            metricsManager.addMetric(errorMetric);
    
            // log error
            console.error('Error:', error);

            // return error response
            return NextResponse.json(
                { error: 'Failed to process request' },
                { status: 500 }
            );
        }
}