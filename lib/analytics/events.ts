export const analyticsEvents = [
  "landing_view",
  "hero_cta_click",
  "signup_started",
  "signup_completed",
  "onboarding_completed",
  "module_started",
  "prompt_copied",
  "checkpoint_passed",
  "decision_saved",
  "paywall_viewed",
  "checkout_started",
  "purchase_completed",
  "module_completed",
  "project_completed",
  "proof_published",
  "profile_viewed",
  "tutor_message_sent",
] as const;

export type AnalyticsEvent = (typeof analyticsEvents)[number];

export function isAnalyticsEvent(e: string): e is AnalyticsEvent {
  return (analyticsEvents as readonly string[]).includes(e);
}
