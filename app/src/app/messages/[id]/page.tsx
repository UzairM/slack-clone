import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Props {
  params: {
    id: string;
  };
}

export default function MessagePage({ params }: Props) {
  // Simulate message validation
  const messageId = parseInt(params.id);
  if (isNaN(messageId) || messageId < 1 || messageId > 1000) {
    notFound();
  }

  return (
    <div className="container py-10">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/route-test"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to route test
          </Link>
          <h1 className="text-2xl font-bold">Message #{params.id}</h1>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <h2 className="font-medium mb-2">Dynamic Route Information</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Current message ID: {params.id}</li>
            <li>• Route: /messages/[id]</li>
            <li>• Valid IDs: 1-1000</li>
            <li>• Invalid IDs will show 404 page</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
