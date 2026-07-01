# TestFlight smoke test checklist

Complete on a **physical iPhone** with a **production or preview EAS build** (not Expo Go). Install via TestFlight.

Record build number, date, and tester name when signing off.

## Setup

- [ ] Build installed from TestFlight (`preview` or `production` profile)
- [ ] Device notifications allowed for Chairside
- [ ] Production Supabase + Pingram + APNs configured per [APP_STORE_RELEASE.md](./APP_STORE_RELEASE.md)

## Authentication

- [ ] Email sign-up sends confirmation (or sign-in if already confirmed)
- [ ] Email sign-in works
- [ ] Forgot password email opens app → reset password screen
- [ ] Sign in with Apple works (iOS native)
- [ ] Sign in with Google works
- [ ] Sign out and sign back in

## Worker flow

- [ ] Role selection → worker onboarding completes
- [ ] Location / address autocomplete (Mapbox) works
- [ ] Application kit: upload photo and resume
- [ ] Browse roles and fill-ins load
- [ ] Map view renders clinic pins
- [ ] Apply to a role (screening if required)
- [ ] View application status
- [ ] Profile → Notifications toggles save

## Clinic flow

- [ ] Role selection → clinic onboarding completes
- [ ] Clinic location with address search
- [ ] Post a job and/or fill-in shift
- [ ] Receive or view application (use second test account as worker)
- [ ] Review applicant detail; open resume in-app PDF viewer
- [ ] Send a message in application or conversation thread

## Notifications

- [ ] Permission prompt appears after onboarding
- [ ] Pingram End Users shows device token for test user
- [ ] Push banner arrives for test event (e.g. worker applies → clinic user)
- [ ] Tapping push opens correct in-app screen
- [ ] In-app notification bell shows history

## Account & legal

- [ ] Profile → Account → Legal links open privacy/support/terms
- [ ] Profile → Account → Delete account (use throwaway account only)
- [ ] Deleted user cannot sign in; other party sees "no longer on Chairside" where applicable

## Deep links & misc

- [ ] `chairside://auth/callback` auth flow from email links
- [ ] Add interview to calendar (native calendar sheet or fallback)
- [ ] Open clinic location in Apple Maps
- [ ] App background/foreground refresh does not crash

## Sign-off

| Field | Value |
| ----- | ----- |
| Build version | |
| Build number | |
| TestFlight build ID | |
| Tested by | |
| Date | |
| Blockers | |

If all items pass, submit for App Review with notes from [APP_STORE_CONNECT.md](./APP_STORE_CONNECT.md).

```bash
cd apps/mobile
eas submit --profile production --platform ios
```
