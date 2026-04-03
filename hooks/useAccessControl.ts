"use client";

import { PRODUCT_SLUGS } from "@/lib/constants";
import type { Subscription } from "@/lib/types";

export function useAccessControl(
  activeSubscription: Subscription | null,
  contentProductId: string | undefined
) {
  if (!activeSubscription || !contentProductId) {
    return { hasAccess: false, reason: "no_subscription" as const };
  }

  const isExpired = new Date(activeSubscription.expires_at) < new Date();
  if (isExpired) {
    return { hasAccess: false, reason: "expired" as const };
  }

  // Cuantroopers gets access to everything
  if (activeSubscription.product?.slug === PRODUCT_SLUGS.CUANTROOPERS) {
    return { hasAccess: true, reason: "cuantroopers" as const };
  }

  // Check if subscription product matches content product
  if (activeSubscription.product_id === contentProductId) {
    return { hasAccess: true, reason: "matched" as const };
  }

  return { hasAccess: false, reason: "wrong_product" as const };
}
