// Cloudflare Pages Functions Middleware
// يقوم بحقن Environment Variables في HTML

export async function onRequest(context) {
  const response = await context.next();
  
  // فقط للملفات HTML
  if (response.headers.get('content-type')?.includes('text/html')) {
    let html = await response.text();
    
    // حقن Environment Variables قبل تحميل supabase-config.js
    const envScript = `
      <script>
        // Environment Variables من Cloudflare Pages
        window.SUPABASE_URL_ENV = '${context.env.SUPABASE_URL || ''}';
        window.SUPABASE_ANON_KEY_ENV = '${context.env.SUPABASE_ANON_KEY || ''}';
      </script>
    `;
    
    // أضف السكريبت قبل </head>
    html = html.replace('</head>', `${envScript}</head>`);
    
    return new Response(html, {
      headers: response.headers
    });
  }
  
  return response;
}
