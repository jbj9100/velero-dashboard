import type { Backup, Restore } from '@/types/velero'

type Phase = Backup['phase'] | Restore['phase']

export function getPhaseVariant(
    phase: Phase
): 'success' | 'danger' | 'warning' | 'info' | 'default' {
    const phaseUpper = phase.toUpperCase()

    if (phaseUpper === 'COMPLETED') return 'success'
    if (phaseUpper === 'FAILED' || phaseUpper === 'PARTIALLYFAILED') return 'danger'
    if (phaseUpper === 'INPROGRESS') return 'info'
    if (phaseUpper === 'NEW') return 'default'
    if (phaseUpper === 'DELETING') return 'warning'

    return 'default'
}

export function getPhaseLabel(phase: Phase): string {
    const phaseUpper = phase.toUpperCase()

    if (phaseUpper === 'PARTIALLYFAILED') return 'Partially Failed'
    if (phaseUpper === 'INPROGRESS') return 'In Progress'

    return phase.charAt(0).toUpperCase() + phase.slice(1)
}
