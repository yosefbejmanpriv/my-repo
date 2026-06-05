export default async function handler(request, context) {
  const url = new URL(request.url);
  const parts = url.pathname.split('/');
  const dealSlug = parts[parts.length - 1] || parts[parts.length - 2];

  const SUPABASE_URL = 'https://pxeeecaveqrhldoblbtm.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4ZWVlY2F2ZXFyaGxkb2JsYnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MTM4MjYsImV4cCI6MjA5NjA4OTgyNn0.OPdlQGurMfYZzjFaQU6-n-K4TygG0QfkwDbQ9diQT4s';

  function slug(title) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  let deal = null;
  try {
    const res = await fetch(SUPABASE_URL + '/rest/v1/deals?order=created_at.desc', {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY
      }
    });
    const deals = await res.json();
    deal = deals.find(d => slug(d.title) === dealSlug);
  } catch(e) {}

  // Get the original deal.html
  const response = await context.next();
  const html = await response.text();

  if (!deal) return new Response(html, { headers: { 'content-type': 'text/html' } });

  const title = deal.title + ' – Only $' + deal.price + ' (Was $' + deal.original + ') | YB Deals';
  const desc = 'Save $' + (deal.original - deal.price).toFixed(0) + ' on ' + deal.title + '. Get this deal at ' + deal.store + ' before it sells out!';
  const image = deal.image_url || 'https://ybdeals.com/preview.jpg';
  const pageUrl = 'https://ybdeals.com' + url.pathname;

  // Inject real OG tags into the <head>
  const ogTags = `
  <meta property="og:site_name" content="YB Deals">
  <meta property="og:type" content="product">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="800">
  <meta property="og:image:height" content="800">
  <meta property="og:url" content="${pageUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="${image}">
  <title>${title}</title>`;

  // Replace the placeholder title tag with our real OG tags
  const newHtml = html.replace('<title>YB Deals</title>', ogTags);

  return new Response(newHtml, {
    headers: { 'content-type': 'text/html' }
  });
}

export const config = { path: '/deal/*' };
