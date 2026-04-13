## Senzori Libre Romania

Romanian e-commerce MVP for FreeStyle Libre 2 Plus.

## Local development

Create env file:

```bash
cp .env.example .env.local
```

Set at least:

- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `DATABASE_URL`

Run development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Admin login

- URL: `/admin/login`
- Password is controlled by `ADMIN_PASSWORD`.

## E-mail sending (SMTP)

Configure in `.env.local`:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

If SMTP is not configured, order notifications are stored in admin but not sent externally.

## Deploy

- Deploy on Vercel
- Add environment variables from `.env.example`

## DNS stabil (site-ul sa nu „pice” pe hosting gol)

- **Nu** setati `A @` catre IP-ul de shared hosting (ex. pagina „Index of /”) daca site-ul este pe Vercel.
- Pentru web: `A @ -> 76.76.21.21` **sau** inregistrari `ALIAS`/`CNAME` conform Vercel pentru domeniu.
- Pentru e-mail: pastrati `MX` catre serverul de mail (ex. `mail.domeniu`) si `A mail -> IP mail` — **fara** a suprascrie `A @` cu IP-ul de mail.
- Evitati schimbarea nameserverilor inainte si dupa: alegeti **fie** NS Vercel **fie** NS la registrar si editati doar zona DNS, dar **nu le schimbati des**.

## Numar comanda

- Comenzile au numar secvential afisat (ex. `0000001`), stocat in coloana `order_number`.
