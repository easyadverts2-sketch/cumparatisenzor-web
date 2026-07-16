"use client";

import { useState, type FormEvent } from "react";
import type { EuLocale } from "@/lib/eu-market-content";

const COPY = {
  ru: {
    name: "Имя",
    email: "E-mail",
    rating: "Оценка",
    text: "Ваш отзыв",
    submit: "Отправить отзыв",
    sending: "Отправляем…",
    success: "Спасибо! Мы получили отзыв и проверим его перед публикацией.",
    errorFallback: "Не удалось отправить. Попробуйте позже.",
    hint: "Отзывы публикуем только после проверки — без фальшивых оценок.",
  },
  uk: {
    name: "Ім’я",
    email: "E-mail",
    rating: "Оцінка",
    text: "Ваш відгук",
    submit: "Надіслати відгук",
    sending: "Надсилаємо…",
    success: "Дякуємо! Ми отримали відгук і перевіримо його перед публікацією.",
    errorFallback: "Не вдалося надіслати. Спробуйте пізніше.",
    hint: "Відгуки публікуємо лише після перевірки — без фальшивих оцінок.",
  },
} as const;

export function EuReviewForm({ locale }: { locale: EuLocale }) {
  const t = COPY[locale];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/eu/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, rating, text, locale, website }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setStatus("error");
        setMessage(data.message || t.errorFallback);
        return;
      }
      setStatus("ok");
      setMessage(t.success);
      setName("");
      setEmail("");
      setRating(5);
      setText("");
    } catch {
      setStatus("error");
      setMessage(t.errorFallback);
    }
  }

  if (status === "ok") {
    return (
      <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-900" role="status">
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-[#0d4f4a]/12 bg-white p-6 shadow-sm">
      <p className="text-sm text-[#4d6864]">{t.hint}</p>
      <label className="block text-sm font-medium text-[#042f2c]">
        <span className="mb-1 block">{t.name}</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={120}
          className="w-full rounded-lg border-2 border-[#0d4f4a]/20 px-3 py-2"
        />
      </label>
      <label className="block text-sm font-medium text-[#042f2c]">
        <span className="mb-1 block">{t.email}</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          maxLength={160}
          className="w-full rounded-lg border-2 border-[#0d4f4a]/20 px-3 py-2"
        />
      </label>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-[#042f2c]">{t.rating}</legend>
        <div className="flex flex-wrap gap-2">
          {[5, 4, 3, 2, 1].map((value) => (
            <label
              key={value}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-semibold ${
                rating === value
                  ? "border-[#8f2c53] bg-[#8f2c53] text-white"
                  : "border-[#0d4f4a]/20 bg-white text-[#042f2c]"
              }`}
            >
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                className="sr-only"
              />
              {value}★
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm font-medium text-[#042f2c]">
        <span className="mb-1 block">{t.text}</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          minLength={20}
          maxLength={2000}
          rows={5}
          className="w-full rounded-lg border-2 border-[#0d4f4a]/20 px-3 py-2"
        />
      </label>
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
        aria-hidden
      />
      {status === "error" ? (
        <p className="text-sm text-red-700" role="alert">
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-xl bg-[#8f2c53] px-6 py-3 font-semibold text-white disabled:opacity-60"
      >
        {status === "sending" ? t.sending : t.submit}
      </button>
    </form>
  );
}
