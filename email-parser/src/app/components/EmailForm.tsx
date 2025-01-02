"use client";

import React, { useState } from 'react';
// useState is a hook that allows us to manage state in a functional component. 
// It returns an array with two elements: the current state value and a function that updates the state.
// Here is an example of how to use useState:
// const [count, setCount] = useState(0);
// This creates a state variable called count and a function called setCount that allows us to update the state.
// The initial state is 0.
// We can use the setCount function to update the state.
// For example, we can call setCount(1) to update the state to 1.
// We can also use the setCount function to update the state based on the previous state.
// For example, we can call setCount(prevCount => prevCount + 1) to update the state to the previous state plus 1.

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

const SAMPLE_TARGET_SCHEMA = {
    id: "string",
    date: "string",
    subject: "string",
    category: "string",
    priority: "number",
    actionItems: "string[]"
};

export default function EmailForm() {
    const [email, setEmail] = useState('');
    const [targetSchema, setTargetSchema] = useState(JSON.stringify(SAMPLE_TARGET_SCHEMA, null, 2));
    // add a print statement to the console
    console.log('Json done');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        
        try {
            const response = await fetch('/api/parse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, targetSchema }),
            });
            
            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-2">Email Content:</label>
                    <textarea 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-40 p-2 border rounded"
                    />
                </div>
                
                <div className="flex space-x-2">
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

                <div>
                    <label className="block mb-2">Target JSON Schema:</label>
                    <textarea 
                        value={targetSchema}
                        onChange={(e) => setTargetSchema(e.target.value)}
                        className="w-full h-40 p-2 border rounded font-mono"
                    />
                </div>

                <button 
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-500 text-white rounded"
                >
                    {loading ? 'Processing...' : 'Map Data'}
                </button>
            </form>

            {result && (
                <div className="mt-8">
                    <h3 className="text-lg font-bold">Results:</h3>
                    <div className="mt-4 space-y-4">
                        <div>
                            <h4 className="font-bold">Extracted Schema:</h4>
                            <pre className="bg-gray-100 p-4 rounded">
                                {JSON.stringify(result.extractedData, null, 2)}
                            </pre>
                        </div>
                        <div>
                            <h4 className="font-bold">Mapped to Target Schema:</h4>
                            <pre className="bg-gray-100 p-4 rounded">
                                {JSON.stringify(result.mappedData, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}