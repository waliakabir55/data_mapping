import { promises as fs } from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'data.jsonl');

export async function appendToFile(data: any) {
    const jsonLine = JSON.stringify(data) + '\n';
    await fs.appendFile(DB_FILE, jsonLine, 'utf8');
}