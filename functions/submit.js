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

  const websiteLabel = { yes: 'Yes', no: 'No', 'needs-work': 'Needs work' }[hasWebsite] || hasWebsite;

  const notifyBody = `New lead from Aren's Eye

Name:         ${name}
Business:     ${businessName}
Type:         ${businessType}
Has website?  ${websiteLabel}
Contact:      ${contact}

What they wish people knew:
${wishPeopleKnew}

— Aren's Eye contact form`;

  const autoReply = `Hey ${name},

Got your message about ${businessName}.

I'll follow up within 24 hours. — Chris

P.S. If you want to grab a time now: [CALENDLY LINK]`;

  const notifyEmail = env.NOTIFY_EMAIL || 'bcjoh26@gmail.com';
  const fromEmail   = env.FROM_EMAIL   || 'noreply@arensite.pages.dev';

  try {
    await sendEmail({ to: notifyEmail, from: fromEmail, subject: `New lead: ${businessName} (${name})`, text: notifyBody });

    if (contact.includes('@')) {
      await sendEmail({ to: contact, from: fromEmail, subject: "Got it — I'll be in touch soon", text: autoReply });
    }

    return json({ success: true }, 200);
  } catch (err) {
    console.error('Email error:', err);
    return json({ error: 'Email failed' }, 500);
  }
}

async function sendEmail({ to, from, subject, text }) {
  const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from, name: "Aren's Eye" },
      subject,
      content: [{ type: 'text/plain', value: text }]
    })
  });
  if (!res.ok) throw new Error(`MailChannels ${res.status}: ${await res.text()}`);
}

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
