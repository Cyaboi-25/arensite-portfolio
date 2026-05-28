export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { name, businessName, businessType, hasWebsite, wishPeopleKnew, contact } = body;

  if (!name || !businessName || !businessType || !hasWebsite || !wishPeopleKnew || !contact) {
    return json({ error: 'Missing fields' }, 400);
  }

  const resendKey = env.ARENSITE_RESEND_API_KEY;
  if (!resendKey) {
    console.error('RESEND_API_KEY not set');
    return json({ error: 'Server misconfigured' }, 500);
  }

  const websiteLabel = { yes: 'Yes', no: 'No', 'needs-work': 'Needs work' }[hasWebsite] || hasWebsite;
  const notifyEmail  = env.NOTIFY_EMAIL || 'bcjoh26@gmail.com';
  const fromEmail    = 'onboarding@resend.dev';

  const notifyBody = `New lead from Arensite

Name:         ${name}
Business:     ${businessName}
Type:         ${businessType}
Has website?  ${websiteLabel}
Contact:      ${contact}

What they wish people knew:
${wishPeopleKnew}

— Arensite contact form`;

  const autoReply = `Hey ${name},

Got your message about ${businessName}.

I'll follow up within 24 hours. — Chris

P.S. If you want to grab a time now: [CALENDLY LINK]`;

  try {
    await sendEmail(resendKey, {
      to:      notifyEmail,
      from:    fromEmail,
      subject: `New lead: ${businessName} (${name})`,
      text:    notifyBody
    });

    if (contact.includes('@')) {
      await sendEmail(resendKey, {
        to:      contact,
        from:    fromEmail,
        subject: "Got it — I'll be in touch soon",
        text:    autoReply
      });
    }

    return json({ success: true }, 200);
  } catch (err) {
    console.error('Email error:', err.message);
    return json({ error: 'Email failed', detail: err.message }, 500);
  }
}

async function sendEmail(apiKey, { to, from, subject, text }) {
  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json'
    },
    body: JSON.stringify({
      from,
      to:      [to],
      subject,
      text
    })
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Resend ${res.status}: ${detail}`);
  }
}

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
