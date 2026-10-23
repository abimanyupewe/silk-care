type EmailInput = {
  to: string;
  subject: string;
  text: string;
};

export async function sendEmail({ to, subject, text }: EmailInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email belum dikonfigurasi. Isi RESEND_API_KEY dan EMAIL_FROM.');
    }

    console.info(
      [
        '',
        '[email:dev] Email tidak dikirim karena provider belum dikonfigurasi.',
        `Kepada: ${to}`,
        `Subjek: ${subject}`,
        '---',
        text,
        '---',
        ''
      ].join('\n')
    );

    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      `Pengiriman email gagal (${response.status}): ${detail.slice(0, 200) || 'tanpa detail'}`
    );
  }
}
