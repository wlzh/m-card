import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import { get, set, del } from 'idb-keyval' // can use anything: IndexedDB, Ionic Storage, etc.
import { type CardStore } from './useCardStore'

export type Template = Pick<CardStore, 'colorIndex' | 'backgroundStyles' | 'cardStyles' | 'tabConfig'> & {
    name: string;
}

export const normalizeTemplateName = (value: unknown) =>
    typeof value === 'string' ? value.trim().slice(0, 60) : '';

export const hasTemplateName = (templates: Template[], name: string, exceptIndex = -1) =>
    templates.some((template, index) => index !== exceptIndex &&
        normalizeTemplateName(template.name).toLocaleLowerCase() === name.toLocaleLowerCase());

let writeTask: Promise<void> | null = null;
const enqueueWrite = (write: () => Promise<void>) => {
    const next = writeTask ? writeTask.catch(() => {}).then(write) : write();
    writeTask = next;
    void next.finally(() => {
        if (writeTask === next) writeTask = null;
    }).catch(() => {});
    return next;
};

const storage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        await writeTask;
        return (await get(name)) || null
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await enqueueWrite(() => set(name, value))
    },
    removeItem: async (name: string): Promise<void> => {
        await enqueueWrite(() => del(name))
    },
}

interface TemplatesStore {
    templates: Template[];
    addTemplate: (template: Template) => void;
    renameTemplate: (index: number, name: string) => void;
    delTemplate: (index: number) => void;
}

export const useTemplatesStore = create(
    persist<TemplatesStore, [], [], Pick<TemplatesStore, 'templates'>>((set, get) => ({
        templates: [],
        addTemplate: (template) => {
            const name = normalizeTemplateName(template.name);
            if (!name || hasTemplateName(get().templates, name)) return;
            set({
                templates: [...get().templates, { ...template, name }]
            })
        },
        renameTemplate: (index, value) => {
            const name = normalizeTemplateName(value);
            const templates = get().templates;
            if (!name || !templates[index] || hasTemplateName(templates, name, index)) return;
            set({ templates: templates.map((template, i) => i === index ? { ...template, name } : template) });
        },
        delTemplate: (index) => {
            set({
                templates: get().templates.filter((_, i) => i !== index)
            })
        }
    }), {
        name: 'templates',
        storage: createJSONStorage(() => storage),
        merge: (persisted, current) => {
            const value = persisted as { templates?: unknown } | null;
            return {
                ...current,
                templates: Array.isArray(value?.templates)
                    ? value.templates.filter((item): item is Template => !!item && typeof item === 'object')
                    : [],
            };
        },
        partialize: (state) => ({
            templates: state.templates
        })
    })
)
