export async function POST() {
  return Response.json(
    {
      error:
        'Deprecated route. This client now runs local-first and calls providers directly from the app.',
    },
    { status: 410 }
  );
}
