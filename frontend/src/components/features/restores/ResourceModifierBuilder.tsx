import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Plus, Trash2, Code } from 'lucide-react'
import type { ResourceModifierRule, JSONPatch, ResourceModifierConditions } from '@/types/velero'

interface ResourceModifierBuilderProps {
    rules: ResourceModifierRule[]
    onChange: (rules: ResourceModifierRule[]) => void
}

export default function ResourceModifierBuilder({ rules, onChange }: ResourceModifierBuilderProps) {
    const addRule = () => {
        onChange([
            ...rules,
            {
                conditions: {
                    namespaces: ['default'],
                },
                patches: [
                    {
                        operation: 'replace',
                        path: '/spec/replicas',
                        value: '1',
                    },
                ],
            },
        ])
    }

    const removeRule = (index: number) => {
        onChange(rules.filter((_, i) => i !== index))
    }

    const updateCondition = (index: number, key: keyof ResourceModifierConditions, value: string | string[]) => {
        const newRules = [...rules]
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        newRules[index].conditions[key] = value
        onChange(newRules)
    }

    const updatePatch = (ruleIndex: number, patchIndex: number, key: keyof JSONPatch, value: string) => {
        const newRules = [...rules]
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        newRules[ruleIndex].patches[patchIndex][key] = value
        onChange(newRules)
    }

    const addPatch = (ruleIndex: number) => {
        const newRules = [...rules]
        newRules[ruleIndex].patches.push({
            operation: 'replace',
            path: '',
            value: '',
        })
        onChange(newRules)
    }

    const removePatch = (ruleIndex: number, patchIndex: number) => {
        const newRules = [...rules]
        newRules[ruleIndex].patches.splice(patchIndex, 1)
        onChange(newRules)
    }

    return (
        <div className="space-y-4">
            {rules.map((rule, ruleIdx) => (
                <Card key={ruleIdx} className="border border-gray-700">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-700/50">
                        <h4 className="font-semibold text-gray-100 flex items-center">
                            <Code className="w-4 h-4 mr-2 text-primary" />
                            Modification Rule #{ruleIdx + 1}
                        </h4>
                        <Button variant="danger" size="sm" onClick={() => removeRule(ruleIdx)}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="space-y-6">
                        {/* Conditions Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">
                                    Conditions: Namespaces (comma separated)
                                </label>
                                <input
                                    className="w-full bg-dark-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100"
                                    value={rule.conditions.namespaces?.join(', ') || ''}
                                    onChange={(e) =>
                                        updateCondition(
                                            ruleIdx,
                                            'namespaces',
                                            e.target.value.split(',').map((s) => s.trim())
                                        )
                                    }
                                    placeholder="e.g. default, production"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">
                                    Conditions: Resource Group (optional)
                                </label>
                                <input
                                    className="w-full bg-dark-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100"
                                    value={rule.conditions.groupResource || ''}
                                    onChange={(e) => updateCondition(ruleIdx, 'groupResource', e.target.value)}
                                    placeholder="e.g. deployments.apps"
                                />
                            </div>
                        </div>

                        {/* Patches Section */}
                        <div className="bg-dark-900/30 p-4 rounded-lg">
                            <label className="block text-xs font-medium text-primary mb-3">JSON Patches</label>
                            {rule.patches.map((patch, patchIdx) => (
                                <div key={patchIdx} className="grid grid-cols-12 gap-2 mb-2 items-center">
                                    <div className="col-span-3">
                                        <select
                                            className="w-full bg-dark-950 border border-gray-700 rounded-lg px-2 py-2 text-xs text-gray-100"
                                            value={patch.operation}
                                            onChange={(e) => updatePatch(ruleIdx, patchIdx, 'operation', e.target.value)}
                                        >
                                            <option value="replace">replace</option>
                                            <option value="add">add</option>
                                            <option value="remove">remove</option>
                                        </select>
                                    </div>
                                    <div className="col-span-4">
                                        <input
                                            className="w-full bg-dark-950 border border-gray-700 rounded-lg px-2 py-2 text-xs text-gray-100"
                                            value={patch.path}
                                            onChange={(e) => updatePatch(ruleIdx, patchIdx, 'path', e.target.value)}
                                            placeholder="/spec/replicas"
                                        />
                                    </div>
                                    <div className="col-span-4">
                                        <input
                                            className="w-full bg-dark-950 border border-gray-700 rounded-lg px-2 py-2 text-xs text-gray-100"
                                            value={String(patch.value || '')}
                                            onChange={(e) => updatePatch(ruleIdx, patchIdx, 'value', e.target.value)}
                                            placeholder="value"
                                        />
                                    </div>
                                    <div className="col-span-1 flex justify-end">
                                        <Button variant="ghost" size="sm" onClick={() => removePatch(ruleIdx, patchIdx)}>
                                            <Trash2 className="w-3 h-3 text-gray-500 hover:text-danger" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            <Button variant="secondary" size="sm" className="mt-2 w-full" onClick={() => addPatch(ruleIdx)}>
                                <Plus className="w-3 h-3 mr-1" /> Add Patch
                            </Button>
                        </div>
                    </div>
                </Card>
            ))}

            <Button variant="primary" className="w-full border-dashed border-2 border-primary/30 bg-transparent hover:bg-primary/5" onClick={addRule}>
                <Plus className="w-4 h-4 mr-2" /> Add Valid Modification Rule
            </Button>
        </div>
    )
}
