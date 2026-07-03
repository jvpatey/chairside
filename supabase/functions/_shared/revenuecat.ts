type RevenueCatEntitlement = {
  expires_date?: string | null;
  product_identifier?: string | null;
};

type RevenueCatSubscriber = {
  subscriber?: {
    entitlements?: Record<string, RevenueCatEntitlement>;
    original_app_user_id?: string;
  };
};

export type ResolvedClinicSubscription = {
  plan: 'free' | 'starter' | 'pro';
  status: 'active' | 'trialing' | 'grace_period' | 'cancelled' | 'expired';
  currentPeriodEnd: string | null;
};

function isEntitlementActive(entitlement: RevenueCatEntitlement | undefined): boolean {
  if (!entitlement) return false;
  if (!entitlement.expires_date) return true;
  return new Date(entitlement.expires_date).getTime() > Date.now();
}

export function resolveClinicSubscriptionFromSubscriber(
  subscriber: RevenueCatSubscriber,
  statusOverride?: ResolvedClinicSubscription['status'],
): ResolvedClinicSubscription {
  const entitlements = subscriber.subscriber?.entitlements ?? {};
  const pro = entitlements.clinic_pro;
  const starter = entitlements.clinic_starter;

  if (isEntitlementActive(pro)) {
    return {
      plan: 'pro',
      status: statusOverride ?? 'active',
      currentPeriodEnd: pro?.expires_date ?? null,
    };
  }

  if (isEntitlementActive(starter)) {
    return {
      plan: 'starter',
      status: statusOverride ?? 'active',
      currentPeriodEnd: starter?.expires_date ?? null,
    };
  }

  return {
    plan: 'free',
    status: statusOverride ?? 'expired',
    currentPeriodEnd: null,
  };
}

export async function fetchRevenueCatSubscriber(appUserId: string): Promise<RevenueCatSubscriber> {
  const secretKey = Deno.env.get('REVENUECAT_SECRET_API_KEY');
  if (!secretKey) {
    throw new Error('REVENUECAT_SECRET_API_KEY is not configured');
  }

  const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`RevenueCat subscriber lookup failed (${response.status}): ${text}`);
  }

  return (await response.json()) as RevenueCatSubscriber;
}

export function mapWebhookStatus(eventType: string): ResolvedClinicSubscription['status'] {
  switch (eventType) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'UNCANCELLATION':
    case 'PRODUCT_CHANGE':
    case 'SUBSCRIPTION_EXTENDED':
      return 'active';
    case 'CANCELLATION':
      return 'cancelled';
    case 'BILLING_ISSUE':
      return 'grace_period';
    case 'EXPIRATION':
      return 'expired';
    default:
      return 'active';
  }
}
