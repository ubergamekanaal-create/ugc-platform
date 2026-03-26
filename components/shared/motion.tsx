"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

const easing = [0.22, 1, 0.36, 1] as const;

type MotionBlockProps = HTMLMotionProps<"div"> & {
  delay?: number;
};

export function PageTransition(props: HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easing }}
      {...props}
    />
  );
}

export function FadeIn({ delay = 0, ...props }: MotionBlockProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.65, delay, ease: easing }}
      {...props}
    />
  );
}

export function HoverLift(props: HTMLMotionProps<"div">) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.25, ease: easing }}
      {...props}
    />
  );
}

export function MotionScale(props: HTMLMotionProps<"button">) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2, ease: easing }}
      {...props}
    />
  );
}
