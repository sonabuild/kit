/**
 * Route Discovery Example
 *
 * This example shows how to fetch and display available routes from the /meta endpoint.
 */

import { Sona } from '@sonabuild/kit';

async function main() {
  const baseUrl = 'https://api.sona.build';
  const apiKey = process.env.SONA_API_KEY; // Optional

  // Fetch available routes from /meta endpoint
  const response = await fetch(`${baseUrl}/meta`, {
    headers: apiKey ? { 'x-api-key': apiKey } : {}
  });

  const meta = await response.json();

  console.log('Available routes:\n');

  // Display all available protocol actions
  Object.entries(meta.routes).forEach(([route, info]) => {
    const [protocol, action] = route.split('/').filter(Boolean);
    const attestedLabel = info.attested ? '🔒 attested' : '📝 plain';

    console.log(`  ${protocol}.${action}() - ${attestedLabel}`);
  });

  console.log('\nUsage example:');
  console.log('  const sona = new Sona({ wallet: "..." });');

  // Show first route as example
  const firstRoute = Object.keys(meta.routes)[0];
  if (firstRoute) {
    const [protocol, action] = firstRoute.split('/').filter(Boolean);
    console.log(`  const intent = await sona.${protocol}.${action}({ ... });`);
  }
}

main();
