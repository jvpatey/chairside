# Chairside Design Overhaul — Implementation Plan

> **Source:** Design critique from Cloud Agent session ([Modern dashboard design](https://cursor.com/agents/bc-d9e56144-59fd-4c98-9c8e-6e51c201913c))  
> **Goal:** Elevate Chairside from a polished 7/10 to a top-tier product (Linear / Mercury / Stripe tier) across web and native.  
> **How to use:** Work phase-by-phase. Each phase is ordered by impact and dependency. Open this file in Cursor on desktop and start a Plan or Agent session pointed at a specific phase.

---

## Summary of findings

| Area | Current state | Target |
|------|---------------|--------|
| Design system | Strong token architecture; neutrals borrowed from iOS; blue/purple semantic exists but leaks | Own the palette; enforce blue = roles, purple = fill-ins everywhere |
| Clinic dashboard | Good shell; zero-state feels dead; single column on desktop; gradient overload | Attention-driven layout; onboarding checklist at zero; two-column desktop grid |
| Other tabs | Consistent headers/skeletons; most tabs stretch phone layout; error UX varies | Desktop layouts where it matters; unified error banners; token cleanup |
| Welcome / splash | Web landing is strong; native welcome is clean; splash colors mismatch app; triple boot | Seamless boot; aligned colors; OG image; honest social proof |
| Light vs dark | Both supported via system | **Light-first** for clinic web; dark stays strong for professionals on mobile |

---

## Phase 0 — Foundation (colors, tokens, splash)

**Priority:** P0 — do first. Low risk, propagates everywhere via theme layer.  
**Estimated scope:** ~2 files for colors, ~1 for gradients, ~3 for splash/HTML alignment.

### 0.1 Retint neutrals to match brand temperature

Light and dark neutrals currently mix brand-tinted backgrounds with iOS system grays. Align all neutrals to the same hue family as primary blue.

| Token | Light (current → target) | Dark (current → target) |
|-------|--------------------------|-------------------------|
| `separator` | `#C6C6C8` → `#D9DFEA` | `#38383A` → `#2A2E3A` |
| `labelSecondary` | `#3C3C4399` → `#3C485C99` | `#EBEBF599` → `#E5EAF599` |
| `surface` | keep `#FFFFFF` | `#1C1C1E` → `#14161D` |
| `surfaceElevated` | keep `#FFFFFF` | `#242428` → `#1B1E27` |

**Files:**
- `apps/mobile/src/theme/colors.ts`

### 0.2 Merge `info` into `primary`

Two competing blues (`primary` `#1A6FD4` vs `info` `#007AFF`) read as inconsistency. Remove `info` token or alias it to `primary`; grep for `colors.info` usages and replace.

**Files:**
- `apps/mobile/src/theme/colors.ts`
- Grep: `colors.info`, `info:` across `apps/mobile/src/`

### 0.3 Fix semantic color roles

- **Warning:** light `#C93400` → true amber (e.g. `#B45309`) — currently too close to destructive `#D70015`
- **Urgent:** demote from a third hue to a *treatment* (filled vs tonal badge) on top of warning/amber
- **Dark surfaces:** derive from `#0B0D12` base, not neutral iOS grays

**Files:**
- `apps/mobile/src/theme/colors.ts`
- Badge/chip components using `warning`, `urgent`, `destructive`

### 0.4 Enforce blue / purple semantic in gradients

Keep the two-hue system (blue = roles, purple = fill-ins) but stop blending them in shared chrome.

| Change | File |
|--------|------|
| Hero band: blue-only wash (remove indigo/violet/secondary stops) | `apps/mobile/src/theme/gradients.ts` → `getHeroBandGradient` |
| Remove blue→purple→blue section divider | `getDashboardSectionDividerGradient` |
| Cap light-mode hero/atmosphere alpha at ~0.16–0.20 (currently peaks at 0.42) | `getHeroBandGradient`, `getAtmosphereGradient` |
| Dashboard page background: use `backgroundGrouped` with white cards | Dashboard layout components |

**Files:**
- `apps/mobile/src/theme/gradients.ts`
- `apps/mobile/src/components/dashboard/DashboardBodyLayout.tsx`
- `apps/mobile/src/components/dashboard/DashboardScreen.tsx`

### 0.5 Align splash and HTML theme colors with app

Splash/HTML use iOS system grays; app uses brand-tinted backgrounds. Align all three.

| Surface | Current | Target (from `colors.ts`) |
|---------|---------|---------------------------|
| Splash light | `#F2F2F7` | `#F4F6FB` (`backgroundGrouped`) |
| Splash dark | `#0C0C0E` | `#0B0D12` (`background`) |
| HTML theme-color | same as splash | same as above |

**Files:**
- `apps/mobile/app.json` (expo-splash-screen plugin)
- `apps/mobile/app/+html.tsx` (`THEME_COLOR_LIGHT`, `THEME_COLOR_DARK`, body background)

### 0.6 Fix blue/purple semantic leaks (quick wins)

| Issue | Fix | File |
|-------|-----|------|
| Fill-in compensation on apply screen uses `primary` blue | Use `secondary` | `apps/mobile/app/(tabs)/apply.tsx` |
| Calendar fill-in dots use hardcoded greens `#B8F5C8` / `#E8FCEF` | Use `colors.secondary` or `success` consistently | `apps/mobile/app/(clinic-tabs)/calendar.tsx`, `ScheduleCalendarPanel` |
| Fill-in dots use `success` green while cards use `secondary` purple | Pick one: secondary purple for fill-ins everywhere | Calendar + schedule components |

**Files:**
- `apps/mobile/app/(tabs)/apply.tsx`
- `apps/mobile/src/components/schedule/` (calendar panel, agenda)
- `apps/mobile/src/lib/calendarEvents.ts`

---

## Phase 1 — Cross-cutting consistency

**Priority:** P0 — high user-visible impact, mechanical changes.  
**Estimated scope:** ~15–20 files.

### 1.1 Unify error handling

Adopt `DashboardErrorBanner` (with retry) as the standard. Replace silent failures and Alert-only patterns.

| Screen | Current behavior | Target |
|--------|------------------|--------|
| Clinic Applications | Silent clear | Banner + retry |
| Clinic Calendar | Silent empty | Banner + retry |
| Clinic Roles / Fill-ins | Alert only | Banner + retry |
| Worker Roles browse | Silent empty | Banner + retry |
| Worker Fill-ins | Alert only | Banner + retry |
| Worker Calendar | Silent empty | Banner + retry |

**Pattern:** Extract a shared `ScreenErrorBanner` if needed (thin wrapper around `DashboardErrorBanner`).

**Files:**
- `apps/mobile/app/(clinic-tabs)/applications.tsx`
- `apps/mobile/app/(clinic-tabs)/calendar.tsx`
- `apps/mobile/app/(clinic-tabs)/postings.tsx`
- `apps/mobile/app/(clinic-tabs)/fill-ins.tsx`
- `apps/mobile/app/(tabs)/browse.tsx`
- `apps/mobile/app/(tabs)/fillins.tsx`
- `apps/mobile/app/(tabs)/calendar.tsx`
- `apps/mobile/src/components/dashboard/DashboardErrorBanner.tsx` (possibly rename/generalize)

### 1.2 Token cleanup pass

Replace one-off values with theme tokens.

| Drift | Token / fix |
|-------|-------------|
| Raw radii `8`, `10`, `12`, `16` | Map to `radii.sm` (10), `radii.md` (14), `radii.lg` (20) |
| Hardcoded calendar greens | Theme semantic colors |
| `${color}18` alpha string concat | Use `colorWithAlpha()` from `gradients.ts` |
| `rgba(255,255,255,0.22)` messaging chip | Theme token or `colorWithAlpha` |
| Messaging inbox radii 12–16 vs list cards 20 | Standardize on `radii.lg` (20) for cards |
| Settings group card radius 16 vs hero 28 | Settings rows → `radii.lg`; hero stays `radii.hero` |

**Files (high drift):**
- `apps/mobile/src/components/messaging/`
- `apps/mobile/app/(clinic-tabs)/profile/index.tsx`
- `apps/mobile/app/(tabs)/profile/index.tsx`
- `apps/mobile/app/(tabs)/shift/[id].tsx` (clinic card radius 16 vs job detail 20)
- `apps/mobile/app/(tabs)/job/[id].tsx`
- `apps/mobile/app/(tabs)/apply.tsx`, `apply-screening.tsx`

### 1.3 Consolidate empty-state components

Two parallel components: `EmptyState` and `DashboardEmptyState`. Pick one (or make `DashboardEmptyState` a thin preset of `EmptyState`) and migrate all usages.

**Files:**
- `apps/mobile/src/components/ui/EmptyState.tsx`
- `apps/mobile/src/components/dashboard/DashboardEmptyState.tsx`
- Grep: `DashboardEmptyState`, `EmptyState` across `apps/mobile/`

### 1.4 Delete legacy / dead routes

| File | Reason |
|------|--------|
| `apps/mobile/src/components/onboarding/AuthPlaceholderNote.tsx` | Unused auth stub |
| `apps/mobile/app/(clinic-tabs)/clinic.tsx` | Legacy combined clinic screen |
| `apps/mobile/app/(tabs)/open-fill-ins.tsx` | Parallel to Fill-ins tab |
| `apps/mobile/app/(tabs)/past-fill-ins.tsx` | Deprecated redirect stub |
| `apps/mobile/src/components/clinic/WorkerDashboardHero` (if confirmed orphan) | Duplicate of `DashboardHero` |

Verify no router references before deleting. Update `_layout.tsx` href entries.

### 1.5 Settings / profile shell alignment

Profile uses `ProfileDetailScreen` (back + sign out, no max-width) while other tabs use `Screen` (large title + bell + content max-width). Options:

- **A (recommended):** Add optional max-width to `ProfileDetailScreen` to match other tabs.
- **B:** Migrate profile hub to `Screen` with a custom hero slot.

Also: move logout from top-level header icon into avatar/profile menu on dashboard.

**Files:**
- `apps/mobile/src/components/profile/ProfileDetailScreen.tsx`
- `apps/mobile/app/(clinic-tabs)/profile/index.tsx`
- `apps/mobile/app/(tabs)/profile/index.tsx`
- `apps/mobile/src/components/dashboard/DashboardHero.tsx` (avatar menu)

---

## Phase 2 — Dashboard overhaul (clinic + worker)

**Priority:** P1 — highest wow-factor for clinic users.  
**Estimated scope:** ~10–15 files.

### 2.1 State-aware dashboard (zero state → onboarding)

When all stats are zero, replace the stat row + empty list with an onboarding checklist:

1. Complete your clinic profile →
2. Post your first role →
3. Invite team members →

Show progress (e.g. 1/3 complete). Once any stat > 0, switch to the normal stat cards + overview panel.

Apply the same pattern on the worker dashboard (complete profile → browse roles → set availability).

**Files:**
- `apps/mobile/app/(clinic-tabs)/index.tsx`
- `apps/mobile/app/(tabs)/index.tsx`
- `apps/mobile/src/components/dashboard/DashboardStatCards.tsx`
- `apps/mobile/src/components/dashboard/DashboardOverviewPanel.tsx` (or clinic/worker variants)
- **New:** `apps/mobile/src/components/dashboard/DashboardOnboardingChecklist.tsx`

### 2.2 Attention-driven layout (live state)

Reorder dashboard sections when data exists:

1. **Needs attention** — new applications, unfilled fill-ins approaching, unread messages (top of page, not below greeting)
2. **Quick actions** — one primary CTA, one secondary
3. **Stats with trend context** — "12 applications, ▲4 this week" (not bare counts)
4. **Overview list** — roles / fill-ins / applications
5. **Upcoming** — mini calendar strip of next few days' fill-ins (optional, Phase 2b)

**Files:**
- `apps/mobile/app/(clinic-tabs)/index.tsx`
- `apps/mobile/app/(tabs)/index.tsx`
- `apps/mobile/src/components/dashboard/DashboardBodyLayout.tsx`
- **New:** `apps/mobile/src/components/dashboard/DashboardAttentionRow.tsx`

### 2.3 Desktop two-column grid (≥1024px)

At wide breakpoint, split main content:

| Column | Content |
|--------|---------|
| Left (main) | Overview list, open roles, fill-ins |
| Right (rail) | Unread messages, upcoming fill-ins, recent activity |

Messages card currently stacks below the fold on desktop — move to right rail.

**Files:**
- `apps/mobile/src/components/dashboard/DashboardBodyLayout.tsx`
- `apps/mobile/src/components/dashboard/DashboardScreen.tsx`
- `apps/mobile/src/components/dashboard/DashboardUnreadMessagesCard.tsx`

### 2.4 Gradient restraint on dashboard

- **Post a role:** keep primary gradient tile (single hero CTA)
- **Post fill-in:** demote to outlined/tonal secondary treatment (not equal-weight gradient)
- Stat cards: flat surfaces + hairline borders; gradient only on *selected* stat
- Hero greeting: reduce gradient intensity (Phase 0.4)

**Files:**
- `apps/mobile/src/components/dashboard/DashboardQuickActionsRow.tsx`
- `apps/mobile/src/components/dashboard/DashboardQuickActionTile.tsx`
- `apps/mobile/src/components/dashboard/DashboardStatCards.tsx`

### 2.5 Dashboard hero cleanup

- Deduplicate clinic name (sidebar header, hero title, hero subtitle, avatar — pick one location for identity)
- Move logout into avatar dropdown menu
- Tabular figures (`fontVariant: ['tabular-nums']`) on stat numerals

**Files:**
- `apps/mobile/src/components/dashboard/DashboardHero.tsx`
- `apps/mobile/src/components/navigation/SidebarProfileHeader.tsx`
- `apps/mobile/src/components/navigation/TabletSidebar.tsx`

### 2.6 Empty states with inline CTAs

Every empty state should contain its own action button ("Post your first role"), not just instructional text pointing elsewhere.

**Files:**
- `apps/mobile/src/components/ui/EmptyState.tsx`
- `apps/mobile/src/components/clinic/ClinicCards.tsx` (overview empty)
- `apps/mobile/src/components/worker/WorkerCards.tsx`

---

## Phase 3 — Tab desktop layouts & map parity

**Priority:** P1 — fixes "stretched phone app" on web.  
**Estimated scope:** ~12–18 files.

### 3.1 Clinic list tabs — desktop treatment (≥1024px)

Currently single stacked column inside max-width. Add two-column or card-grid layouts:

| Tab | Desktop layout |
|-----|----------------|
| Roles | Two-column card grid or list + sidebar filters |
| Applications | Two-column: list + preview/detail pane |
| Fill-ins | Two-column: postings left, needs-response right |
| Discover | Same as Roles browse pattern |

Reuse patterns from Calendar (side-by-side) and Messages (master/detail).

**Files:**
- `apps/mobile/app/(clinic-tabs)/postings.tsx`
- `apps/mobile/app/(clinic-tabs)/applications.tsx`
- `apps/mobile/app/(clinic-tabs)/fill-ins.tsx`
- `apps/mobile/app/(clinic-tabs)/discover/index.tsx`
- `apps/mobile/src/hooks/useResponsiveLayout.ts` (wire up unused `gridColumns`)
- **New or extend:** shared `DesktopTwoColumnLayout` component

### 3.2 Worker Fill-ins — map parity with Roles

Roles browse has `WorkerBrowseWebLayout` (list + map side-by-side at wide). Fill-ins lacks this. Add the same split for Open tab.

**Files:**
- `apps/mobile/app/(tabs)/fillins.tsx`
- `apps/mobile/src/components/worker/WorkerBrowseWebLayout.web.tsx` (reuse or extend)
- `apps/mobile/src/components/worker/WorkerBrowseMap.web.tsx`

### 3.3 Job / fill-in detail consistency

- Shift detail clinic card uses hardcoded `borderRadius: 16`; job detail uses `radii.lg` (20). Align both to `radii.lg`.
- Consider shared detail shell component.

**Files:**
- `apps/mobile/app/(tabs)/shift/[id].tsx`
- `apps/mobile/app/(tabs)/job/[id].tsx`

---

## Phase 4 — Welcome, splash, and boot sequence

**Priority:** P1 — first impressions.  
**Estimated scope:** ~8–10 files.

### 4.1 Seamless boot (collapse triple loading)

Current sequence: splash → font load hide → `PageLoadingSpinner` → dashboard skeleton → content.

**Target:** Keep native splash visible until route is resolved (`nextRoute` known in `index.tsx`), then hide once. Fallback timeout (e.g. 5s) to prevent stuck splash.

**Files:**
- `apps/mobile/app/_layout.tsx` (delay `SplashScreen.hideAsync`)
- `apps/mobile/app/index.tsx` (call hide when route resolved)
- `apps/mobile/src/components/ui/PageLoadingState.tsx` (make spinner visually continuous with splash if fallback needed)

### 4.2 Web landing page fixes

| Item | Action |
|------|--------|
| Social proof band | Restyle as honest feature strip OR replace with real metrics/logos when available |
| OG image | Add `og:image` meta + create 1200×630 branded share card |
| Theme-aware screenshot | Provide light + dark `web_screenshot.png`; swap on `isDark` in `WelcomeHeroAppPanel` |
| App Store "coming soon" | Move below fold until `APP_STORE_URL` is live |

**Files:**
- `apps/mobile/app/+html.tsx` (og:image meta)
- `apps/mobile/assets/images/` (new OG card, dark screenshot)
- `apps/mobile/src/components/onboarding/WelcomeHeroAppPanel.web.tsx`
- `apps/mobile/src/components/web/marketing/WebLandingSocialProof.web.tsx`
- `apps/mobile/src/components/web/marketing/WebLandingHero.web.tsx`
- `apps/mobile/src/constants/index.ts` (`APP_STORE_URL`)

### 4.3 Native welcome polish (optional)

- Increase headline to ~36–40px / ExtraBold 800
- Optional: subtle product visual behind glow (floating card cluster)

**Files:**
- `apps/mobile/src/components/onboarding/WelcomeHero.tsx`

---

## Phase 5 — Motion, polish, and future enhancements

**Priority:** P2 — high perceived quality, lower urgency.  
**Estimated scope:** scattered across dashboard + list components.

### 5.1 Motion pass

Leverage existing tokens (`140ms` / `220ms` / `420ms`, spring easing).

| Effect | Where |
|--------|-------|
| Staggered card entrance on load | Dashboard, list tabs (extend existing `StaggeredList`) |
| Count-up animation on stat numerals | `DashboardStatCards` |
| Hover lift + border brighten on cards (web) | `SurfaceCard`, list cards |
| Skeleton loaders everywhere (no spinners for content) | Calendar (replace generic list skeleton with calendar-shaped skeleton) |

**Files:**
- `apps/mobile/src/components/dashboard/DashboardStatCards.tsx`
- `apps/mobile/src/components/ui/SurfaceCard.tsx`
- `apps/mobile/src/components/ui/StaggeredList.tsx`
- `apps/mobile/src/theme/web.ts` (hover styles)

### 5.2 Trend deltas on stats

Replace bare counts with context: "12 applications, ▲4 this week". Requires storing/computing week-over-week counts in dashboard data layer.

**Files:**
- `apps/mobile/src/components/dashboard/DashboardStatCards.tsx`
- Dashboard data hooks / API queries in `packages/api/` or screen-level fetch logic

### 5.3 Manual theme toggle (future)

System-only is fine for now. Add Light / Dark / System picker in Settings when front-desk shared machines become a support issue.

**Files:**
- `apps/mobile/src/theme/index.ts` (override hook)
- `apps/mobile/app/(clinic-tabs)/profile/account.tsx` or new appearance setting

### 5.4 Optional accent color exploration

Consider a mint/teal accent (`~#2DD4BF`, tuned) used sparingly for success/filled states. Only pursue if blue/purple semantic cleanup (Phase 0) doesn't feel distinctive enough.

**Files:**
- `apps/mobile/src/theme/colors.ts`

---

## Phase 6 — Light mode as clinic flagship

**Priority:** P2 — strategic, not blocking.  
Do after Phase 0 (palette) so light mode looks intentional.

- Audit all clinic-tab screens in **light mode** and fix contrast/regressions
- Ensure dashboard hero/atmosphere is tuned for light (Phase 0.4 intensity cap)
- Default marketing/welcome screenshots to light mode
- QA shared front-desk scenarios (bright rooms, large monitors)

---

## Suggested execution order

```
Phase 0  →  Phase 1  →  Phase 2  →  Phase 3  →  Phase 4  →  Phase 5  →  Phase 6
(colors)    (errors)    (dash)      (desktop)   (welcome)   (motion)    (light QA)
```

Within each phase, work top-to-bottom in the doc. Commit after each sub-section; one PR per phase is a reasonable granularity.

---

## Key file index (quick reference)

### Theme layer
- `apps/mobile/src/theme/colors.ts`
- `apps/mobile/src/theme/gradients.ts`
- `apps/mobile/src/theme/tokens.ts`
- `apps/mobile/src/theme/glass.ts`
- `apps/mobile/src/theme/web.ts`
- `apps/mobile/src/theme/index.ts`

### Dashboard
- `apps/mobile/app/(clinic-tabs)/index.tsx`
- `apps/mobile/app/(tabs)/index.tsx`
- `apps/mobile/src/components/dashboard/` (all)

### Navigation / shell
- `apps/mobile/src/components/navigation/TabletSidebar.tsx`
- `apps/mobile/src/components/navigation/AdaptiveTabBar.tsx`
- `apps/mobile/src/components/ui/Screen.tsx` / `Screen.web.tsx`

### Clinic tabs
- `apps/mobile/app/(clinic-tabs)/postings.tsx`
- `apps/mobile/app/(clinic-tabs)/applications.tsx`
- `apps/mobile/app/(clinic-tabs)/calendar.tsx`
- `apps/mobile/app/(clinic-tabs)/fill-ins.tsx`
- `apps/mobile/app/(clinic-tabs)/discover/index.tsx`
- `apps/mobile/app/(clinic-tabs)/messages.tsx`
- `apps/mobile/app/(clinic-tabs)/profile/`

### Worker tabs
- `apps/mobile/app/(tabs)/browse.tsx`
- `apps/mobile/app/(tabs)/fillins.tsx`
- `apps/mobile/app/(tabs)/applications.tsx`
- `apps/mobile/app/(tabs)/calendar.tsx`
- `apps/mobile/app/(tabs)/messages/`
- `apps/mobile/app/(tabs)/profile/`

### Welcome / boot
- `apps/mobile/app.json`
- `apps/mobile/app/+html.tsx`
- `apps/mobile/app/_layout.tsx`
- `apps/mobile/app/index.tsx`
- `apps/mobile/app/(onboarding)/welcome.tsx`
- `apps/mobile/app/(onboarding)/welcome.web.tsx`
- `apps/mobile/src/components/onboarding/`
- `apps/mobile/src/components/web/marketing/`

---

## How to run this on your laptop

1. Pull branch or merge this doc from `main`.
2. Open `docs/design-overhaul-plan.md` in Cursor.
3. Start **Plan Mode** (Shift+Tab) or **Agent** and prompt:  
   > Implement Phase 0 from docs/design-overhaul-plan.md. Commit after each sub-section.
4. Review diffs, test light + dark on web (≥1024px) and native.
5. Repeat for Phase 1, 2, etc.

---

## Out of scope (noted but deferred)

- Full marketing site beyond welcome landing (no separate marketing repo changes)
- App Store URL / iOS release (blocked on `APP_STORE_URL = null`)
- RevenueCat / billing UI changes
- New illustration or brand asset commission (OG image can be generated from existing screenshot + wordmark)
