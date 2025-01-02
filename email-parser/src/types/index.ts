export interface ParseRequest {
    email: string;
    targetSchema: string;
}

export interface ParseResponse {
    extractedData: any;
    mappedData: any;
}