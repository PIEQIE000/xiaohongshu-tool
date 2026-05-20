export function renderPrompt(template: string, variables: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value)
  }
  return result
}

export function extractVariables(template: string): string[] {
  const matches = template.match(/\{([^}]+)\}/g) || []
  return [...new Set(matches.map((m) => m.replace(/[{}]/g, "")))]
}
