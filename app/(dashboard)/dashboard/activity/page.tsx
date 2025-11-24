import ActivityPageClient from './client-page';

export default function ActivityPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-foreground mb-6">
        Activity Log
      </h1>
      <ActivityPageClient />
    </section>
  );
}