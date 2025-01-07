'use client';

import { trpc } from '@/lib/trpc/client';
import { type AppRouter } from '@/server/api/root';
import { type TRPCClientErrorLike } from '@trpc/client';
import { useState } from 'react';

// Type guard for custom error data
function hasCustomErrorData(error: unknown): error is { type: string; details: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'details' in error &&
    typeof (error as any).type === 'string' &&
    typeof (error as any).details === 'string'
  );
}

// Type guard for rate limit error data
function hasRateLimitData(error: unknown): error is {
  retryAfter: number;
  limit: number;
  timeWindow: string;
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'retryAfter' in error &&
    'limit' in error &&
    'timeWindow' in error &&
    typeof (error as any).retryAfter === 'number' &&
    typeof (error as any).limit === 'number' &&
    typeof (error as any).timeWindow === 'string'
  );
}

export function ErrorTest() {
  const [error, setError] = useState<string | null>(null);

  // Test validation error
  const validateMutation = trpc.test.validateInput.useMutation({
    onError: (err: TRPCClientErrorLike<AppRouter>) => setError(err.message),
  });

  const testValidation = () => {
    validateMutation.mutate({
      email: 'invalid-email',
      age: 16,
      username: 'u$er',
    });
  };

  // Test unauthorized error
  const unauthorized = trpc.test.unauthorized.useQuery(undefined, {
    enabled: false,
    retry: false,
    onError: (err: TRPCClientErrorLike<AppRouter>) => setError(err.message),
  });

  // Test not found error
  const notFound = trpc.test.notFound.useQuery('123', {
    enabled: false,
    retry: false,
    onError: (err: TRPCClientErrorLike<AppRouter>) => setError(err.message),
  });

  // Test server error
  const serverError = trpc.test.serverError.useQuery(undefined, {
    enabled: false,
    retry: false,
    onError: (err: TRPCClientErrorLike<AppRouter>) => setError(err.message),
  });

  // Test custom error
  const customError = trpc.test.customError.useMutation({
    onError: (err: TRPCClientErrorLike<AppRouter>) => {
      const errorData = err.data;
      if (hasCustomErrorData(errorData)) {
        setError(`${err.message}\nType: ${errorData.type}\nDetails: ${errorData.details}`);
      } else {
        setError(err.message);
      }
    },
  });

  // Test timeout error
  const timeout = trpc.test.timeout.useQuery(undefined, {
    enabled: false,
    retry: false,
    onError: (err: TRPCClientErrorLike<AppRouter>) => setError(err.message),
  });

  // Test rate limit error
  const rateLimit = trpc.test.rateLimited.useMutation({
    onError: (err: TRPCClientErrorLike<AppRouter>) => {
      const errorData = err.data;
      if (hasRateLimitData(errorData)) {
        setError(
          `${err.message}\nRetry after: ${errorData.retryAfter} seconds\nLimit: ${errorData.limit} requests per ${errorData.timeWindow}`
        );
      } else {
        setError(err.message);
      }
    },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">tRPC Error Handling Test</h2>

      {/* Test Buttons */}
      <div className="grid gap-4 md:grid-cols-2">
        <button
          onClick={testValidation}
          className="button-primary"
          disabled={validateMutation.isLoading}
        >
          Test Validation Error
        </button>

        <button
          onClick={() => unauthorized.refetch()}
          className="button-primary"
          disabled={unauthorized.isFetching}
        >
          Test Unauthorized Error
        </button>

        <button
          onClick={() => notFound.refetch()}
          className="button-primary"
          disabled={notFound.isFetching}
        >
          Test Not Found Error
        </button>

        <button
          onClick={() => serverError.refetch()}
          className="button-primary"
          disabled={serverError.isFetching}
        >
          Test Server Error
        </button>

        <button
          onClick={() => customError.mutate({ type: 'test-error' })}
          className="button-primary"
          disabled={customError.isLoading}
        >
          Test Custom Error
        </button>

        <button
          onClick={() => timeout.refetch()}
          className="button-primary"
          disabled={timeout.isFetching}
        >
          Test Timeout Error
        </button>

        <button
          onClick={() => rateLimit.mutate()}
          className="button-primary"
          disabled={rateLimit.isLoading}
        >
          Test Rate Limit Error
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          <p className="text-sm font-medium">Error:</p>
          <pre className="text-sm whitespace-pre-wrap mt-2">{error}</pre>
        </div>
      )}
    </div>
  );
}
