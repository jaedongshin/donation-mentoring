export async function POST(request: Request) {
  return new Response(JSON.stringify({ message: 'Sync initiated' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
