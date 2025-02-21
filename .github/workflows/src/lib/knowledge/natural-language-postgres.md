# Natural Language Postgres Guide

## Overview
This guide demonstrates how to build an application that uses AI to interact with a PostgreSQL database using natural language. The application enables users to:
- Generate SQL queries from natural language input
- Explain query components in plain English
- Create charts to visualize query results

## Project Stack
- Next.js (App Router)
- AI SDK
- OpenAI
- Zod
- Postgres with Vercel Postgres
- shadcn-ui and TailwindCSS for styling
- Recharts for data visualization

## Project Setup

### Initial Setup
```bash
git clone https://github.com/vercel-labs/natural-language-postgres
cd natural-language-postgres
git checkout starter
pnpm install
```

### Environment Configuration
```bash
# Copy example environment variables
cp .env.example .env

# Required environment variables
OPENAI_API_KEY="your_api_key_here"
POSTGRES_URL="..."
POSTGRES_PRISMA_URL="..."
POSTGRES_URL_NO_SSL="..."
POSTGRES_URL_NON_POOLING="..."
POSTGRES_USER="..."
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="..."
```

### Dataset Setup
The project uses CB Insights' Unicorn Companies dataset, which includes:
- Company name
- Valuation
- Date joined (unicorn status)
- Country
- City
- Industry
- Select investors

To set up the dataset:
1. Download from [CB Insights Unicorn Companies](https://www.cbinsights.com/research-unicorn-companies)
2. Save as `unicorns.csv` in project root
3. Run `pnpm run seed` to initialize database

## Project Structure
```
├── app/
│   ├── actions.ts           # Server actions for AI/DB operations
│   ├── api/                 # API routes
│   └── page.tsx            # Main interface
├── components/
│   ├── header.tsx          # Application header
│   ├── search.tsx          # Search input and button
│   ├── suggested-queries.tsx # Example queries
│   ├── query-viewer.tsx    # SQL query display
│   └── results.tsx         # Query results display
├── lib/
│   ├── seed.ts             # Database seed script
│   └── types.ts            # Type definitions
```

## Implementation Guide

### 1. SQL Query Generation

#### System Prompt
```typescript
const systemPrompt = `
You are a SQL (postgres) and data visualization expert. Your job is to help the user write a SQL query to retrieve the data they need. The table schema is as follows:

unicorns (
  id SERIAL PRIMARY KEY,
  company VARCHAR(255) NOT NULL UNIQUE,
  valuation DECIMAL(10, 2) NOT NULL,
  date_joined DATE,
  country VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  industry VARCHAR(255) NOT NULL,
  select_investors TEXT NOT NULL
);

Only retrieval queries are allowed.

For things like industry, company names and other string fields, use the ILIKE operator and convert both the search term and the field to lowercase using LOWER() function.

Note: select_investors is a comma-separated list of investors.
When answering questions about a specific field, ensure you are selecting the identifying column.
The industries available are:
- healthcare & life sciences
- consumer & retail
- financial services
- enterprise tech
- insurance
- media & entertainment
- industrials
- health

EVERY QUERY SHOULD RETURN QUANTITATIVE DATA THAT CAN BE PLOTTED ON A CHART!
`;
```

#### Server Action Implementation
```typescript
// app/actions.ts
export const generateQuery = async (input: string) => {
  'use server';
  try {
    const result = await generateObject({
      model: openai('gpt-4o'),
      system: systemPrompt,
      prompt: `Generate the query necessary to retrieve the data the user wants: ${input}`,
      schema: z.object({
        query: z.string(),
      }),
    });
    return result.object.query;
  } catch (e) {
    console.error(e);
    throw new Error('Failed to generate query');
  }
};
```

### 2. Query Explanation

#### Explanation Schema
```typescript
// lib/types.ts
export const explanationSchema = z.object({
  section: z.string(),
  explanation: z.string(),
});

export type QueryExplanation = z.infer<typeof explanationSchema>;
```

#### Server Action Implementation
```typescript
// app/actions.ts
export const explainQuery = async (input: string, sqlQuery: string) => {
  'use server';
  try {
    const result = await generateObject({
      model: openai('gpt-4o'),
      system: `You are a SQL (postgres) expert...`,
      prompt: `Explain the SQL query you generated to retrieve the data the user wanted...`,
      schema: explanationSchema,
      output: 'array',
    });
    return result.object;
  } catch (e) {
    console.error(e);
    throw new Error('Failed to generate query');
  }
};
```

### 3. Chart Visualization

#### Chart Configuration Schema
```typescript
// lib/types.ts
export const configSchema = z.object({
  description: z.string(),
  takeaway: z.string(),
  type: z.enum(['bar', 'line', 'area', 'pie']),
  title: z.string(),
  xKey: z.string(),
  yKeys: z.array(z.string()),
  multipleLines: z.boolean().optional(),
  measurementColumn: z.string().optional(),
  lineCategories: z.array(z.string()).optional(),
  colors: z.record(z.string(), z.string()).optional(),
  legend: z.boolean(),
});

export type Config = z.infer<typeof configSchema>;
```

#### Server Action Implementation
```typescript
// app/actions.ts
export const generateChartConfig = async (
  results: Result[],
  userQuery: string,
) => {
  'use server';
  try {
    const { object: config } = await generateObject({
      model: openai('gpt-4o'),
      system: 'You are a data visualization expert.',
      prompt: `Given the following data from a SQL query result, generate the chart config...`,
      schema: configSchema,
    });

    const colors: Record<string, string> = {};
    config.yKeys.forEach((key, index) => {
      colors[key] = `hsl(var(--chart-${index + 1}))`;
    });

    return { config: { ...config, colors } };
  } catch (e) {
    console.error(e);
    throw new Error('Failed to generate chart suggestion');
  }
};
```

## Usage Example

```typescript
// app/page.tsx
const handleSubmit = async (suggestion?: string) => {
  const question = suggestion ?? inputValue;
  
  // Generate SQL query
  const query = await generateQuery(question);
  
  // Execute query
  const results = await runGeneratedSQLQuery(query);
  
  // Generate chart configuration
  const { config } = await generateChartConfig(results, question);
  
  // Update UI
  setResults(results);
  setChartConfig(config);
};
```

## Resources
- [Project Demo](https://natural-language-postgres.vercel.app)
- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [AI SDK Documentation](https://sdk.vercel.ai/docs)
- [CB Insights Dataset](https://www.cbinsights.com/research-unicorn-companies) 