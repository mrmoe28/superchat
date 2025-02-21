# Text Generation and Streaming Guide

## Overview

Large Language Models (LLMs) can generate text in response to prompts, with capabilities ranging from recipe creation to email drafting and document summarization. The AI SDK Core provides two main functions for text generation:

- `generateText`: For non-streaming text generation
- `streamText`: For real-time text streaming

## Text Generation

### Basic Usage with `generateText`

```typescript
import { generateText } from 'ai';

const { text } = await generateText({
  model: yourModel,
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
```

### Advanced Prompting

```typescript
import { generateText } from 'ai';

const { text } = await generateText({
  model: yourModel,
  system: 'You are a professional writer. You write simple, clear, and concise content.',
  prompt: `Summarize the following article in 3-5 sentences: ${article}`,
});
```

### Result Properties

The `generateText` function returns an object with several promises:

- `result.text`: The generated text
- `result.reasoning`: Model's reasoning (model-dependent)
- `result.sources`: Used input sources (model-dependent)
- `result.finishReason`: Generation completion reason
- `result.usage`: Model usage statistics

## Text Streaming

### Basic Streaming with `streamText`

```typescript
import { streamText } from 'ai';

const result = streamText({
  model: yourModel,
  prompt: 'Invent a new holiday and describe its traditions.',
});

// Use textStream as an async iterable
for await (const textPart of result.textStream) {
  console.log(textPart);
}
```

### Helper Functions

`streamText` provides several helper functions for integration:

- `result.toDataStreamResponse()`: Creates data stream HTTP response
- `result.pipeDataStreamToResponse()`: Writes data stream to Node.js response
- `result.toTextStreamResponse()`: Creates text stream HTTP response
- `result.pipeTextStreamToResponse()`: Writes text to Node.js response

### Error Handling

```typescript
try {
  const result = await streamText({
    model: yourModel,
    prompt: 'Generate some text',
  });
  // Handle the result
} catch (error) {
  console.error('Error during text generation:', error);
}
```

### Chunk Processing

```typescript
const result = streamText({
  model: yourModel,
  prompt: 'Invent a new holiday and describe its traditions.',
  onChunk({ chunk }) {
    if (chunk.type === 'text-delta') {
      console.log(chunk.text);
    }
  },
});
```

### Stream Completion Handling

```typescript
const result = streamText({
  model: yourModel,
  prompt: 'Invent a new holiday and describe its traditions.',
  onFinish({ text, finishReason, usage, response }) {
    const messages = response.messages;
    // Handle completion logic
  },
});
```

## Advanced Features

### Full Stream Processing

```typescript
import { streamText } from 'ai';
import { z } from 'zod';

const result = streamText({
  model: yourModel,
  tools: {
    cityAttractions: {
      parameters: z.object({ city: z.string() }),
      execute: async ({ city }) => ({
        attractions: ['attraction1', 'attraction2', 'attraction3'],
      }),
    },
  },
  prompt: 'What are some San Francisco tourist attractions?',
});

for await (const part of result.fullStream) {
  switch (part.type) {
    case 'text-delta':
      // Handle text updates
      break;
    case 'reasoning':
      // Handle reasoning
      break;
    case 'source':
      // Handle sources
      break;
    case 'tool-call':
      // Handle tool calls
      break;
    case 'tool-result':
      // Handle tool results
      break;
    case 'finish':
      // Handle completion
      break;
    case 'error':
      // Handle errors
      break;
  }
}
```

### Stream Transformation

```typescript
import { smoothStream, streamText } from 'ai';

// Using built-in smooth stream
const result = streamText({
  model,
  prompt,
  experimental_transform: smoothStream(),
});

// Custom transformation
const upperCaseTransform = <TOOLS extends ToolSet>() =>
  (options: { tools: TOOLS; stopStream: () => void }) =>
    new TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>({
      transform(chunk, controller) {
        controller.enqueue(
          chunk.type === 'text-delta'
            ? { ...chunk, textDelta: chunk.textDelta.toUpperCase() }
            : chunk,
        );
      },
    });
```

## Long Text Generation

```typescript
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const { text, usage } = await generateText({
  model: openai('gpt-4o'),
  maxSteps: 5,
  experimental_continueSteps: true,
  prompt: 'Write a book about Roman history...',
});
```

### Key Considerations for Long Text

- Models have output limits shorter than context windows
- Use `experimental_continueSteps` for multi-step generation
- Only full words are streamed in `streamText`
- Consider using system messages to control generation length

## Resources

- [Node.js Text Generation Example](https://sdk.vercel.ai/docs/guides/generators/node)
- [Next.js Route Handlers Example](https://sdk.vercel.ai/docs/guides/generators/nextjs-route)
- [Next.js Server Actions Example](https://sdk.vercel.ai/docs/guides/generators/nextjs-rsc)
- [Node.js Streaming Example](https://sdk.vercel.ai/docs/guides/streaming/node)
- [Next.js Streaming Examples](https://sdk.vercel.ai/docs/guides/streaming/nextjs)
