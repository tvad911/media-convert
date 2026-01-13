import { useState, useEffect } from 'react';
import { Store } from '@tauri-apps/plugin-store';

let store: Store | null = null;

async function getStore() {
    if (!store) {
        store = await Store.load('settings.json');
    }
    return store;
}

export function usePersistentState<T>(
    key: string,
    defaultValue: T
): [T, (value: T) => void] {
    const [value, setValue] = useState<T>(defaultValue);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load initial value from store
    useEffect(() => {
        async function loadValue() {
            try {
                const storeInstance = await getStore();
                const stored = await storeInstance.get<T>(key);
                if (stored !== null && stored !== undefined) {
                    setValue(stored);
                }
                setIsLoaded(true);
            } catch (error) {
                console.error(`Failed to load ${key} from store:`, error);
                setIsLoaded(true);
            }
        }
        loadValue();
    }, [key]);

    // Save to store whenever value changes
    const setPersistentValue = async (newValue: T) => {
        setValue(newValue);
        if (isLoaded) {
            try {
                const storeInstance = await getStore();
                await storeInstance.set(key, newValue);
                await storeInstance.save();
            } catch (error) {
                console.error(`Failed to save ${key} to store:`, error);
            }
        }
    };

    return [value, setPersistentValue];
}
