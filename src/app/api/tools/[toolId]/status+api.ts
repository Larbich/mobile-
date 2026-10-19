export async function GET() {
  return Response.json(
    {
      error:
        'Deprecated route. Tool OAuth backends are disabled in local-first mode.',
    },
    { status: 410 }
  );
}
