import { describe, expect, it } from 'vitest';

import {
  getClinicAddLocationUpgradeMessage,
  getClinicAddManagerUpgradeMessage,
  getClinicCrmUpgradeMessage,
  getClinicDiscoverUpgradeMessage,
  getClinicGeneralMessagingUpgradeMessage,
  getClinicHiringInsightsUpgradeMessage,
  getClinicBulkOutreachUpgradeMessage,
  getClinicPdfExportUpgradeMessage,
  getClinicScreeningCapUpgradeMessage,
  getClinicScreeningUpgradeMessage,
  getClinicUpgradePromptMessage,
  getClinicUpgradePromptTitle,
} from './clinicUpgradePromptCopy';

describe('ClinicUpgradePrompt Phase B helpers', () => {
  it('titles Phase B reasons', () => {
    expect(getClinicUpgradePromptTitle('screening')).toBe('Upgrade for screening');
    expect(getClinicUpgradePromptTitle('crm')).toBe('Upgrade for private notes');
    expect(getClinicUpgradePromptTitle('pdf_export')).toBe('Upgrade for PDF export');
    expect(getClinicUpgradePromptTitle('discover')).toBe('Upgrade for Discover');
    expect(getClinicUpgradePromptTitle('general_messaging')).toBe('Upgrade for open inquiries');
    expect(getClinicUpgradePromptTitle('add_location')).toBe('Upgrade to add locations');
    expect(getClinicUpgradePromptTitle('add_manager')).toBe('Upgrade to invite managers');
    expect(getClinicUpgradePromptTitle('hiring_insights')).toBe('Upgrade for hiring insights');
    expect(getClinicUpgradePromptTitle('bulk_outreach')).toBe('Upgrade for bulk outreach');
    expect(getClinicUpgradePromptTitle('screening_cap')).toBe(
      'Upgrade for more custom questions',
    );
  });

  it('points Free clinics at Starter/Pro and Free groups at Group plans', () => {
    expect(getClinicScreeningUpgradeMessage('clinic')).toContain('Starter or Pro');
    expect(getClinicScreeningUpgradeMessage('group')).toContain('Group Starter or Group Pro');
    expect(getClinicCrmUpgradeMessage('group')).toContain('Group Starter or Group Pro');
    expect(getClinicPdfExportUpgradeMessage('clinic')).toContain('Starter or Pro');
    expect(getClinicDiscoverUpgradeMessage('clinic')).toContain('Starter or Pro');
    expect(getClinicGeneralMessagingUpgradeMessage('group')).toContain('Group Pro');
    expect(getClinicGeneralMessagingUpgradeMessage('clinic')).toContain('already message applicants');
    expect(getClinicGeneralMessagingUpgradeMessage('clinic')).toContain('Clinic Pro');
    expect(getClinicGeneralMessagingUpgradeMessage('clinic')).toContain('open inquiries');
    expect(getClinicScreeningCapUpgradeMessage('clinic')).toContain('5 custom screening');
    expect(getClinicHiringInsightsUpgradeMessage('group')).toContain('Group Pro');
    expect(getClinicBulkOutreachUpgradeMessage('clinic')).toContain('Clinic Pro');
  });

  it('explains Free group location and manager caps', () => {
    expect(getClinicAddLocationUpgradeMessage('group', 2)).toContain('2 locations');
    expect(getClinicAddLocationUpgradeMessage('group', 2)).toContain('hiring tools only');
    expect(getClinicAddLocationUpgradeMessage('clinic', 1)).toContain('Group plan');
    expect(getClinicAddManagerUpgradeMessage(1, 'group')).toContain('1 manager');
    expect(getClinicAddManagerUpgradeMessage(1, 'group')).toContain('hiring tools only');
    expect(getClinicAddManagerUpgradeMessage(0, 'clinic')).toContain('Group plan');
  });

  it('routes messages through getClinicUpgradePromptMessage', () => {
    expect(
      getClinicUpgradePromptMessage('add_location', {
        plan: 'free',
        planFamily: 'group',
        maxLocations: 2,
      }),
    ).toContain('2 locations');
    expect(
      getClinicUpgradePromptMessage('add_manager', {
        plan: 'free',
        planFamily: 'group',
        maxManagers: 1,
      }),
    ).toContain('1 manager');
    expect(
      getClinicUpgradePromptMessage('screening', {
        plan: 'free',
        planFamily: 'clinic',
      }),
    ).toContain('Screening lets you filter');
  });
});
