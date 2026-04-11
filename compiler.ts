// Map our frontend language values to JDoodle language codes and versions
const languageMap: Record<string, { language: string; versionIndex: string }> = {
  javascript: { language: "nodejs", versionIndex: "4" },
  typescript: { language: "nodejs", versionIndex: "4" }, // Fallback to nodejs for TS
  python: { language: "python3", versionIndex: "4" },
  java: { language: "java", versionIndex: "4" },
  cpp: { language: "cpp17", versionIndex: "1" },
};

export const executeCode = async (sourceCode: string, language: string, stdin: string = "") => {
  const langConfig = languageMap[language] || { language: "nodejs", versionIndex: "4" };

  console.log('executeCode called with:', { language, sourceCode: sourceCode.substring(0, 100) + '...', stdin });

  const response = await fetch("/api/jdoodle/execute", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      script: sourceCode,
      language: langConfig.language,
      versionIndex: langConfig.versionIndex,
      stdin,
    })
  });

  console.log('Fetch response:', response.status, response.statusText);

  if (!response.ok) {
    throw new Error(`JDoodle request failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
};
