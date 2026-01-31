// Velero API Response Types
export interface Backup {
    name: string
    phase: string
    startTimestamp: string
    completionTimestamp: string | null
    warnings: number
    errors: number
    backupStorage?: string
}

export interface Restore {
    name: string
    phase: string
    backupName: string
    startTimestamp: string
    completionTimestamp: string | null
    warnings: number
    errors: number
}

export interface Schedule {
    name: string
    schedule: string
    lastBackup: string | null
    enabled: boolean
    template?: {
        includedNamespaces?: string[]
        excludedNamespaces?: string[]
        ttl?: string
    }
}

export interface BackupStorageLocation {
    name: string
    provider: string
    bucket: string
    prefix?: string
    accessMode: string
    phase: string
    lastValidationTime?: string
    message?: string
}

// Request Types
export interface CreateBackupRequest {
    name: string
    includedNamespaces?: string[]
    excludedNamespaces?: string[]
    ttl?: string
}

export interface CreateRestoreRequest {
    name: string
    backupName: string
    includedNamespaces?: string[]
    excludedNamespaces?: string[]
}

export interface JSONPatch {
    operation: 'add' | 'remove' | 'replace' | 'copy' | 'move' | 'test'
    path: string
    value?: unknown
    from?: string
}

export interface ResourceModifierConditions {
    groupResource?: string
    resourceNameRegex?: string
    namespaces?: string[]
    labelSelector?: Record<string, string>
}

export interface ResourceModifierRule {
    conditions: ResourceModifierConditions
    patches: JSONPatch[]
}

export interface CreateRestoreWithModificationsRequest {
    name: string
    backupName: string
    includedNamespaces?: string[]
    excludedNamespaces?: string[]
    resourceModifierRules: ResourceModifierRule[]
}
