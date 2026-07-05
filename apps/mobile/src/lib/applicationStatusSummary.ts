import { FILL_IN_PENDING_STATUSES, type ApplicationStatus } from '@chairside/api';
import {
  hasPendingInterviewProposal,
  isAwaitingApplicationKit,
  isScreeningStageStatus,
  type ApplicationPostType,
} from '@chairside/config';

export type ApplicationStatusSummaryAudience = 'worker' | 'clinic';

export type ApplicationStatusSummaryInput = {
  status: ApplicationStatus | string;
  postType: ApplicationPostType;
  applicationKitRequestedAt?: string | null;
  applicationKitSubmittedAt?: string | null;
  interviewProposedAt?: string | null;
  statusNote?: string | null;
  statusClosedBy?: 'clinic' | 'worker' | null;
  workerAccountDeleted?: boolean;
  clinicAccountDeleted?: boolean;
};

export type ApplicationStatusSummary = {
  headline: string;
  description: string;
  nextStep?: string;
  variant: 'default' | 'info' | 'warning' | 'success';
};

function cancelledFillInSummary(
  application: ApplicationStatusSummaryInput,
  audience: ApplicationStatusSummaryAudience,
): ApplicationStatusSummary | null {
  const note = application.statusNote?.trim();
  if (
    application.postType !== 'shift' ||
    application.status !== 'rejected' ||
    !application.statusClosedBy
  ) {
    return null;
  }

  if (application.statusClosedBy === 'clinic') {
    return audience === 'worker'
      ? {
          headline: 'Fill-in cancelled by clinic',
          description: note ?? 'The clinic cancelled this confirmed fill-in.',
          nextStep: 'This fill-in may reopen for other candidates.',
          variant: 'warning',
        }
      : {
          headline: 'Fill-in cancelled',
          description: note ?? 'You cancelled this confirmed fill-in.',
          nextStep: 'The fill-in has been reopened for new cover requests.',
          variant: 'default',
        };
  }

  if (application.statusClosedBy === 'worker') {
    return audience === 'worker'
      ? {
          headline: 'Shift cancelled',
          description: 'You cancelled this confirmed fill-in.',
          variant: 'default',
        }
      : {
          headline: 'Candidate cancelled shift',
          description: 'The candidate cancelled this confirmed fill-in.',
          nextStep: 'The fill-in has been reopened for new cover requests.',
          variant: 'default',
        };
  }

  return null;
}

function toKitFields(application: ApplicationStatusSummaryInput) {
  return {
    status: application.status,
    application_kit_requested_at: application.applicationKitRequestedAt,
    application_kit_submitted_at: application.applicationKitSubmittedAt,
  };
}

function screeningWorkerSummary(
  application: ApplicationStatusSummaryInput,
): ApplicationStatusSummary {
  if (isAwaitingApplicationKit(toKitFields(application))) {
    return {
      headline: 'Application profile requested',
      description:
        'The clinic reviewed your screening responses and wants your application profile.',
      nextStep: 'Submit your photo, resume, and cover note below.',
      variant: 'warning',
    };
  }

  return {
    headline: 'Screening submitted',
    description:
      'Your screening responses were sent to the clinic. They will review them before deciding whether to request your application profile.',
    nextStep: 'You will be notified if the clinic requests your application profile.',
    variant: 'info',
  };
}

function screeningClinicSummary(
  application: ApplicationStatusSummaryInput,
  isHighlighted: boolean,
): ApplicationStatusSummary {
  if (isAwaitingApplicationKit(toKitFields(application))) {
    return {
      headline: 'Awaiting full application',
      description: 'You requested the full application. The candidate has not submitted it yet.',
      nextStep: 'You will be notified when they submit their full application.',
      variant: 'default',
    };
  }

  return {
    headline: isHighlighted ? 'New screening submission' : 'Screening needs review',
    description:
      'Review the screening responses first. If this candidate looks like a fit, request the full application so they can submit their photo, resume, and cover note.',
    nextStep: 'Use Request full application after you have reviewed their responses.',
    variant: isHighlighted ? 'warning' : 'info',
  };
}

export function getApplicationStatusSummary(
  application: ApplicationStatusSummaryInput,
  audience: ApplicationStatusSummaryAudience,
  options?: { isHighlighted?: boolean },
): ApplicationStatusSummary | null {
  const { status, postType } = application;
  const isHighlighted = options?.isHighlighted ?? false;

  if (audience === 'worker' && application.clinicAccountDeleted) {
    return {
      headline: 'Clinic no longer on Chairside',
      description: 'This clinic is no longer signed up for Chairside.',
      variant: 'default',
    };
  }

  if (audience === 'clinic' && application.workerAccountDeleted) {
    return {
      headline: 'Candidate no longer on Chairside',
      description: 'This candidate is no longer signed up for Chairside.',
      variant: 'default',
    };
  }

  if (isScreeningStageStatus(status)) {
    return audience === 'worker'
      ? screeningWorkerSummary(application)
      : screeningClinicSummary(application, isHighlighted);
  }

  if (postType === 'shift') {
    if (
      FILL_IN_PENDING_STATUSES.includes(
        status as (typeof FILL_IN_PENDING_STATUSES)[number],
      )
    ) {
      return audience === 'worker'
        ? {
            headline: status === 'applied' ? 'Cover request sent' : 'Awaiting clinic response',
            description:
              status === 'applied'
                ? 'Your request to cover this fill-in was submitted to the clinic.'
                : 'Your cover request is with the clinic.',
            nextStep: 'The clinic will accept or decline your request.',
            variant: 'info',
          }
        : {
            headline:
              isHighlighted && status === 'applied'
                ? 'New cover request'
                : 'Cover request received',
            description:
              'Review this candidate and accept or decline their request to cover this fill-in.',
            nextStep: 'Accept the cover request or decline if it is not a fit.',
            variant: isHighlighted && status === 'applied' ? 'warning' : 'info',
          };
    }

    if (status === 'hired' || status === 'selected') {
      return {
        headline: 'Fill-in confirmed',
        description:
          audience === 'worker'
            ? 'This fill-in was confirmed.'
            : 'This candidate was confirmed for the fill-in.',
        variant: 'success',
      };
    }

    if (status === 'rejected') {
      return (
        cancelledFillInSummary(application, audience) ?? {
          headline: 'Declined',
          description:
            audience === 'worker'
              ? 'This cover request was declined.'
              : 'You declined this cover request.',
          variant: 'default',
        }
      );
    }
  }

  if (status === 'applied') {
    return audience === 'worker'
      ? {
          headline: 'Application submitted',
          description: 'Your application profile was sent to the clinic.',
          nextStep: 'The clinic is reviewing your application.',
          variant: 'info',
        }
      : {
          headline: isHighlighted ? 'New application' : 'Application received',
          description: 'Review the candidate profile, cover note, and documents.',
          nextStep: 'Mark viewed, shortlist, or decline when you have reviewed the application.',
          variant: isHighlighted ? 'warning' : 'info',
        };
  }

  if (status === 'reviewed') {
    return audience === 'worker'
      ? {
          headline: 'Application viewed',
          description: 'The clinic viewed your application.',
          nextStep: 'They may shortlist you or follow up with next steps.',
          variant: 'default',
        }
      : {
          headline: 'Application viewed',
          description: 'You have viewed this application.',
          nextStep: 'Shortlist the candidate or decline if they are not a fit.',
          variant: 'default',
        };
  }

  if (status === 'in_progress') {
    return {
      headline: 'Shortlisted',
      description:
        audience === 'worker'
          ? 'The clinic shortlisted you for this role.'
          : 'This candidate is on your shortlist.',
      nextStep:
        audience === 'worker'
          ? 'Watch for interview invitations or messages from the clinic.'
          : 'Schedule an interview or continue the conversation.',
      variant: 'info',
    };
  }

  if (status === 'interview_offered') {
    return {
      headline: 'Interview invitation',
      description:
        audience === 'worker'
          ? 'The clinic sent an interview invitation.'
          : 'Interview invitation sent to the candidate.',
      nextStep:
        audience === 'worker'
          ? 'Review the details and respond below.'
          : 'Awaiting candidate response.',
      variant: 'warning',
    };
  }

  if (status === 'interview_scheduled') {
    const hasProposal = hasPendingInterviewProposal({
      interview_proposed_at: application.interviewProposedAt,
    });
    return {
      headline: hasProposal ? 'Interview time proposed' : 'Interview scheduled',
      description: hasProposal
        ? audience === 'worker'
          ? 'The clinic proposed a new interview time.'
          : 'The candidate proposed a new interview time.'
        : audience === 'worker'
          ? 'Your interview is scheduled.'
          : 'The interview is scheduled.',
      nextStep: hasProposal
        ? 'Review the proposed time and respond below.'
        : audience === 'worker'
          ? 'Check the scheduled time below.'
          : 'Mark hired when the process is complete.',
      variant: hasProposal ? 'warning' : 'info',
    };
  }

  if (status === 'selected' || status === 'hired') {
    return {
      headline: 'Hired',
      description:
        audience === 'worker'
          ? 'You were hired for this role.'
          : 'This candidate was marked hired.',
      variant: 'success',
    };
  }

  if (status === 'rejected') {
    return {
      headline: 'Not moving forward',
      description:
        audience === 'worker'
          ? 'This application was declined.'
          : 'You declined this application.',
      variant: 'default',
    };
  }

  return null;
}
