// api/commit-story.js
export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  return new Response(
    JSON.stringify({ message: 'Commit story API' }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
