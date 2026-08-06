import { example7_1 } from '../orbital/example7_1';
import { example7_5 } from '../orbital/example7_5';
import { example7_6 } from '../orbital/example7_6';
import { example7_7 } from '../orbital/example7_7';
import { example7_8 } from '../orbital/example7_8';
import type { RegistryEntry } from '../types/example.types';

export const exampleRegistry: Record<string, RegistryEntry> = {
    'example-7-1': {
        id: 'example-7-1',
        title: example7_1.metadata.title,
        description: example7_1.metadata.description,
        category: example7_1.metadata.category,
        config: example7_1,
    },
    'example-7-5': {
        id: 'example-7-5',
        title: example7_5.metadata.title,
        description: example7_5.metadata.description,
        category: example7_5.metadata.category,
        config: example7_5,
    },
    'example-7-6': {
        id: 'example-7-6',
        title: example7_6.metadata.title,
        description: example7_6.metadata.description,
        category: example7_6.metadata.category,
        config: example7_6,
    },
    'example-7-7': {
        id: 'example-7-7',
        title: example7_7.metadata.title,
        description: example7_7.metadata.description,
        category: example7_7.metadata.category,
        config: example7_7,
    },
    'example-7-8': {
        id: 'example-7-8',
        title: example7_8.metadata.title,
        description: example7_8.metadata.description,
        category: example7_8.metadata.category,
        config: example7_8,
    },
};

export const getExampleById = (id: string): RegistryEntry | undefined => {
    return exampleRegistry[id];
};

export const getExamplesByCategory = (category: string): RegistryEntry[] => {
    return Object.values(exampleRegistry).filter((entry) => entry.category === category);
};

export const getAllExamples = (): RegistryEntry[] => {
    return Object.values(exampleRegistry);
};
export type { RegistryEntry };
