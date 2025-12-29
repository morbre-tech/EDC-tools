const form = document.getElementById("ps-generator");
const taskDescription = document.getElementById("task-description");
const environment = document.getElementById("environment");
const includeWhatIf = document.getElementById("include-whatif");
const includeLogging = document.getElementById("include-logging");
const includeValidation = document.getElementById("include-validation");
const includeTryCatch = document.getElementById("include-trycatch");
const bestPractice = document.getElementById("best-practice");
const output = document.getElementById("script-output");
const explanation = document.getElementById("script-explanation");
const error = document.getElementById("generator-error");
const copyButton = document.getElementById("copy-script");
const downloadButton = document.getElementById("download-script");
const saveTemplateButton = document.getElementById("save-template");

const defaultScript = `# Dit PowerShell-script vises her.`;

const buildParamBlock = () => {
  const cmdletBinding = includeWhatIf.checked
    ? '[CmdletBinding(SupportsShouldProcess=$true, ConfirmImpact="Medium")]\n'
    : "[CmdletBinding()]\n";
  const taskValidation = includeValidation.checked
    ? "[Parameter(Mandatory=$true)][ValidateNotNullOrEmpty()]"
    : "[Parameter(Mandatory=$true)]";
  const environmentValidation = includeValidation.checked
    ? '[Parameter(Mandatory=$true)][ValidateSet("On-premises","M365/Exchange Online","Hybrid")]'
    : "[Parameter(Mandatory=$true)]";
  const logParam = includeLogging.checked
    ? `,\n\n  [string]$LogPath = "C:\\Logs\\workflow.log"`
    : "";

  return `${cmdletBinding}param(\n  ${taskValidation}\n  [string]$TaskDescription,\n\n  ${environmentValidation}\n  [string]$Environment${logParam}\n)\n`;
};

const buildWorkflowBody = (includeStopLog) => {
  const lines = [];
  if (bestPractice.checked) {
    lines.push('$ErrorActionPreference = "Stop"');
  }
  lines.push('Write-Verbose "Starter PowerShell workflow"');
  lines.push('Write-Host "Miljø: $Environment"');
  lines.push('Write-Host "Opgave: $TaskDescription"');
  if (includeLogging.checked) {
    lines.push('Add-Content -Path $LogPath -Value "Start: $(Get-Date) - $TaskDescription"');
  }

  if (includeWhatIf.checked) {
    lines.push('if ($PSCmdlet.ShouldProcess($TaskDescription, "Kør workflow")) {');
    lines.push('  Write-Host "Udfører opgaven..."');
    lines.push('  # TODO: Tilføj dine konkrete cmdlets her');
    lines.push("}");
  } else {
    lines.push('Write-Host "Udfører opgaven..."');
    lines.push("# TODO: Tilføj dine konkrete cmdlets her");
  }

  lines.push('Write-Verbose "Workflow er færdig"');
  if (includeLogging.checked && includeStopLog) {
    lines.push('Add-Content -Path $LogPath -Value "Stop: $(Get-Date) - Workflow afsluttet"');
  }

  return lines.join("\n");
};

const indentBlock = (text, spaces = 2) =>
  text
    .split("\n")
    .map((line) => (line ? `${" ".repeat(spaces)}${line}` : line))
    .join("\n");

const buildScript = (withComments) => {
  const header = withComments
    ? `# PowerShell workflow generator\n# Scriptet opretter en struktureret workflow ud fra din opgavebeskrivelse\n`
    : "";
  const commentBlock = withComments
    ? `\n# Logging, validering og fejl-håndtering er konfigureret ud fra dine valg.\n`
    : "\n";
  const shouldLogStop = !(includeTryCatch.checked && includeLogging.checked);
  const body = buildWorkflowBody(shouldLogStop);

  if (!includeTryCatch.checked) {
    return `${header}${buildParamBlock()}${commentBlock}${body}\n`;
  }

  const catchLines = ['Write-Error $_'];
  if (includeLogging.checked) {
    catchLines.push(
      'Add-Content -Path $LogPath -Value "Fejl: $(Get-Date) - $($_.Exception.Message)"'
    );
  }
  catchLines.push("throw");

  const finallyBlock = includeLogging.checked
    ? ` Finally {\n  Add-Content -Path $LogPath -Value "Stop: $(Get-Date) - Workflow afsluttet"\n}`
    : "";

  return `${header}${buildParamBlock()}${commentBlock}Try {\n${indentBlock(
    body
  )}\n} Catch {\n${indentBlock(catchLines.join("\n"))}\n}${finallyBlock}\n`;
};

const updateExplanation = (description) => {
  const logging = includeLogging.checked ? "med logging til fil" : "uden logging til fil";
  const validation = includeValidation.checked
    ? "med parametervalidering"
    : "uden parametervalidering";
  const errorHandling = includeTryCatch.checked
    ? "og Try/Catch-fejlhåndtering."
    : "og ingen Try/Catch-fejlhåndtering.";
  const bestPracticeNote = bestPractice.checked ? " Best-practice er aktiveret." : "";

  explanation.textContent = `Workflowet genererer et script til ${environment.value} ${logging}, ${validation} ${errorHandling}${bestPracticeNote} Opgaven: “${description}”.`;
};

const handleGenerate = (event) => {
  event.preventDefault();
  const description = taskDescription.value.trim();
  if (!description) {
    error.textContent = "Opgavebeskrivelse må ikke være tom.";
    output.textContent = defaultScript;
    explanation.textContent =
      "Udfyld felterne og generér et script for at se en kort opsummering af flowet.";
    return;
  }

  error.textContent = "";
  const format = form.querySelector("input[name='output-format']:checked").value;
  const script = buildScript(format === "commented");
  output.textContent = script;
  updateExplanation(description);
};

const copyScript = async () => {
  try {
    await navigator.clipboard.writeText(output.textContent);
    copyButton.textContent = "Kopieret!";
    setTimeout(() => {
      copyButton.textContent = "Kopier til clipboard";
    }, 1600);
  } catch (copyError) {
    error.textContent = "Kunne ikke kopiere scriptet. Prøv igen.";
  }
};

const downloadScript = () => {
  const blob = new Blob([output.textContent], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "workflow.ps1";
  link.click();
  URL.revokeObjectURL(url);
};

const saveTemplate = () => {
  saveTemplateButton.textContent = "Skabelon gemt";
  setTimeout(() => {
    saveTemplateButton.textContent = "Gem som skabelon";
  }, 1600);
};

form.addEventListener("submit", handleGenerate);
copyButton.addEventListener("click", copyScript);
downloadButton.addEventListener("click", downloadScript);
saveTemplateButton.addEventListener("click", saveTemplate);

const toolSections = document.querySelectorAll(".tool-section");
const menuButtons = document.querySelectorAll("[data-target]");

const setActiveSection = (sectionId) => {
  toolSections.forEach((section) => {
    const isActive = section.id === sectionId;
    section.classList.toggle("is-active", isActive);
    section.setAttribute("aria-hidden", (!isActive).toString());
  });

  menuButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.target === sectionId);
  });
};

menuButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveSection(button.dataset.target);
  });
});

setActiveSection("powershell-generator");
