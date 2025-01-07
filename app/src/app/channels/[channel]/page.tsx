import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Props {
  params: {
    channel: string;
  };
}

export default function ChannelPage({ params }: Props) {
  // Simulate channel validation
  const validChannels = ['general', 'random', 'introductions'];
  if (!validChannels.includes(params.channel)) {
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
          <h1 className="text-2xl font-bold">#{params.channel}</h1>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <h2 className="font-medium mb-2">Dynamic Route Information</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Current channel: {params.channel}</li>
            <li>• Route: /channels/[channel]</li>
            <li>• Valid channels: {validChannels.join(', ')}</li>
            <li>• Invalid channels will show 404 page</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
