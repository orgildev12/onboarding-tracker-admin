import type { IListField, ListItem } from '../services/ListService';

export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/id$/, '');
}

export function numberValue(value: unknown, fallback: number = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return fallback;
}

export function textValue(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

export const dateOnly = (value: unknown): string => textValue(value).substring(0, 10);

// The Image column holds a JSON string like {"serverRelativeUrl":"/sites/x/SiteAssets/a.png",...}
export function imageUrl(value: unknown): string {
  const text = textValue(value);
  if (!text) {
    return '';
  }
  try {
    const parsed = JSON.parse(text) as { serverRelativeUrl?: string; serverUrl?: string };
    if (parsed.serverRelativeUrl) {
      return `${parsed.serverUrl || ''}${parsed.serverRelativeUrl}`;
    }
  } catch {
    // plain URL
  }
  return text;
}

export function booleanValue(value: unknown): boolean {
  return value === true || value === 'true' || value === 1;
}

export function readValue(item: ListItem, names: string[]): unknown {
  for (const name of names) {
    if (item[name] !== undefined) {
      return item[name];
    }
  }
  return undefined;
}

export function readLookupId(item: ListItem, fieldName: string, aliases: string[]): number | undefined {
  const base = fieldName.replace(/id$/i, '');
  const names = [fieldName, base, ...aliases];
  for (const name of names) {
    const value = readValue(item, [name, `${name}Id`, `${name}ID`]);
    if (value && typeof value === 'object' && 'Id' in value) {
      const id = numberValue((value as { Id: unknown }).Id, -1);
      if (id > 0) {
        return id;
      }
    }
    const id = numberValue(value, -1);
    if (id > 0) {
      return id;
    }
  }
  return undefined;
}

export function findLookupField(fields: IListField[], aliases: string[], fallback: string): string {
  const normalizedAliases = aliases.map(normalizeName);
  const field = fields.find(candidate =>
    normalizedAliases.indexOf(normalizeName(candidate.InternalName)) !== -1 ||
    normalizedAliases.indexOf(normalizeName(candidate.Title)) !== -1
  );
  if (!field) {
    return fallback;
  }
  // Lookup columns are written through "<InternalName>Id"; plain Number columns are written directly.
  return field.TypeAsString.indexOf('Lookup') === 0 ? `${field.InternalName}Id` : field.InternalName;
}

export function findFieldName(fields: IListField[], aliases: string[], fallback: string): string {
  const normalizedAliases = aliases.map(normalizeName);
  const field = fields.find(candidate =>
    normalizedAliases.indexOf(normalizeName(candidate.InternalName)) !== -1 ||
    normalizedAliases.indexOf(normalizeName(candidate.Title)) !== -1
  );
  return field ? field.InternalName : fallback;
}
