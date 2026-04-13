const EMAIL = "info@cumparatisenzor.ro";
const PHONE_E164 = "420777577352";
const PHONE_DISPLAY = "+420 777 577 352";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function MetaMarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path d="M6.915 4.03c-1.073 0-2.059.68-2.519 1.698L.095 17.845c-.495 1.07-.09 2.35.91 2.95l8.5 5.2c.95.58 2.15.58 3.1 0l8.5-5.2c1-.6 1.405-1.88.91-2.95l-4.3-9.117c-.46-1.018-1.446-1.698-2.519-1.698H6.915zm1.85 3.05h6.47c.35 0 .67.2.82.52l2.15 4.55H5.615l2.15-4.55c.15-.32.47-.52.82-.52z" />
    </svg>
  );
}

export function SiteContactBar() {
  const fb = process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK_URL || "#";
  const meta = process.env.NEXT_PUBLIC_SOCIAL_META_URL || "#";

  return (
    <div className="mt-8 flex flex-col gap-6 border-t border-white/10 pt-8 md:flex-row md:flex-wrap md:items-center md:justify-between">
      <div className="flex flex-col gap-2 text-sm">
        <a
          href={`mailto:${EMAIL}`}
          className="font-medium text-white transition hover:text-[#a7f3d0]"
        >
          {EMAIL}
        </a>
        <a
          href={`https://wa.me/${PHONE_E164}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-medium text-[#d1fae5] transition hover:text-[#a7f3d0]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm">
            <WhatsAppIcon className="h-5 w-5" />
          </span>
          <span>{PHONE_DISPLAY}</span>
        </a>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-[#a7f3d0]/80">
          Urmariti-ne
        </span>
        <div className="flex items-center gap-3">
          <a
            href={fb}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Facebook"
            title="Facebook"
          >
            <FacebookIcon className="h-5 w-5" />
          </a>
          <a
            href={meta}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#0668E1] to-[#0084FF] text-white shadow-sm transition hover:opacity-90"
            aria-label="Meta"
            title="Meta"
          >
            <MetaMarkIcon className="h-6 w-6" />
          </a>
        </div>
        <p className="max-w-xs text-xs text-[#a7f3d0]/70">
          Link-urile vor fi actualizate cand paginile sunt gata.
        </p>
      </div>
    </div>
  );
}
