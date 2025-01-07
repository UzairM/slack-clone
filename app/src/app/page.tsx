import { MessageCard } from '@/components/ui/message-card';

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <span className="message-timestamp">#</span>
            general
          </h1>
          <p className="message-timestamp mt-1 text-[15px]">
            This channel is for team-wide communication and announcements. All team members are in
            this channel.
          </p>
        </div>

        {/* Messages Section */}
        <div className="space-y-0.5">
          <MessageCard
            avatar="https://github.com/shadcn.png"
            username="Sarah Johnson"
            timestamp="12:30 PM"
            content="Hey team! Just pushed the latest updates to the main branch. Please review when you get a chance! 🚀"
            replies={3}
            reactions={5}
          />

          <MessageCard
            avatar="https://github.com/shadcn.png"
            username="Mike Chen"
            timestamp="12:32 PM"
            content="Thanks for the update! I'll take a look at it right away."
            reactions={2}
          />

          <MessageCard
            avatar="https://github.com/shadcn.png"
            username="Alex Turner"
            timestamp="12:35 PM"
            content="Great work! The new features look amazing. I especially like the improved navigation system."
            replies={1}
            reactions={7}
          />
        </div>

        {/* Input Area */}
        <div className="mt-6 sticky bottom-4">
          <div className="container-card">
            <div className="flex items-center gap-2">
              <input type="text" placeholder="Message #general" className="input-primary flex-1" />
              <button className="button-primary">Send</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
