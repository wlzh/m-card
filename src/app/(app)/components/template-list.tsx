import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@components/ui/alert-dialog';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { useCardStore } from '@src/hooks/useCardStore';
import { hasTemplateName, normalizeTemplateName, useTemplatesStore } from '@src/hooks/useTemplatesStore';
import { applyTemplateToSettings, isUsableTemplate } from './template-settings';

export const TemplateList = () => {
    const templates = useTemplatesStore(state => state.templates);
    const renameTemplate = useTemplatesStore(state => state.renameTemplate);
    const delTemplate = useTemplatesStore(state => state.delTemplate);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [name, setName] = useState('');
    const normalizedName = normalizeTemplateName(name);
    const duplicateName = editingIndex !== null && hasTemplateName(templates, normalizedName, editingIndex);

    return (
        <section aria-label="Saved templates" className="border-b py-3">
            <div className="mb-2 text-sm font-medium">Saved Templates</div>
            {templates.length === 0 && <p className="text-xs text-muted-foreground">Save a template to reuse its card appearance.</p>}
            <div className="grid gap-2">
                {templates.map((template, index) => {
                    const label = normalizeTemplateName(template.name) || `Untitled ${index + 1}`;
                    return (
                        <div key={index} className="rounded-md border p-2">
                            {editingIndex === index ? (
                                <div className="flex flex-wrap items-center gap-2">
                                    <Input aria-label={`Rename ${label}`} className="min-w-[140px] flex-1" maxLength={60} value={name} onChange={event => setName(event.target.value)} />
                                    <Button type="button" size="sm" disabled={!normalizedName || duplicateName} onClick={() => {
                                        renameTemplate(index, normalizedName);
                                        setEditingIndex(null);
                                    }}>Save</Button>
                                    <Button type="button" size="sm" variant="secondary" onClick={() => setEditingIndex(null)}>Cancel</Button>
                                    {duplicateName && <p role="alert" className="w-full text-xs text-red-600">A template with this name already exists.</p>}
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="min-w-[120px] flex-1 truncate text-sm" title={label}>{label}</span>
                                    <Button type="button" size="sm" variant="secondary" disabled={!isUsableTemplate(template)} onClick={() => {
                                        const current = useCardStore.getState();
                                        useCardStore.setState(applyTemplateToSettings(current, template));
                                    }}>Apply</Button>
                                    <Button type="button" size="sm" variant="ghost" onClick={() => {
                                        setEditingIndex(index);
                                        setName(label);
                                    }}>Rename</Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild><Button type="button" size="sm" variant="ghost">Delete</Button></AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete template?</AlertDialogTitle>
                                                <AlertDialogDescription>Delete "{label}" from this browser. This cannot be undone.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => {
                                                    delTemplate(index);
                                                    setEditingIndex(null);
                                                }}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
};
