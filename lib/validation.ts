export interface ValidationError {
  field: string;
  message: string;
}

export function validateField(value: string, field: {
  type: string;
  required?: boolean;
  pattern?: string;
  patternMessage?: string;
  maxLength?: number;
}): string | null {
  if (!value || value.trim() === "") {
    return field.required ? "This field is required" : null;
  }

  if (field.maxLength && value.length > field.maxLength) {
    return `Must be ${field.maxLength} characters or less`;
  }

  switch (field.type) {
    case "url":
      try {
        new URL(value);
      } catch {
        return "Must be a valid URL";
      }
      break;
    case "email":
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return "Must be a valid email address";
      }
      break;
    case "number":
      if (isNaN(Number(value))) {
        return "Must be a valid number";
      }
      break;
  }

  if (field.pattern) {
    try {
      const regex = new RegExp(field.pattern);
      if (!regex.test(value)) {
        return field.patternMessage || `Must match pattern: ${field.pattern}`;
      }
    } catch {
      // invalid regex, skip
    }
  }

  return null;
}

export function validateForm(data: Record<string, string>, fields: Array<{
  name: string;
  type: string;
  required?: boolean;
  pattern?: string;
  patternMessage?: string;
  maxLength?: number;
}>): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const field of fields) {
    const error = validateField(data[field.name] || "", field);
    if (error) {
      errors.push({ field: field.name, message: error });
    }
  }

  return errors;
}
