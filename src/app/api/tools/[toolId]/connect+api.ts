export async function POST() {
  return Response.json(
    {
      error:
        'Deprecated route. Tool OAuth backends are disabled in local-first mode.',
    },
    { status: 410 }
  );
}
