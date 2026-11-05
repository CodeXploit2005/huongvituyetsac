"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";

export const FlyToCartEffect: React.FC = () => {
  const { flyingItems, removeFlyingItem } = useCart();

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {flyingItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{
              position: "fixed",
              left: item.startX - 30,
              top: item.startY - 30,
              width: 64,
              height: 64,
              opacity: 1,
              scale: 1,
              zIndex: 9999,
            }}
            animate={{
              left: item.endX - 16,
              top: item.endY - 16,
              width: 32,
              height: 32,
              scale: 0.2,
              opacity: 0.8,
              rotate: 360,
            }}
            transition={{
              duration: 0.75,
              ease: [0.16, 1, 0.3, 1], // Parabolic cubic-bezier curve
            }}
            onAnimationComplete={() => removeFlyingItem(item.id)}
            className="rounded-full shadow-2xl overflow-hidden border-2 border-amber-400 bg-white dark:bg-stone-900"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image}
              alt="Flying item"
              className="w-full h-full object-cover"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
