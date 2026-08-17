"use client";

import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-line bg-cream px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-forest";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 700);
  }

  return (
    <div className="mt-6">
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-start gap-2 rounded-lg bg-cream-soft p-6 text-forest-dark"
          >
            <CheckCircle2 size={26} />
            <p className="font-medium">Thank you &mdash; your message has been noted.</p>
            <p className="text-sm text-ink-soft">
              Our team will get back to you shortly.
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <input required name="name" placeholder="Full name" className={inputClass} />
            <input required type="email" name="email" placeholder="Email address" className={inputClass} />
            <input name="phone" placeholder="Phone number" className={`${inputClass} sm:col-span-2`} />
            <textarea
              required
              name="message"
              placeholder="Your message"
              rows={5}
              className={`${inputClass} resize-none sm:col-span-2`}
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-fit items-center rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-forest-dark disabled:opacity-60 sm:col-span-2"
            >
              {loading ? "Sending..." : "Send Message"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
