# OpenAI o1 Series Documentation

## Introduction
With the release of OpenAI's o1 series models, there has never been a better time to start building AI applications, particularly those that require complex reasoning capabilities.

The AI SDK is a powerful TypeScript toolkit for building AI applications with large language models (LLMs) like OpenAI o1 alongside popular frameworks like React, Next.js, Vue, Svelte, Node.js, and more.

## OpenAI o1 Models
OpenAI released a series of AI models designed to spend more time thinking before responding. They can reason through complex tasks and solve harder problems than previous models in science, coding, and math. These models, named the o1 series, are trained with reinforcement learning and can "think before they answer". As a result, they are able to produce a long internal chain of thought before responding to a prompt.

### Available Models
There are three reasoning models available in the API:

1. **o1**: Designed to reason about hard problems using broad general knowledge about the world.
2. **o1-preview**: The original preview version of o1 - slower than o1 but supports streaming.
3. **o1-mini**: A faster and cheaper version of o1, particularly adept at coding, math, and science tasks where extensive general knowledge isn't required. o1-mini supports streaming.

### Model Capabilities
| Model | Streaming | Tools | Object Generation | Reasoning Effort |
|-------|-----------|-------|-------------------|------------------|
| o1 | ✓ | ✓ | ✓ | ✓ |
| o1-preview | ✓ | ✗ | ✗ | ✗ |
| o1-mini | ✓ | ✗ | ✗ | ✗ |

### Benchmarks
OpenAI o1 models excel in scientific reasoning, with impressive performance across various domains:

- Ranking in the 89th percentile on competitive programming questions (Codeforces)
- Placing among the top 500 students in the US in a qualifier for the USA Math Olympiad (AIME)
- Exceeding human PhD-level accuracy on a benchmark of physics, biology, and chemistry problems (GPQA)

## Prompt Engineering for o1 Models
The o1 models perform best with straightforward prompts. Some prompt engineering techniques, like few-shot prompting or instructing the model to "think step by step," may not enhance performance and can sometimes hinder it.

### Best Practices
1. Keep prompts simple and direct: The models excel at understanding and responding to brief, clear instructions without the need for extensive guidance.
2. Avoid chain-of-thought prompts: Since these models perform reasoning internally, prompting them to "think step by step" or "explain your reasoning" is unnecessary.
3. Use delimiters for clarity: Use delimiters like triple quotation marks, XML tags, or section titles to clearly indicate distinct parts of the input.
4. Limit additional context in RAG: When providing additional context or documents, include only the most relevant information.

## Getting Started with the AI SDK

### Basic Usage
```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const { text } = await generateText({
  model: openai('o1-mini'),
  prompt: 'Explain the concept of quantum entanglement.',
});
```

### Refining Reasoning Effort
```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const { text } = await generateText({
  model: openai('o1'),
  prompt: 'Explain quantum entanglement briefly.',
  providerOptions: {
    openai: { reasoningEffort: 'low' },
  },
});
```

### Generating Structured Data
```typescript
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const { object } = await generateObject({
  model: openai('o1'),
  schema: z.object({
    recipe: z.object({
      name: z.string(),
      ingredients: z.array(z.object({ name: z.string(), amount: z.string() })),
      steps: z.array(z.string()),
    }),
  }),
  prompt: 'Generate a lasagna recipe.',
});
```

### Using Tools
```typescript
import { generateText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';

const { text } = await generateText({
  model: openai('o1'),
  prompt: 'What is the weather like today?',
  tools: {
    getWeather: tool({
      description: 'Get the weather in a location',
      parameters: z.object({
        location: z.string().describe('The location to get the weather for'),
      }),
      execute: async ({ location }) => ({
        location,
        temperature: 72 + Math.floor(Math.random() * 21) - 10,
      }),
    }),
  },
});
```

## Building Interactive Interfaces

### Chat Interface Example
```typescript
// app/api/chat/route.ts
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('o1-mini'),
    messages,
  });

  return result.toDataStreamResponse();
}

// app/page.tsx
'use client';

import { useChat } from '@ai-sdk/react';

export default function Page() {
  const { messages, input, handleInputChange, handleSubmit, error } = useChat();

  return (
    <>
      {messages.map(message => (
        <div key={message.id}>
          {message.role === 'user' ? 'User: ' : 'AI: '}
          {message.content}
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <input name="prompt" value={input} onChange={handleInputChange} />
        <button type="submit">Submit</button>
      </form>
    </>
  );
}
```

## Resources
- Documentation: [sdk.vercel.ai/docs](https://sdk.vercel.ai/docs)
- Examples: [sdk.vercel.ai/examples](https://sdk.vercel.ai/examples)
- Advanced Guides: [sdk.vercel.ai/docs/guides](https://sdk.vercel.ai/docs/guides)
- AI Templates: [vercel.com/templates?type=ai](https://vercel.com/templates?type=ai) 