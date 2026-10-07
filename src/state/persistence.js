import { useCallback, useEffect, useState } from 'react';

export function isRecordArray(value) {
  return Array.isArray(value) && value.every((entry) => (
    entry !== null && typeof entry === 'object' && !Array.isArray(entry)
  ));
}

export function usePersistentState(key, initialValue, validate = isRecordArray) {
  const [record, setRecord] = useState(() => {
    try {
      const serialized = window.localStorage.getItem(key);
      if (serialized === null) return { value: initialValue, error: '', persist: false };

      const value = JSON.parse(serialized);
      if (!validate(value)) throw new Error('Saved data has an unexpected structure.');
      return { value, error: '', persist: false };
    } catch (error) {
      console.error(`Unable to load saved Clariva data (${key}).`, error);
      return {
        value: initialValue,
        error: `Saved ${key.split('.').at(-2)} data could not be loaded. Defaults are shown; changes may replace the damaged saved data.`,
        persist: false,
      };
    }
  });

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== key || event.newValue === null) return;
      try {
        const value = JSON.parse(event.newValue);
        if (!validate(value)) throw new Error('Saved data has an unexpected structure.');
        setRecord({ value, error: '', persist: false });
      } catch (error) {
        console.error(`Unable to read updated Clariva data (${key}).`, error);
        setRecord((current) => ({
          ...current,
          error: `Updated ${key.split('.').at(-2)} data could not be read. Reload the page to restore saved data.`,
          persist: false,
        }));
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key, validate]);

  useEffect(() => {
    if (!record.persist) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(record.value));
    } catch (error) {
      console.error(`Unable to save Clariva data (${key}).`, error);
      setRecord((current) => ({
        ...current,
        error: 'Changes could not be saved in this browser. Check available storage and try again.',
        persist: false,
      }));
    }
  }, [key, record.persist, record.value]);

  const setValue = useCallback((update) => {
    setRecord((current) => ({
      ...current,
      value: typeof update === 'function' ? update(current.value) : update,
      error: '',
      persist: true,
    }));
  }, []);

  return [record.value, setValue, record.error];
}
