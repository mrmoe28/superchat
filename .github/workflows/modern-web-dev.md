# Modern Web Development Best Practices

## React and TypeScript Patterns

### Functional Components

```typescript
// Preferred pattern for React components
const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  return (
    <div>
      {/* Component content */}
    </div>
  );
};
```

### Custom Hooks

```typescript
// Reusable logic pattern
const useCustomHook = (initialValue: string) => {
  const [value, setValue] = useState(initialValue);
  
  useEffect(() => {
    // Effect logic
  }, [value]);
  
  return { value, setValue };
};
```

### State Management

```typescript
// Using context for global state
const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState(initialState);
  
  return (
    <AppContext.Provider value={{ state, setState }}>
      {children}
    </AppContext.Provider>
  );
};
```

## Modern UI Patterns

### Responsive Design

```typescript
// Tailwind CSS responsive classes
const ResponsiveComponent = () => {
  return (
    <div className="w-full md:w-1/2 lg:w-1/3 p-4">
      <h1 className="text-2xl md:text-3xl lg:text-4xl">
        Responsive Title
      </h1>
    </div>
  );
};
```

### Animation and Transitions

```typescript
// Framer Motion animations
import { motion } from 'framer-motion';

const AnimatedComponent = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      Animated Content
    </motion.div>
  );
};
```

### Form Handling

```typescript
// React Hook Form with validation
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const FormComponent = () => {
  const { register, handleSubmit } = useForm();
  
  const onSubmit = (data: FormData) => {
    // Handle form submission
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      <input type="password" {...register('password')} />
      <button type="submit">Submit</button>
    </form>
  );
};
```

## API Integration

### Data Fetching

```typescript
// Using SWR for data fetching
import useSWR from 'swr';

const DataComponent = () => {
  const { data, error } = useSWR('/api/data', fetcher);
  
  if (error) return <div>Error loading data</div>;
  if (!data) return <div>Loading...</div>;
  
  return <div>{data.map(item => <div key={item.id}>{item.name}</div>)}</div>;
};
```

### API Routes

```typescript
// Next.js API route
export async function GET(request: Request) {
  try {
    const data = await fetchData();
    return Response.json({ data });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
```

## Performance Optimization

### Code Splitting

```typescript
// Dynamic imports
const DynamicComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false,
});
```

### Memoization

```typescript
// Using useMemo and useCallback
const MemoizedComponent = () => {
  const expensiveValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
  
  const memoizedCallback = useCallback(
    () => {
      doSomething(expensiveValue);
    },
    [expensiveValue],
  );
  
  return <ChildComponent callback={memoizedCallback} />;
};
```

## Testing

### Component Testing

```typescript
// Using React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
  
  it('handles user interaction', () => {
    render(<Component />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

## Error Handling

### Error Boundaries

```typescript
class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logErrorToService(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <div>Something went wrong</div>;
    }
    
    return this.props.children;
  }
}
```

## Accessibility

### ARIA Attributes

```typescript
const AccessibleComponent = () => {
  return (
    <button
      aria-label="Close menu"
      aria-expanded={isOpen}
      onClick={handleClose}
    >
      <span className="sr-only">Close</span>
      <Icon />
    </button>
  );
};
```

## Security

### XSS Prevention

```typescript
// Using DOMPurify for sanitization
import DOMPurify from 'dompurify';

const SafeHTML = ({ html }: { html: string }) => {
  return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
};
```

## Build and Deployment

### Environment Variables

```typescript
// Next.js environment variables
const apiKey = process.env.NEXT_PUBLIC_API_KEY;
const apiSecret = process.env.API_SECRET;
```

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

## Code Organization

### Feature-based Structure

```
src/
  features/
    auth/
      components/
      hooks/
      api/
      types.ts
      utils.ts
    users/
      components/
      hooks/
      api/
      types.ts
      utils.ts
  shared/
    components/
    hooks/
    utils/
  pages/
  styles/
```

These patterns and practices should be used as a foundation for building modern, scalable, and maintainable web applications.
