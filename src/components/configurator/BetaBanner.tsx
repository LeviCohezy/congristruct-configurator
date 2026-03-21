import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const messages = [
  "Beta Versie 1.0 - Ontvang prijs in offerte",
  "Coming Soon - Versie 2.0 met live prijzen",
];

export function BetaBanner() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="w-full text-center py-1.5 text-xs font-medium text-white z-50 overflow-hidden sticky top-0"
      style={{ backgroundColor: "#5c6b6a" }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="block"
        >
          {messages[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
