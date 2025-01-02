import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { appendToFile } from '@/lib/db';
import { ParseRequest, ParseResponse } from '@/types';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

function extractJsonFromString(input: string): string {
    // Regular expression to match JSON-like structures
    const jsonRegex = /{[^]*}/; // Matches the first occurrence of a JSON object
    const match = input.match(jsonRegex);

    if (match) {
        // If a match is found, return the matched JSON string
        return match[0];
    }

    // If no JSON-like structure is found, return an empty string or handle as needed
    return '';
}

export async function POST(request: Request) {
    try {
        const body: ParseRequest = await request.json();
        const { email, targetSchema } = body;

        // First LLM call: Extract data into a logical schema
        const extractionResponse = await openai.chat.completions.create({
            model: "gpt-4o",  // Using GPT-4 as example, replace with your model
            messages: [
                {
                    role: "system",
                    content: `
                    You are a data extraction expert. Extract structured data from the email into a logical JSON schema. 
                    Create appropriate fields based on the content. Please return the mapped data in JSON format. Begin with { and end with }.
                    
                    ## OUTPUT FORMAT
                    Respond only with a JSON object. DO NOT INCLUDE THE WORD JSON.`
                },
                {
                    role: "user",
                    content: email
                }
            ],
        });

        const content = extractionResponse.choices[0].message.content;

        // Use the extractJsonFromString function to get the JSON part
        const extractedJson = extractJsonFromString(content);
        const extractedData = extractedJson ? JSON.parse(extractedJson) : {};

        // Continue with your logic using extractedData
        const user_prompt_mapping = `
        Extracted data: ${JSON.stringify(extractedData)}
        Target schema: ${targetSchema}
        
        Please map the extracted data to match the target schema structure. 
        Please return the mapped data in JSON format. Begin with { and end with }.
        
        ## OUTPUT FORMAT
        Respond only with a JSON object. DO NOT INCLUDE THE WORD JSON.`
        
        // Second LLM call: Map to target schema
        const mappingResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "Map the extracted data to the target schema. Ensure all required fields are populated appropriately."
                },
                {
                    role: "user",
                    content: user_prompt_mapping
                }
            ],
        });

        const mappingContent = mappingResponse.choices[0].message.content;

        // Use the extractJsonFromString function to get the JSON part
        const mappedJson = extractJsonFromString(mappingContent);
        const mappedData = mappedJson ? JSON.parse(mappedJson) : {};

        // Save to database
        await appendToFile(mappedData);

        const response: ParseResponse = {
            extractedData,
            mappedData
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        );
    }
}