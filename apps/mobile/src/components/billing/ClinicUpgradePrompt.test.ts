import { describe, expect, it } from 'vitest';

import {
  getClinicAddLocationUpgradeMessage,
  getClinicAddManagerUpgradeMessage,
  getClinicCrmUpgradeMessage,
  getClinicDiscoverUpgradeMessage,
  getClinicGeneralMessagingUpgradeMessage,
  getClinicPdfExportUpgradeMessage,
  getClinicScreeningUpgradeMessage,
  getClinicUpgradePromptMessage,
  getClinicUpgradePromptTitle,
} from './clinicUpgradePromptCopy';

describe('ClinicUpgradePrompt Phase B helpers', () => {
  it('titles Phase B reasons', () => {
    expect(getClinicUpgradePromptTitle('screening')).toBe('Upgrade for screening');
    expect(getClinicUpgradePromptTitle('crm')).toBe('Upgrade for CRM');
    expect(getClinicUpgradePromptTitle('pdf_export')).toBe('Upgrade for PDF export');
    expect(getClinicUpgradePromptTitle('discover')).toBe('Upgrade for Discover');
    expect(getClinicUpgradePromptTitle('general_messaging')).toBe('Upgrade for messaging');
    expect(getClinicUpgradePromptTitle('add_location')).toBe('Upgrade to add locations');
    expect(getClinicUpgradePromptTitle('add_manager')).toBe('Upgrade to invite managers');
  });

  it('points Free clinics at Starter/Pro and Free groups at Group plans', () => {
    expect(getClinicScreeningUpgradeMessage('clinic')).toContain('Starter or Pro');
    expect(getClinicScreeningUpgradeMessage('group')).toContain('Group Starter or Group Pro');
    expect(getClinicCrmUpgradeMessage('group')).toContain('Group Starter or Group Pro');
    expect(getClinicPdfExportUpgradeMessage('clinic')).toContain('Starter or Pro');
    expect(getClinicDiscoverUpgradeMessage('clinic')).toContain('Starter or Pro');
    expect(getClinicGeneralMessagingUpgradeMessage('group')).toContain('Group Starter');
  });

  it('explains Free group location and manager caps', () => {
    expect(getClinicAddLocationUpgradeMessage('group', 2)).toContain('2 locations');
    expect(getClinicAddLocationUpgradeMessage('clinic', 1)).toContain('Group plan');
    expect(getClinicAddManagerUpgradeMessage(1)).toContain('1 manager');
    expect(getClinicAddManagerUpgradeMessage(0)).toContain('Group plan');
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
      getClinicUpgradePromptMessage('screening', {
        plan: 'free',
        planFamily: 'clinic',
      }),
    ).toContain('Screening questions');
  });
});
