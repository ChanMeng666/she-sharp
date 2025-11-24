export default function ArchivedEventsPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Past Events</h1>
          <p className="text-muted-foreground mt-2">
            View and manage archived events
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-muted-foreground">Past events archive coming soon...</p>
      </div>
    </div>
  );
}