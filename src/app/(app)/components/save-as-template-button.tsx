import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@components/ui/alert-dialog';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { useCardStore } from '@src/hooks/useCardStore';
import { hasTemplateName, normalizeTemplateName, useTemplatesStore } from '@src/hooks/useTemplatesStore';

export const SaveAsTemplateButton = () => {
    const templates = useTemplatesStore(state => state.templates);
    const addTemplate = useTemplatesStore((state) => state.addTemplate);
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const normalizedName = normalizeTemplateName(name);
    const duplicateName = hasTemplateName(templates, normalizedName);

    return (<AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
            <Button type="button" size="sm">Save as Template</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Save card template</AlertDialogTitle>
                <Input aria-label="Template name" maxLength={60} value={name} onChange={event => setName(event.target.value)} placeholder="Template name" />
                {duplicateName && <p role="alert" className="text-xs text-red-600">A template with this name already exists.</p>}
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction disabled={!normalizedName || duplicateName} onClick={() => {
                    const { colorIndex, backgroundStyles, cardStyles, tabConfig } = useCardStore.getState();
                    addTemplate({ name: normalizedName, colorIndex, backgroundStyles, cardStyles, tabConfig });
                    setName('');
                }}>Save</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>)
}
