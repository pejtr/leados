/**
 * useGoogleAds — Centralized Google Ads conversion tracking hook
 *
 * Sends gtag conversion events for every meaningful user action in LeadOS.
 * Conversion ID is configured via VITE_GOOGLE_ADS_ID env var (AW-XXXXXXXXX).
 * Each event maps to a specific Google Ads conversion action label.
 *
 * Usage:
 *   const { track } = useGoogleAds();
 *   track('lead_generated', { value: 1, currency: 'EUR' });
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

// ─── Conversion Action Labels ─────────────────────────────────────────────────
// These labels must match the conversion actions created in Google Ads UI.
// Format: descriptive snake_case → map to your actual AW-XXXXXX/LABEL values.
export const CONVERSION_LABELS: Record<string, string> = {
  // 🔴 TIER 1 — Highest value (revenue & purchase intent)
  subscription_checkout_started:  'checkout_started',
  subscription_purchased:         'purchase',
  billing_portal_opened:          'billing_portal',

  // 🟠 TIER 2 — Core product actions (lead gen engine)
  leads_generated:                'lead_generated',
  lead_enriched:                  'lead_enriched',
  lead_status_updated:            'lead_status_changed',
  lead_quality_rated:             'lead_rated',
  predictive_scores_computed:     'ai_scoring',

  // 🟡 TIER 3 — Engagement & activation
  hermes_mission_launched:        'mission_launched',
  hermes_message_sent:            'hermes_chat',
  sdr_email_generated:            'email_generated',
  sequence_created:               'sequence_created',
  sequence_steps_saved:           'sequence_steps_saved',
  linkedin_message_generated:     'linkedin_msg_generated',
  icp_created:                    'icp_created',
  icp_updated:                    'icp_updated',

  // 🟢 TIER 4 — Pipeline & CRM actions
  deal_created:                   'deal_created',
  deal_stage_changed:             'deal_stage_changed',
  deal_won:                       'deal_won',
  deal_lost:                      'deal_lost',
  kanban_card_moved:              'kanban_moved',
  task_created:                   'task_created',
  task_completed:                 'task_completed',

  // 🔵 TIER 5 — Intelligence & AI features
  market_intel_generated:         'market_intel',
  nba_action_taken:               'nba_action',
  nba_generated:                  'nba_generated',
  ai_advisor_queried:             'ai_advisor',
  ai_agent_executed:              'ai_agent_run',
  ai_agent_created:               'ai_agent_created',
  call_analyzed:                  'call_analyzed',
  call_crm_updated:               'call_crm_updated',
  tech_stack_detected:            'tech_stack_detected',
  competitive_map_viewed:         'competitive_map',
  social_signal_converted:        'social_to_lead',
  social_monitor_created:         'social_monitor',

  // 🟣 TIER 6 — Automation & campaigns
  autopilot_created:              'autopilot_created',
  campaign_created:               'campaign_created',
  campaign_meta_imported:         'meta_import',
  campaign_rule_created:          'campaign_rule',
  smart_list_created:             'smart_list',
  alert_rule_created:             'alert_rule',
  tracking_pixel_created:         'pixel_created',
  capture_plan_created:           'capture_plan',

  // ⚪ TIER 7 — Team & platform setup
  team_member_invited:            'team_invite',
  template_created:               'template_created',
  project_created:                'project_created',
  portfolio_shared:               'portfolio_shared',
  speed_to_lead_configured:       'speed_to_lead',
  matching_created:               'matching_created',
  morning_briefing_generated:     'morning_briefing',

  // 📄 PAGE VIEWS (micro-conversions)
  pricing_page_viewed:            'pricing_viewed',
  dashboard_first_visit:          'dashboard_activated',
  generate_page_viewed:           'generate_viewed',
  billing_page_viewed:            'billing_viewed',
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface TrackOptions {
  value?: number;
  currency?: string;
  label?: string;         // override default label
  transaction_id?: string;
  [key: string]: any;
}

// ─── Primary conversion send_to values (from Google Ads UI) ─────────────────
// These are the actual AW-ID/LABEL strings for the 3 primary conversion actions.
// All other events use generic labels for GTM/GA4 only.
const PRIMARY_CONVERSIONS: Record<string, string | undefined> = {
  subscription_purchased:       import.meta.env.VITE_GOOGLE_ADS_LABEL_PURCHASE     ? `${import.meta.env.VITE_GOOGLE_ADS_ID}/${import.meta.env.VITE_GOOGLE_ADS_LABEL_PURCHASE}`     : undefined,
  subscription_checkout_started: import.meta.env.VITE_GOOGLE_ADS_LABEL_PURCHASE    ? `${import.meta.env.VITE_GOOGLE_ADS_ID}/${import.meta.env.VITE_GOOGLE_ADS_LABEL_PURCHASE}`    : undefined,
  user_signed_up:               import.meta.env.VITE_GOOGLE_ADS_LABEL_SIGNUP       ? `${import.meta.env.VITE_GOOGLE_ADS_ID}/${import.meta.env.VITE_GOOGLE_ADS_LABEL_SIGNUP}`       : undefined,
  billing_page_viewed:          import.meta.env.VITE_GOOGLE_ADS_LABEL_SIGNUP       ? `${import.meta.env.VITE_GOOGLE_ADS_ID}/${import.meta.env.VITE_GOOGLE_ADS_LABEL_SIGNUP}`       : undefined,
  subscription_plan_activated:  import.meta.env.VITE_GOOGLE_ADS_LABEL_SUBSCRIPTION ? `${import.meta.env.VITE_GOOGLE_ADS_ID}/${import.meta.env.VITE_GOOGLE_ADS_LABEL_SUBSCRIPTION}` : undefined,
};

export function useGoogleAds() {
  const adsId = import.meta.env.VITE_GOOGLE_ADS_ID as string | undefined;
  const ga4Id = import.meta.env.VITE_GA4_ID as string | undefined;

  const track = (eventKey: string, options: TrackOptions = {}) => {
    if (typeof window === 'undefined' || !window.gtag) return;

    const { value, currency = 'EUR', label, transaction_id, ...extra } = options;
    const conversionLabel = label ?? CONVERSION_LABELS[eventKey];

    // ── Google Ads conversion event ──────────────────────────────────────────
    // Use exact AW-ID/LABEL for primary conversions, fallback to generic for others
    const primarySendTo = PRIMARY_CONVERSIONS[eventKey];
    const sendTo = primarySendTo ?? (adsId && adsId !== 'undefined' && conversionLabel ? `${adsId}/${conversionLabel}` : undefined);
    if (sendTo) {
      window.gtag('event', 'conversion', {
        send_to: sendTo,
        ...(value !== undefined && { value, currency }),
        ...(transaction_id && { transaction_id }),
        ...extra,
      });
    }

    // ── GA4 custom event (same data, different format) ───────────────────────
    if (ga4Id && ga4Id !== 'undefined') {
      window.gtag('event', eventKey, {
        event_category: 'leados_conversion',
        event_label: conversionLabel ?? eventKey,
        ...(value !== undefined && { value, currency }),
        ...extra,
      });
    }

    // ── Always push to dataLayer for GTM compatibility ───────────────────────
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: `leados_${eventKey}`,
      leados_event_key: eventKey,
      leados_conversion_label: conversionLabel,
      ...(value !== undefined && { leados_value: value, leados_currency: currency }),
      ...extra,
    });
  };

  // Convenience: track page view with path
  const trackPageView = (path: string, title?: string) => {
    if (typeof window === 'undefined' || !window.gtag) return;
    if (adsId && adsId !== 'undefined') {
      window.gtag('event', 'page_view', {
        send_to: adsId,
        page_path: path,
        page_title: title,
      });
    }
  };

  return { track, trackPageView };
}
