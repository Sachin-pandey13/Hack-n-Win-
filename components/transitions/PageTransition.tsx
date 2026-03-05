"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

/**
 * 3D page transition with perspective + rotateY + soft blur.
 * Keeps layout intact (no position: fixed hacks), so it plays nice with your workspace.
 */
export default function PageTransition({
  children,
  skipRoutes = [],
}: {
  children: ReactNode;
  /** Optional: routes to skip animation (regex strings). Example: ["^/problems/[^/]+/[^/]+$"] */
  skipRoutes?: string[];
}) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  // Allow skipping if route matches any skip pattern
  const shouldSkip = skipRoutes.some((rx) => new RegExp(rx).test(pathname));

  if (reduceMotion || shouldSkip) {
    return <>{children}</>;
  }

  // Subtle 3D “card” swing + blur
  const variants = {
    initial: {
      opacity: 0,
      rotateY: 18,
      y: 16,
      filter: "blur(8px)",
      transformPerspective: 1200,
    },
    enter: {
      opacity: 1,
      rotateY: 0,
      y: 0,
      filter: "blur(0px)",
      transformPerspective: 1200,
      transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    },
    exit: {
      opacity: 0,
      rotateY: -12,
      y: -10,
      filter: "blur(5px)",
      transformPerspective: 1200,
      transition: { duration: 0.40, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <div className="perspective-1200 preserve-3d">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname} // re-animate on route change
          variants={variants}
          initial="initial"
          animate="enter"
          exit="exit"
          style={{ willChange: "transform, filter, opacity" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
