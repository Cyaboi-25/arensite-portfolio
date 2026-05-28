/**
 * Aren's Eye — Contact Form Worker
 * Deploy to Cloudflare Workers. Bind an Email Routing address or use
 * the MailChannels integration (available free on Cloudflare Workers).
 *
 * Required environment variables (set in Cloudflare dashboard):
 *   NOTIFY_EMAIL  — where to send new lead notifications (bcjoh26@gmail.com)
 *   FROM_EMAIL    — verified sender address on your domain (e.g. hello@arensite.com)
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return corsResponse(null, 204);
    }

    if (request.method === 'POST' && url.pathname === '/submit') {
      return handleSubmit(request, env);
    }

    return new Response('Not found', { status: 404 });
  }
};

async function handleSubmit(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400);
  }

  const { name, businessName, businessType, hasWebsite, wishPeopleKnew, contact } = body;

  if (!name || !businessName || !businessType || !hasWebsite || !wishPeopleKnew || !contact) {
    return corsResponse(JSON.stringify({ error: 'Missing fields' }), 400);
  }

  const websiteLabel = {
    yes: 'Yes',
    no: 'No',
    'needs-work': 'I think so but it needs work'
  }[hasWebsite] || hasWebsite;

  // ── Notification email to Chris ──────────────────────────
  const notifyBody = `New lead from Aren's Eye contact form

Name:          ${name}
Business:      ${businessName}
Type:          ${businessType}
Has website?   ${websiteLabel}
Contact:       ${contact}

What they wish people knew:
${wishPeopleKnew}

—
Aren's Eye contact form`;

  // ── Auto-reply to submitter ───────────────────────────────
  const isEmail = contact.includes('@');
  const autoReplyBody = `Hey ${name},

Got your message about ${businessName}.

I'll follow up within 24 hours. — Chris

P.S. If you want to grab a time now: [CALENDLY LINK]`;

  try {
    // Send notification to Chris via MailChannels
    await sendEmail(env, {
      to:      env.NOTIFY_EMAIL || 'bcjoh26@gmail.com',
      from:    env.FROM_EMAIL   || 'noreply@arensite.pages.dev',
      subject: `New lead: ${businessName} (${name})`,
      text:    notifyBody
    });

    // Send auto-reply only if contact looks like an email
    if (isEmail) {
      await sendEmail(env, {
        to:      contact,
        from:    env.FROM_EMAIL || 'noreply@arensite.pages.dev',
        subject: "Got it — I'll be in touch soon",
        text:    autoReplyBody
      });
    }

    return corsResponse(JSON.stringify({ success: true }), 200);
  } catch (err) {
    console.error('Email send failed:', err);
    return corsResponse(JSON.stringify({ error: 'Email failed' }), 500);
  }
}

async function sendEmail(env, { to, from, subject, text }) {
  // Uses MailChannels — free on Cloudflare Workers (no API key needed)
  const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from:             { email: from, name: "Aren's Eye" },
      subject,
      content: [{ type: 'text/plain', value: text }]
    })
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`MailChannels ${res.status}: ${detail}`);
  }
}

function corsResponse(body, status) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type':                'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
