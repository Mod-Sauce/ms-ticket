import fs from "fs";
import path from "path";
import matter from "gray-matter";

const TEMPLATES_DIR = path.join(process.cwd(), "templates");

export interface TemplateField {
  name: string;
  label: string;
  type: "text" | "textarea" | "url" | "email" | "number" | "select" | "file" | "checkbox";
  required?: boolean;
  placeholder?: string;
  options?: string[]; // for select
  pattern?: string; // regex
  patternMessage?: string;
  maxLength?: number;
}

export interface Template {
  slug: string;
  name: string;
  description?: string;
  fields: TemplateField[];
  content?: string; // remaining md content after frontmatter
}

export function getAllTemplates(): Template[] {
  if (!fs.existsSync(TEMPLATES_DIR)) return [];

  const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith(".md"));
  return files.map(filename => {
    const slug = filename.replace(".md", "");
    const raw = fs.readFileSync(path.join(TEMPLATES_DIR, filename), "utf-8");
    const { data, content } = matter(raw);

    return {
      slug,
      name: data.name || slug,
      description: data.description || "",
      fields: data.fields || [],
      content: content.trim(),
    };
  });
}

export function getTemplate(slug: string): Template | null {
  const filePath = path.join(TEMPLATES_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    name: data.name || slug,
    description: data.description || "",
    fields: data.fields || [],
    content: content.trim(),
  };
}

export function saveTemplate(slug: string, data: { name: string; description?: string; fields: TemplateField[]; content?: string }) {
  const filePath = path.join(TEMPLATES_DIR, `${slug}.md`);
  const frontmatter = [
    "---",
    `name: ${data.name}`,
    data.description ? `description: ${data.description}` : "",
    "fields:",
    ...data.fields.map(f => {
      let line = `  - name: ${f.name}`;
      line += `\n    label: ${f.label || f.name}`;
      line += `\n    type: ${f.type}`;
      if (f.required) line += `\n    required: true`;
      if (f.placeholder) line += `\n    placeholder: ${f.placeholder}`;
      if (f.options?.length) line += `\n    options: [${f.options.join(", ")}]`;
      if (f.pattern) line += `\n    pattern: ${f.pattern}`;
      if (f.patternMessage) line += `\n    patternMessage: ${f.patternMessage}`;
      if (f.maxLength) line += `\n    maxLength: ${f.maxLength}`;
      return line;
    }),
    "---",
    "",
    data.content || "",
  ].filter(l => l !== "").join("\n");

  fs.writeFileSync(filePath, frontmatter, "utf-8");
  return getTemplate(slug);
}
