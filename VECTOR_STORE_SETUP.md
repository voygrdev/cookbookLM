# Vector Store Setup Guide - COMPLETED ✅

**Status**: Implementation completed successfully! The vector store is now integrated with Ollama embeddings and Supabase with intelligent text chunking.

**Latest Update**: Added automatic text chunking to handle large documents that exceed embedding model context limits.

This guide explains how to set up and use Ollama embeddings with Supabase vector store in your CookbookLM project.

## Prerequisites

1. **Ollama installed and running** on `http://localhost:11434`
2. **Supabase project** with pgvector extension enabled
3. **nomic-embed-text model** pulled in Ollama

## Setup Steps

### 1. Install Ollama and Pull the Model

```bash
# Install Ollama (if not already installed)
curl -fsSL https://ollama.ai/install.sh | sh

# Pull the nomic-embed-text model
ollama pull nomic-embed-text
```

### 2. Run the Database Migration

Apply the migration to create the documents table and search function:

```bash
cd infrastructure/supabase
supabase db push
```

Or manually run the migration in your Supabase SQL editor:

```sql
-- See: migrations/20250803000000_create_documents_table.sql
```

### 3. Environment Variables

Make sure your `.env.local` file includes:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Other required variables
GROQ_API_KEY=your_groq_api_key
DEVELOPMENT_URL=http://localhost:3000
```

## Usage

### Processing PDFs with Vector Storage

The `processPDF` function now requires a `notebookId` parameter:

```typescript
import { processPDF } from "@/actions/processpdf/actions";

// When processing PDFs, pass the notebook ID
const result = await processPDF(formData, notebookId);
```

### Searching Vectors

Use the search function to find relevant content:

```typescript
import { SearchVectorsInNotebook } from "@/tools/vectorStore";

// Search for relevant content in a specific notebook
const searchResults = await SearchVectorsInNotebook(
  "query text here",
  "notebook-uuid-here",
  10 // max results
);
```

### Direct Vector Storage

You can also store vectors directly:

```typescript
import { StoreVectorsInSupabase } from "@/tools/vectorStore";

const combinedContent = JSON.stringify([
  {
    filename: "document.pdf",
    content: "document content here",
    status: "processed",
  },
]);

const result = await StoreVectorsInSupabase(combinedContent, notebookId);
```

## Intelligent Text Chunking 🔧

**Problem Solved**: The system now automatically handles large documents that exceed the embedding model's context limit.

### How Chunking Works

1. **Automatic Splitting**: Large documents are split into smaller chunks (1000 characters by default)
2. **Context Preservation**: 200-character overlap between chunks maintains context
3. **Smart Boundaries**: Splits occur at natural break points (paragraphs, sentences, etc.)
4. **Batch Processing**: Chunks are processed in batches to avoid overwhelming the embedding service

### Chunking Configuration

```typescript
export const CHUNKING_CONFIG = {
  chunkSize: 1000, // Maximum characters per chunk
  chunkOverlap: 200, // Overlap between chunks
  minChunkSize: 50, // Minimum characters for valid chunk
  batchSize: 10, // Chunks processed per batch
  batchDelay: 500, // Milliseconds between batches
};
```

### Chunked Document Metadata

Each chunk includes additional metadata:

```json
{
  "notebookId": "notebook-uuid",
  "filename": "document.pdf",
  "chunkIndex": 0, // Position of this chunk
  "totalChunks": 5, // Total chunks for this document
  "chunkSize": 987, // Actual size of this chunk
  "documentIndex": 0 // Original document index
}
```

## Vector Store Schema

The documents are stored with the following metadata:

```json
{
  "notebookId": "notebook-uuid",
  "filename": "document.pdf",
  "status": "processed",
  "uploadStatus": "uploaded",
  "uploadPath": "path/to/file",
  "documentIndex": 0,
  "createdAt": "2025-08-03T12:00:00.000Z"
}
```

## Features

- **Semantic Search**: Find relevant content using natural language queries
- **Notebook Isolation**: Vectors are filtered by notebook ID
- **Metadata Filtering**: Rich metadata for each document chunk
- **Similarity Scoring**: Results include similarity scores
- **Error Handling**: Robust error handling and logging

## Troubleshooting

### Common Issues

1. **Ollama not running**: Make sure Ollama is running on port 11434
2. **Model not found**: Pull the nomic-embed-text model with `ollama pull nomic-embed-text`
3. **Supabase connection**: Check your environment variables and database connection
4. **pgvector extension**: Ensure the pgvector extension is enabled in your Supabase project

### Debugging

Enable debug logging by checking the browser console and server logs for:

- Vector storage results
- Embedding generation status
- Search query results

## Performance Considerations

- The nomic-embed-text model creates 768-dimensional embeddings
- Consider chunking large documents for better search results
- Use appropriate similarity thresholds for your use case
- Monitor Supabase usage for large document collections
